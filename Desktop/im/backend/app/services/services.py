import pandas as pd
import json
import io
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app import models
from app.agents.agents import ReconciliationAgent, ClassificationAgent, RecommendationAgent

# PDF generation imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = logging.getLogger(__name__)

# Sample Live Assets data for the mock endpoint and local reconciliation
MOCK_LIVE_INVENTORY = [
    {
        "asset_tag": "SVR001",
        "hostname": "web-prod-01",
        "owner": "engineering",
        "environment": "production",
        "cpu": 4,
        "ram": 16,
        "storage": 100
    },
    {
        "asset_tag": "SVR002",
        "hostname": "db-prod-02",
        "owner": "finance",
        "environment": "production",
        "cpu": 8,
        "ram": 32,
        "storage": 500
    },
    {
        "asset_tag": "SVR003",
        "hostname": "cache-prod-03",
        "owner": "engineering",
        "environment": "production",
        "cpu": 2,
        "ram": 8,
        "storage": 50
    },
    {
        "asset_tag": "SVR004",
        "hostname": "web-stage-01",
        "owner": "engineering",
        "environment": "staging",
        "cpu": 2,
        "ram": 8,
        "storage": 50
    },
    {
        "asset_tag": "SVR006",
        "hostname": "unauthorized-dev-test",
        "owner": "unknown",
        "environment": "development",
        "cpu": 4,
        "ram": 16,
        "storage": 200
    },
    {
        "asset_tag": "SVR007",
        "hostname": "backup-prod-01",
        "owner": "it-ops",
        "environment": "production",
        "cpu": 4,
        "ram": 32,
        "storage": 1000
    }
]

def parse_and_save_csv(db: Session, file_content: bytes, upload_id: int) -> int:
    """
    Parses CSV contents, validates expected headers, and inserts assets into the database.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception as e:
        raise ValueError(f"Invalid CSV file format: {e}")

    required_columns = {"asset_tag", "hostname", "owner", "environment", "cpu", "ram", "storage"}
    # Convert columns to lowercase for case-insensitivity
    df.columns = [c.strip().lower() for c in df.columns]
    
    missing_cols = required_columns - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing required CSV columns: {', '.join(missing_cols)}")
        
    assets_added = 0
    for _, row in df.iterrows():
        # Validate data types
        try:
            cpu = int(row["cpu"]) if pd.notna(row["cpu"]) else 0
            ram = int(row["ram"]) if pd.notna(row["ram"]) else 0
            storage = int(row["storage"]) if pd.notna(row["storage"]) else 0
        except ValueError:
            raise ValueError(f"CPU, RAM, and Storage columns must be integers (Asset: {row.get('asset_tag')})")
            
        asset = models.Asset(
            upload_id=upload_id,
            asset_tag=str(row["asset_tag"]).strip(),
            hostname=str(row["hostname"]).strip() if pd.notna(row["hostname"]) else None,
            owner=str(row["owner"]).strip() if pd.notna(row["owner"]) else None,
            environment=str(row["environment"]).strip() if pd.notna(row["environment"]) else None,
            cpu=cpu,
            ram=ram,
            storage=storage
        )
        db.add(asset)
        assets_added += 1
        
    db.commit()
    return assets_added

def run_reconciliation_workflow(db: Session, upload_id: int) -> Dict[str, Any]:
    """
    Runs the multi-agent reconciliation pipeline:
    1. Agent 1 (Reconciliation) - compares CSV assets from db with live inventory.
    2. Agent 2 (Classification) - categorizes issues and sets severity.
    3. Agent 3 (Recommendation) - generates root cause, remediation steps, and executive summary.
    Saves everything in database and updates upload status.
    """
    # Fetch CSV Intended Assets
    db_assets = db.query(models.Asset).filter(models.Asset.upload_id == upload_id).all()
    intended_list = []
    for asset in db_assets:
        intended_list.append({
            "asset_tag": asset.asset_tag,
            "hostname": asset.hostname,
            "owner": asset.owner,
            "environment": asset.environment,
            "cpu": asset.cpu,
            "ram": asset.ram,
            "storage": asset.storage
        })
        
    # Fetch Live Assets (using mock data here)
    # In a real environment, we'd make an HTTP request to `http://localhost:8000/api/live-inventory`
    live_list = MOCK_LIVE_INVENTORY
    
    # Executing Agent 1 (Reconciliation)
    recon_agent = ReconciliationAgent()
    discrepancies = recon_agent.reconcile(intended_list, live_list)
    
    # Executing Agent 2 (Classification)
    class_agent = ClassificationAgent()
    discrepancies = class_agent.classify_issues(discrepancies)
    
    # Executing Agent 3 (Recommendation & Executive Summary)
    rec_agent = RecommendationAgent()
    agent_3_result = rec_agent.generate_recommendations(discrepancies)
    
    # Clear existing results if any (re-run support)
    db.query(models.ReconciliationResult).filter(models.ReconciliationResult.upload_id == upload_id).delete()
    db.query(models.AIReport).filter(models.AIReport.upload_id == upload_id).delete()
    
    # Save Reconciliation Results
    for item in discrepancies:
        details_str = json.dumps(item.get("details", {}))
        result_record = models.ReconciliationResult(
            upload_id=upload_id,
            asset_tag=item["asset"],
            issue_type=item["issue"],
            details=details_str,
            severity=item.get("severity"),
            classification=item.get("classification"),
            recommendation=item.get("recommendation")
        )
        db.add(result_record)
        
    # Calculate summary statistics
    total_assets = len(intended_list)
    missing_assets = sum(1 for item in discrepancies if item["issue"] == "missing_asset")
    unexpected_assets = sum(1 for item in discrepancies if item["issue"] == "unauthorized_asset")
    mismatches = len(discrepancies) - missing_assets - unexpected_assets
    critical_issues = sum(1 for item in discrepancies if item.get("severity") == "Critical")
    
    statistics = {
        "total_assets": total_assets,
        "missing_assets": missing_assets,
        "unexpected_assets": unexpected_assets,
        "mismatches": mismatches,
        "critical_issues": critical_issues
    }
    
    # Save AI Report
    ai_report_record = models.AIReport(
        upload_id=upload_id,
        executive_summary=agent_3_result.get("executive_summary", "Summary not generated."),
        statistics=json.dumps(statistics)
    )
    db.add(ai_report_record)
    
    # Update upload status
    upload = db.query(models.InventoryUpload).filter(models.InventoryUpload.id == upload_id).first()
    if upload:
        upload.status = "completed"
        
    db.commit()
    
    return {
        "status": "success",
        "discrepancies_count": len(discrepancies),
        "statistics": statistics
    }

def generate_pdf_report(db: Session, upload_id: int) -> io.BytesIO:
    """
    Generates a production-quality PDF report for the given reconciliation run.
    """
    upload = db.query(models.InventoryUpload).filter(models.InventoryUpload.id == upload_id).first()
    if not upload:
        raise ValueError("Upload record not found.")
        
    report = db.query(models.AIReport).filter(models.AIReport.upload_id == upload_id).first()
    results = db.query(models.ReconciliationResult).filter(models.ReconciliationResult.upload_id == upload_id).all()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0F172A'), # slate-900
        spaceAfter=15
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748B'), # slate-500
        spaceAfter=25
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1E293B'), # slate-800
        spaceBefore=15,
        spaceAfter=10
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#334155'), # slate-700
        leading=14,
        spaceAfter=10
    )
    
    # 1. Header Section
    story.append(Paragraph("Inventory Reconciliation Agent Report", title_style))
    story.append(Paragraph(f"Generated for: {upload.filename} | Date: {upload.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
    story.append(Spacer(1, 10))
    
    # 2. Executive Summary Section
    story.append(Paragraph("Executive Summary", h2_style))
    exec_summary_text = report.executive_summary if report else "No executive summary generated."
    story.append(Paragraph(exec_summary_text.replace('\n', '<br/>'), body_style))
    story.append(Spacer(1, 15))
    
    # 3. KPI Statistics Table
    story.append(Paragraph("Reconciliation Key Indicators", h2_style))
    stats = {}
    if report and report.statistics:
        try:
            stats = json.loads(report.statistics)
        except Exception:
            pass
            
    stats_data = [
        ["Metric", "Count"],
        ["Total Intended Assets (CSV)", str(stats.get("total_assets", len(upload.assets)))],
        ["Missing Assets", str(stats.get("missing_assets", 0))],
        ["Unexpected Assets", str(stats.get("unexpected_assets", 0))],
        ["Assets with Mismatches / Drift", str(stats.get("mismatches", 0))],
        ["Critical Issues", str(stats.get("critical_issues", 0))]
    ]
    
    stats_table = Table(stats_data, colWidths=[250, 100])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 25))
    
    # 4. Discrepancy Breakdown Table
    story.append(Paragraph("Detailed Discrepancy Breakdown", h2_style))
    
    if not results:
        story.append(Paragraph("No discrepancies were detected. Infrastructure state matches intended repository state.", body_style))
    else:
        # Columns: Asset, Issue Type, Category, Severity, Recommendation
        recon_headers = ["Asset Tag", "Category", "Severity", "Remediation Recommendation"]
        recon_rows = [recon_headers]
        
        for res in results:
            rec_paragraph = Paragraph(res.recommendation or "No recommendation.", ParagraphStyle('RecCell', parent=body_style, fontSize=8, leading=10))
            recon_rows.append([
                res.asset_tag,
                res.classification or res.issue_type.replace('_', ' ').title(),
                res.severity or "Medium",
                rec_paragraph
            ])
            
        recon_table = Table(recon_rows, colWidths=[80, 110, 70, 270])
        recon_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (2,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
        ]))
        
        # Color coding for severity column
        for i, res in enumerate(results, start=1):
            sev = (res.severity or "").lower()
            if sev == "critical":
                bg_color = colors.HexColor('#FEE2E2') # soft red
                txt_color = colors.HexColor('#991B1B')
            elif sev == "high":
                bg_color = colors.HexColor('#FFEDD5') # soft orange
                txt_color = colors.HexColor('#9A3412')
            elif sev == "medium":
                bg_color = colors.HexColor('#FEF9C3') # soft yellow
                txt_color = colors.HexColor('#854D0E')
            else:
                bg_color = colors.HexColor('#F0FDF4') # soft green
                txt_color = colors.HexColor('#166534')
                
            recon_table.setStyle(TableStyle([
                ('BACKGROUND', (2, i), (2, i), bg_color),
                ('TEXTCOLOR', (2, i), (2, i), txt_color),
                ('FONTNAME', (2, i), (2, i), 'Helvetica-Bold'),
                ('ALIGN', (2, i), (2, i), 'CENTER')
            ]))
            
        story.append(recon_table)
        
    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_csv_report(db: Session, upload_id: int) -> io.StringIO:
    """
    Generates a CSV string containing all reconciliation results.
    """
    results = db.query(models.ReconciliationResult).filter(models.ReconciliationResult.upload_id == upload_id).all()
    
    output = io.StringIO()
    # Write Header
    output.write("Asset Tag,Issue Type,Classification,Severity,Intended State,Live State,Remediation Recommendation\n")
    
    import csv
    writer = csv.writer(output)
    
    for res in results:
        details = {}
        if res.details:
            try:
                details = json.loads(res.details)
            except Exception:
                pass
                
        intended_str = json.dumps(details.get("intended", {})) if details.get("intended") else ""
        live_str = json.dumps(details.get("live", {})) if details.get("live") else ""
        
        writer.writerow([
            res.asset_tag,
            res.issue_type,
            res.classification or "",
            res.severity or "",
            intended_str,
            live_str,
            res.recommendation or ""
        ])
        
    output.seek(0)
    return output

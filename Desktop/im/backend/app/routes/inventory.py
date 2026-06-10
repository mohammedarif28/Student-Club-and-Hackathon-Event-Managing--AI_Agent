import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies import get_current_user
from app import models, schemas
from app.services import services

router = APIRouter(prefix="/api", tags=["Inventory"])

@router.post("/upload", response_model=schemas.UploadHistoryOut)
async def upload_inventory(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported."
        )
        
    # Read content
    contents = await file.read()
    
    # Store upload history record
    upload_record = models.InventoryUpload(
        filename=file.filename,
        uploaded_by_id=current_user.id,
        status="pending"
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)
    
    try:
        # Parse CSV and save assets
        services.parse_and_save_csv(db, contents, upload_record.id)
    except ValueError as ve:
        # Mark upload as failed
        upload_record.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        upload_record.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during CSV parsing: {str(e)}"
        )
        
    return upload_record

@router.get("/live-inventory")
def get_live_inventory():
    """
    Mock Live Inventory endpoint
    Returns live asset list.
    """
    return services.MOCK_LIVE_INVENTORY

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Fetch recent uploads
    recent_uploads = db.query(models.InventoryUpload).order_by(models.InventoryUpload.uploaded_at.desc()).limit(10).all()
    
    # Fetch latest completed upload for stats
    latest_completed = db.query(models.InventoryUpload).filter(models.InventoryUpload.status == "completed").order_by(models.InventoryUpload.uploaded_at.desc()).first()
    
    total_assets = 0
    missing_assets = 0
    unexpected_assets = 0
    mismatches = 0
    critical_issues = 0
    severity_distribution = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    issue_type_distribution = {
        "missing_asset": 0,
        "unauthorized_asset": 0,
        "hostname_mismatch": 0,
        "owner_mismatch": 0,
        "environment_drift": 0,
        "configuration_drift": 0
    }
    
    if latest_completed:
        # Get count of total assets from intended upload
        total_assets = db.query(models.Asset).filter(models.Asset.upload_id == latest_completed.id).count()
        
        # Get report stats
        report = db.query(models.AIReport).filter(models.AIReport.upload_id == latest_completed.id).first()
        if report and report.statistics:
            try:
                stats = json.loads(report.statistics)
                missing_assets = stats.get("missing_assets", 0)
                unexpected_assets = stats.get("unexpected_assets", 0)
                mismatches = stats.get("mismatches", 0)
                critical_issues = stats.get("critical_issues", 0)
            except Exception:
                pass
                
        # Group reconciliation results
        results = db.query(models.ReconciliationResult).filter(models.ReconciliationResult.upload_id == latest_completed.id).all()
        for r in results:
            sev = r.severity or "Medium"
            severity_distribution[sev] = severity_distribution.get(sev, 0) + 1
            
            issue = r.issue_type
            issue_type_distribution[issue] = issue_type_distribution.get(issue, 0) + 1
            
    return {
        "total_assets": total_assets,
        "missing_assets": missing_assets,
        "unexpected_assets": unexpected_assets,
        "mismatches": mismatches,
        "critical_issues": critical_issues,
        "severity_distribution": severity_distribution,
        "issue_type_distribution": issue_type_distribution,
        "recent_uploads": recent_uploads
    }

@router.get("/uploads", response_model=List[schemas.UploadHistoryOut])
def get_all_uploads(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns list of all uploads.
    """
    return db.query(models.InventoryUpload).order_by(models.InventoryUpload.uploaded_at.desc()).all()

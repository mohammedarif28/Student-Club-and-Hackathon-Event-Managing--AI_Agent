from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.dependencies import get_current_user
from app import models, schemas
from app.services import services

router = APIRouter(prefix="/api", tags=["Reconciliation"])

class ReconcileRequest(BaseModel):
    upload_id: Optional[int] = None

@router.post("/reconcile")
def reconcile_inventory(
    req: ReconcileRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    upload_id = req.upload_id
    
    # If upload_id is not provided, fetch the latest upload that is pending
    if not upload_id:
        latest_upload = db.query(models.InventoryUpload).order_by(models.InventoryUpload.uploaded_at.desc()).first()
        if not latest_upload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No inventory uploads found to reconcile."
            )
        upload_id = latest_upload.id
    else:
        upload = db.query(models.InventoryUpload).filter(models.InventoryUpload.id == upload_id).first()
        if not upload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory upload with ID {upload_id} not found."
            )
            
    try:
        # Run workflow
        result = services.run_reconciliation_workflow(db, upload_id)
        return result
    except Exception as e:
        # Mark upload as failed on system error
        upload = db.query(models.InventoryUpload).filter(models.InventoryUpload.id == upload_id).first()
        if upload:
            upload.status = "failed"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reconciliation failed: {str(e)}"
        )

@router.get("/results", response_model=List[schemas.ReconciliationResultOut])
def get_reconciliation_results(
    upload_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # If upload_id not specified, find latest completed upload
    if not upload_id:
        latest_completed = db.query(models.InventoryUpload).filter(models.InventoryUpload.status == "completed").order_by(models.InventoryUpload.uploaded_at.desc()).first()
        if not latest_completed:
            return []
        upload_id = latest_completed.id
        
    results = db.query(models.ReconciliationResult).filter(models.ReconciliationResult.upload_id == upload_id).all()
    return results

@router.get("/report")
def get_report(
    upload_id: Optional[int] = Query(None),
    format: str = Query("pdf", regex="^(pdf|csv)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not upload_id:
        latest_completed = db.query(models.InventoryUpload).filter(models.InventoryUpload.status == "completed").order_by(models.InventoryUpload.uploaded_at.desc()).first()
        if not latest_completed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No completed reconciliation runs found."
            )
        upload_id = latest_completed.id
    else:
        upload = db.query(models.InventoryUpload).filter(models.InventoryUpload.id == upload_id).first()
        if not upload or upload.status != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reconciliation has not been successfully run for this upload."
            )
            
    if format == "pdf":
        try:
            pdf_buffer = services.generate_pdf_report(db, upload_id)
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=reconciliation_report_{upload_id}.pdf"}
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate PDF: {str(e)}"
            )
    else:
        try:
            csv_io = services.generate_csv_report(db, upload_id)
            return Response(
                content=csv_io.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=reconciliation_report_{upload_id}.csv"}
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate CSV: {str(e)}"
            )

@router.get("/report/summary")
def get_ai_report_summary(
    upload_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not upload_id:
        latest_completed = db.query(models.InventoryUpload).filter(models.InventoryUpload.status == "completed").order_by(models.InventoryUpload.uploaded_at.desc()).first()
        if not latest_completed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No completed reconciliation runs found."
            )
        upload_id = latest_completed.id
        
    report = db.query(models.AIReport).filter(models.AIReport.upload_id == upload_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI report summary not found for this run."
        )
    return {
        "upload_id": upload_id,
        "executive_summary": report.executive_summary,
        "statistics": json.loads(report.statistics) if report.statistics else {}
    }

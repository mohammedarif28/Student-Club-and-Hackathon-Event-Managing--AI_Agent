from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies import get_current_user
from app import models, schemas
from app.agents.agents import ChatAssistant

router = APIRouter(prefix="/api/chat", tags=["AI Chat Assistant"])

@router.post("", response_model=schemas.ChatResponse)
def chat_with_assistant(
    prompt: schemas.ChatPrompt,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Fetch recent chat history for context
    history_records = db.query(models.ChatHistory)\
        .filter(models.ChatHistory.user_id == current_user.id)\
        .order_by(models.ChatHistory.created_at.asc())\
        .limit(20).all()
        
    chat_history = []
    for r in history_records:
        chat_history.append({
            "role": r.role,
            "message": r.message
        })
        
    # Get latest completed upload results
    latest_completed = db.query(models.InventoryUpload)\
        .filter(models.InventoryUpload.status == "completed")\
        .order_by(models.InventoryUpload.uploaded_at.desc())\
        .first()
        
    results_summary = []
    if latest_completed:
        results = db.query(models.ReconciliationResult)\
            .filter(models.ReconciliationResult.upload_id == latest_completed.id)\
            .all()
        for res in results:
            results_summary.append({
                "asset_tag": res.asset_tag,
                "issue_type": res.issue_type,
                "classification": res.classification,
                "severity": res.severity,
                "recommendation": res.recommendation,
                "details": res.details
            })
            
    # Run Chat Assistant
    assistant = ChatAssistant()
    try:
        reply = assistant.answer_query(prompt.message, results_summary, chat_history)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat agent failure: {str(e)}"
        )
        
    # Save User message to database
    user_msg = models.ChatHistory(
        user_id=current_user.id,
        role="user",
        message=prompt.message
    )
    db.add(user_msg)
    
    # Save Assistant message to database
    assistant_msg = models.ChatHistory(
        user_id=current_user.id,
        role="assistant",
        message=reply
    )
    db.add(assistant_msg)
    
    db.commit()
    
    return {"response": reply}

@router.get("/history", response_model=List[schemas.ChatMessageOut])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    history = db.query(models.ChatHistory)\
        .filter(models.ChatHistory.user_id == current_user.id)\
        .order_by(models.ChatHistory.created_at.asc())\
        .all()
    return history

@router.delete("/history")
def clear_chat_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Chat history cleared successfully."}

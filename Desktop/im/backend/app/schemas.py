from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True

# Upload Schemas
class UploadHistoryOut(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    status: str
    uploaded_by_id: int

    class Config:
        from_attributes = True

# Asset Schemas
class AssetOut(BaseModel):
    id: int
    upload_id: int
    asset_tag: str
    hostname: Optional[str] = None
    owner: Optional[str] = None
    environment: Optional[str] = None
    cpu: Optional[int] = None
    ram: Optional[int] = None
    storage: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Reconciliation Result Schemas
class ReconciliationResultOut(BaseModel):
    id: int
    upload_id: int
    asset_tag: str
    issue_type: str
    details: Optional[str] = None  # JSON string
    severity: Optional[str] = None
    classification: Optional[str] = None
    recommendation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# AI Report Schemas
class AIReportOut(BaseModel):
    id: int
    upload_id: int
    executive_summary: str
    statistics: Optional[str] = None  # JSON string
    created_at: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatPrompt(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class ChatMessageOut(BaseModel):
    id: int
    role: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_assets: int
    missing_assets: int
    unexpected_assets: int
    mismatches: int
    critical_issues: int
    severity_distribution: Dict[str, int]
    issue_type_distribution: Dict[str, int]
    recent_uploads: List[UploadHistoryOut]

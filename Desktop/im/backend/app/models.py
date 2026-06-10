import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    uploads = relationship("InventoryUpload", back_populates="uploader")
    chat_history = relationship("ChatHistory", back_populates="user")


class InventoryUpload(Base):
    __tablename__ = "inventory_uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")

    uploader = relationship("User", back_populates="uploads")
    assets = relationship("Asset", back_populates="upload")
    reconciliation_results = relationship(
        "ReconciliationResult",
        back_populates="upload"
    )
    ai_reports = relationship(
        "AIReport",
        back_populates="upload"
    )


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("inventory_uploads.id"))

    asset_tag = Column(String, index=True)
    hostname = Column(String)
    owner = Column(String)
    environment = Column(String)

    cpu = Column(Integer)
    ram = Column(Integer)
    storage = Column(Integer)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    upload = relationship("InventoryUpload", back_populates="assets")


class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("inventory_uploads.id"))

    asset_tag = Column(String)
    issue_type = Column(String)

    details = Column(Text)
    severity = Column(String)
    classification = Column(String)
    recommendation = Column(Text)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    upload = relationship(
        "InventoryUpload",
        back_populates="reconciliation_results"
    )


class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("inventory_uploads.id"))

    executive_summary = Column(Text)
    statistics = Column(Text)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    upload = relationship(
        "InventoryUpload",
        back_populates="ai_reports"
    )


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    role = Column(String)
    message = Column(Text)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship(
        "User",
        back_populates="chat_history"
    )
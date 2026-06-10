import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app import models
from app.routes import auth, inventory, reconcile, chat
from app.utils.security import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Inventory Reconciliation Agent API",
    description="Backend services for checking discrepancies between intended inventory spreadsheets and live state using Gemini.",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(reconcile.router)
app.include_router(chat.router)

@app.on_event("startup")
def startup_event():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seed default credentials admin/admin123
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            logger.info("Seeding default admin account (username: admin, password: admin123)...")
            admin_user = models.User(
                username="admin",
                password_hash=get_password_hash("admin123")
            )
            db.add(admin_user)
            db.commit()
            logger.info("Admin user created successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "app": "Inventory Reconciliation Agent API",
        "status": "online",
        "documentation": "/docs"
    }

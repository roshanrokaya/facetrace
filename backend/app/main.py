from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.api.v1 import auth, users, persons, faces, cameras, events, trace, analytics, reports, alerts, ws
from app.db.session import engine
from app.db.base import Base
from app.core.config import settings
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Face Trace API",
    description="Face recognition system for campus entry tracking and analytics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(persons.router, prefix="/api/v1/persons", tags=["persons"])
app.include_router(faces.router, prefix="/api/v1/persons", tags=["faces"])
app.include_router(cameras.router, prefix="/api/v1/cameras", tags=["cameras"])
app.include_router(events.router, prefix="/api/v1/events", tags=["events"])
app.include_router(trace.router, prefix="/api/v1/trace", tags=["trace"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(ws.router, prefix="/api/v1", tags=["websocket"])


@app.get("/")
def root():
    return {"message": "Face Trace API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/v1/images/{filename}")
async def get_image(filename: str):
    """Serve uploaded face images."""
    file_path = os.path.join("storage/enrollments", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Image not found"}, 404


@app.get("/api/v1/snapshots/{filename}")
async def get_snapshot(filename: str):
    """Serve face crop snapshots from detection events."""
    file_path = os.path.join("storage/snapshots", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Snapshot not found"}, 404

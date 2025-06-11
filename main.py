"""
Face Recognition API - Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

# Import database module
from app.database import create_tables

# Create FastAPI app
app = FastAPI(
    title="Face Recognition API",
    description="API for face recognition system with user registration, verification and access control",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],  # Explicitly allowed origins for development; restrict to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Create folders for image storage and initialize database
@app.on_event("startup")
def setup():
    print("Starting application setup...")
    os.makedirs("unknown_faces", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)
    create_tables()  # Create database tables
    print("Application setup complete!")

# Import routers after database setup to avoid circular imports
from app.routers import auth, users, access, admin, cameras

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(access.router, prefix="/api", tags=["Access Control"])
app.include_router(admin.router, prefix="/api", tags=["Administration"])
app.include_router(cameras.router, prefix="/api", tags=["Cameras"])

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

# Serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/unknown-faces", StaticFiles(directory="unknown_faces"), name="unknown_faces")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


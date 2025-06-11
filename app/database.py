"""
Database module for the Face Recognition API
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime
import os

# Database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./face_recognition.db"  # Use SQLite for development; consider PostgreSQL for production
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)  # Unique identifier for the user
    name = Column(String, index=True)  # User's full name
    email = Column(String, nullable=True, unique=True, index=True)  # User's email (unique, optional)
    hashed_password = Column(String, nullable=True)  # Hashed password for authentication
    phone = Column(String, nullable=True)  # User's phone number
    employee_id = Column(String, nullable=True)  # Employee ID for employees
    department = Column(String, nullable=True)  # Department for employees
    position = Column(String, nullable=True)  # Job position for employees
    room_number = Column(String, nullable=True)  # Room number for guests or employees
    reservation_number = Column(String, nullable=True)  # Reservation number for guests
    face_descriptor = Column(String, nullable=True)  # JSON string storing face descriptor
    face_image_path = Column(String, nullable=True)  # Path to stored face image
    user_type = Column(String)  # Type of user: "guest" or "employee"
    is_active = Column(Boolean, default=True)  # Account activation status
    created_at = Column(DateTime, default=datetime.now)  # Account creation timestamp
    last_access = Column(DateTime, nullable=True)  # Last access timestamp
    
    # Relationships
    access_logs = relationship("AccessLog", back_populates="user")

class AccessLog(Base):
    __tablename__ = "access_logs"
    
    id = Column(Integer, primary_key=True, index=True)  # Unique identifier for the log entry
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Foreign key to users table
    access_time = Column(DateTime, default=datetime.now)  # Timestamp of access attempt
    success = Column(Boolean, default=False)  # Whether the access attempt was successful
    confidence = Column(Float, nullable=True)  # Confidence score for face recognition
    location = Column(String, nullable=True)  # Location of access attempt
    image_path = Column(String, nullable=True)  # Path to saved image (for unknown faces)
    
    # Relationships
    user = relationship("User", back_populates="access_logs")
    lock = relationship("SmartLock", back_populates="access_logs", foreign_keys=[location], primaryjoin="SmartLock.location==AccessLog.location")

class SmartLock(Base):
    __tablename__ = "smart_locks"
    
    id = Column(Integer, primary_key=True, index=True)  # Unique identifier for the lock
    device_id = Column(String, unique=True, index=True)  # Unique device ID for the lock
    name = Column(String, nullable=False)  # Name of the lock (e.g., "Main Entrance Lock")
    location = Column(String, nullable=False, index=True)  # Location of the lock (e.g., "Room 101")
    ip_address = Column(String, nullable=False)  # IP address for lock communication
    api_key = Column(String, nullable=False)  # API key for secure lock communication
    status = Column(String, default="locked")  # Lock status: "locked" or "unlocked"
    last_status = Column(String, default="registered")  # Last status update (e.g., "registered", "active")
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)  # Last update timestamp
    
    # Relationship to access logs
    access_logs = relationship("AccessLog", back_populates="lock", foreign_keys=[AccessLog.location], primaryjoin="SmartLock.location==AccessLog.location")

class Camera(Base):
    __tablename__ = "cameras"
    
    id = Column(Integer, primary_key=True, index=True)  # Unique identifier for the camera
    device_id = Column(String, unique=True, index=True)  # Unique device ID for the camera
    name = Column(String, nullable=False)  # Name of the camera (e.g., "Lobby Camera")
    location = Column(String, nullable=False, index=True)  # Location of the camera (e.g., "Room 101")
    ip_address = Column(String, nullable=False)  # IP address for camera communication
    status = Column(String, default="active")  # Camera status: "active" or "inactive"
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)  # Last update timestamp

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
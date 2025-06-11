"""
FastAPI Backend for Face Recognition System

This code provides a complete API for:
1. User registration with face recognition
2. Face verification
3. Employee authentication
4. Tracking unknown faces

Requirements:
- Python 3.8+
- FastAPI
- face_recognition 
- uvicorn
- SQLAlchemy
- python-multipart
- pillow

Install with: pip install fastapi uvicorn face_recognition sqlalchemy python-multipart pillow
Run with: uvicorn backend_code:app --reload
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, LargeBinary, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Optional, Dict, Any
import face_recognition
import numpy as np
import uvicorn
import os
import io
from PIL import Image
from datetime import datetime
import base64
import uuid
import json

# Create FastAPI app
app = FastAPI(title="Face Recognition API", 
              description="API for face recognition system",
              version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directory for unknown faces if it doesn't exist
os.makedirs("unknown_faces", exist_ok=True)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./face_recognition.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)
    room_number = Column(String, nullable=True)
    reservation_number = Column(String, nullable=True)
    face_encoding = Column(String, nullable=True)  # Store as base64 string
    face_image = Column(String, nullable=True)  # Store base64 image
    user_type = Column(String)  # "guest" or "employee"
    created_at = Column(DateTime, default=datetime.now)

class AccessLog(Base):
    __tablename__ = "access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # Null for unknown users
    access_time = Column(DateTime, default=datetime.now)
    success = Column(Boolean, default=False)
    image_path = Column(String, nullable=True)  # Path to saved image (for unknown faces)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
def process_image(image: UploadFile) -> np.ndarray:
    """Process uploaded image and return face encoding"""
    try:
        # Read image file
        contents = image.file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB (in case of RGBA)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        # Convert PIL Image to numpy array
        image_array = np.array(image)
        
        # Get face encoding
        face_locations = face_recognition.face_locations(image_array)
        
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in image")
            
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if not face_encodings:
            raise HTTPException(status_code=400, detail="Failed to encode face")
            
        return face_encodings[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    finally:
        image.file.close()

def process_base64_image(base64_image: str) -> np.ndarray:
    """Process base64 image and return face encoding"""
    try:
        # Remove data:image/jpeg;base64, prefix if present
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
            
        # Decode base64 image
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB (in case of RGBA)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        # Convert PIL Image to numpy array
        image_array = np.array(image)
        
        # Get face encoding
        face_locations = face_recognition.face_locations(image_array)
        
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in image")
            
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if not face_encodings:
            raise HTTPException(status_code=400, detail="Failed to encode face")
            
        return face_encodings[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

def encode_face_encoding(encoding: np.ndarray) -> str:
    """Convert numpy array to base64 string for storage"""
    return base64.b64encode(encoding.tobytes()).decode('utf-8')

def decode_face_encoding(encoding_str: str) -> np.ndarray:
    """Convert base64 string back to numpy array"""
    decoded = base64.b64decode(encoding_str)
    return np.frombuffer(decoded, dtype=np.float64)

def save_unknown_face(image_file):
    """Save unknown face image and return path"""
    try:
        # Create unique filename
        filename = f"unknown_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex}.jpg"
        path = os.path.join("unknown_faces", filename)
        
        # Reset file pointer
        image_file.file.seek(0)
        
        # Save file
        with open(path, "wb") as f:
            f.write(image_file.file.read())
            
        return path
    except Exception as e:
        print(f"Error saving unknown face: {e}")
        return None

# Routes
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "API is running"}

# Original registration endpoint
@app.post("/register")
async def register_user(
    name: str = Form(...),
    room_number: str = Form(...),
    reservation_number: str = Form(...),
    user_type: str = Form(...),  # "guest" or "employee"
    face_image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Register a new user with face recognition"""
    try:
        # Process face image
        face_encoding = process_image(face_image)
        
        # Encode face encoding for storage
        face_encoding_str = encode_face_encoding(face_encoding)
        
        # Create new user
        db_user = User(
            name=name,
            room_number=room_number,
            reservation_number=reservation_number,
            face_encoding=face_encoding_str,
            user_type=user_type
        )
        
        # Add to database
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": db_user.id
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

# New API endpoint to match frontend path
@app.post("/api/users/register")
async def api_register_user(
    user_data: Dict[Any, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Register a new user with face recognition - API endpoint for frontend"""
    try:
        print(f"Received registration data: {user_data}")
        
        # Extract user data
        name = user_data.get('name', '')
        email = user_data.get('email', '')
        phone = user_data.get('phone', '')
        employee_id = user_data.get('employeeId', '')
        department = user_data.get('department', '')
        position = user_data.get('position', '')
        face_image = user_data.get('faceImage', '')
        
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
            
        if not face_image:
            raise HTTPException(status_code=400, detail="Face image is required")
        
        # Process face image from base64
        try:
            face_encoding = process_base64_image(face_image)
            face_encoding_str = encode_face_encoding(face_encoding)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid face image: {str(e)}")
        
        # Create new user
        db_user = User(
            name=name,
            email=email,
            phone=phone,
            employee_id=employee_id,
            department=department,
            position=position,
            face_encoding=face_encoding_str,
            face_image=face_image,  # Store the original image too
            user_type="employee"  # Assuming this endpoint is for employees
        )
        
        # Add to database
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user": {
                "id": db_user.id,
                "name": db_user.name,
                "email": db_user.email,
                "phone": db_user.phone,
                "employeeId": db_user.employee_id,
                "department": db_user.department,
                "position": db_user.position
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/verify")
async def verify_face(
    face_image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Verify a face against registered users"""
    try:
        # Process face image
        face_encoding = process_image(face_image)
        
        # Get all users from database
        users = db.query(User).all()
        
        if not users:
            # Log access attempt by unknown user
            image_path = save_unknown_face(face_image)
            
            access_log = AccessLog(
                user_id=None,
                success=False,
                image_path=image_path
            )
            db.add(access_log)
            db.commit()
            
            return {
                "success": False,
                "message": "No users registered in the system"
            }
            
        # Compare face with registered users
        best_match = None
        best_match_distance = float('inf')
        
        for user in users:
            # Skip users without face encoding
            if not user.face_encoding:
                continue
                
            # Get stored face encoding
            stored_encoding = decode_face_encoding(user.face_encoding)
            
            # Compare face encodings
            distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
            
            # Check if this is a better match
            if distance < best_match_distance:
                best_match = user
                best_match_distance = distance
        
        # Threshold for face recognition (lower is more strict)
        threshold = 0.6
        
        if best_match_distance <= threshold:
            # Log successful access
            access_log = AccessLog(
                user_id=best_match.id,
                success=True
            )
            db.add(access_log)
            db.commit()
            
            return {
                "success": True,
                "message": "Face verified successfully",
                "user": {
                    "id": best_match.id,
                    "name": best_match.name,
                    "room_number": best_match.room_number,
                    "reservation_number": best_match.reservation_number,
                    "user_type": best_match.user_type
                },
                "confidence": 1 - best_match_distance
            }
        else:
            # Log access attempt by unknown user
            image_path = save_unknown_face(face_image)
            
            access_log = AccessLog(
                user_id=None,
                success=False,
                image_path=image_path
            )
            db.add(access_log)
            db.commit()
            
            return {
                "success": False,
                "message": "Face not recognized"
            }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.post("/employee/login")
async def employee_login(
    face_image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Verify an employee face for login"""
    try:
        # Process face image
        face_encoding = process_image(face_image)
        
        # Get all employees from database
        employees = db.query(User).filter(User.user_type == "employee").all()
        
        if not employees:
            return {
                "success": False,
                "message": "No employees registered in the system"
            }
            
        # Compare face with registered employees
        best_match = None
        best_match_distance = float('inf')
        
        for employee in employees:
            # Skip employees without face encoding
            if not employee.face_encoding:
                continue
                
            # Get stored face encoding
            stored_encoding = decode_face_encoding(employee.face_encoding)
            
            # Compare face encodings
            distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
            
            # Check if this is a better match
            if distance < best_match_distance:
                best_match = employee
                best_match_distance = distance
        
        # Threshold for face recognition (lower is more strict)
        threshold = 0.6
        
        if best_match_distance <= threshold:
            # Log successful access
            access_log = AccessLog(
                user_id=best_match.id,
                success=True
            )
            db.add(access_log)
            db.commit()
            
            return {
                "success": True,
                "message": "Employee login successful",
                "employee": {
                    "id": best_match.id,
                    "name": best_match.name,
                    "user_type": best_match.user_type
                },
                "confidence": 1 - best_match_distance
            }
        else:
            # Log access attempt by unknown user
            image_path = save_unknown_face(face_image)
            
            access_log = AccessLog(
                user_id=None,
                success=False,
                image_path=image_path
            )
            db.add(access_log)
            db.commit()
            
            return {
                "success": False,
                "message": "Employee not recognized"
            }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Employee login failed: {str(e)}")

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    """Get all registered users"""
    users = db.query(User).all()
    
    return [{
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "employee_id": user.employee_id,
        "department": user.department,
        "position": user.position,
        "room_number": user.room_number,
        "reservation_number": user.reservation_number,
        "user_type": user.user_type,
        "created_at": user.created_at
    } for user in users]

@app.get("/access-logs")
def get_access_logs(db: Session = Depends(get_db)):
    """Get all access logs"""
    logs = db.query(AccessLog).all()
    
    result = []
    for log in logs:
        log_entry = {
            "id": log.id,
            "user_id": log.user_id,
            "access_time": log.access_time,
            "success": log.success,
            "image_path": log.image_path
        }
        
        # Add user info if available
        if log.user_id:
            user = db.query(User).filter(User.id == log.user_id).first()
            if user:
                log_entry["user"] = {
                    "name": user.name,
                    "room_number": user.room_number,
                    "user_type": user.user_type
                }
                
        result.append(log_entry)
    
    return result

# Serve static files (unknown faces)
app.mount("/unknown-faces", StaticFiles(directory="unknown_faces"), name="unknown_faces")

if __name__ == "__main__":
    uvicorn.run("backend_code:app", host="0.0.0.0", port=8000, reload=True)

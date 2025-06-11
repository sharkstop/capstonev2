"""
Access control module for the Face Recognition API
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import aiofiles
import io
from datetime import datetime
from app.database import get_db, User, AccessLog
from app.schemas import AccessLogResponse, VerificationResult  # تغيير VerifyResponse إلى VerificationResult
from app.utils.face_utils import process_face_image
from app.utils.face_recognition import compare_face_with_database, save_unknown_face, log_access_attempt
from app.utils.smart_lock import unlock_door
import logging

# Router
router = APIRouter()

@router.post("/verify", response_model=VerificationResult)
async def verify_face(
    face_image: UploadFile = File(...),
    location: Optional[str] = Form(None),
    device_id: Optional[str] = Form(None),
    unlock: Optional[bool] = Form(False),
    db: Session = Depends(get_db)
):
    """
    Verify a face against registered users
    Can optionally unlock a door if face is recognized and unlock=True
    """
    logging.info(f"verify_face called. Location: {location}, Device ID: {device_id}, Unlock: {unlock}")
    try:
        # Store original image data for potential unknown face storage
        image_data = await face_image.read()
        
        # Reset file position
        face_image.file = io.BytesIO(image_data)
        
        # Process face image
        face_encoding = await process_face_image(face_image)
        
        # Compare with database
        logging.info(f"Starting face comparison for location: {location}, device_id: {device_id}")
        user, confidence = compare_face_with_database(db, face_encoding)
        logging.info(f"Face comparison completed. User found: {bool(user)}, Confidence: {confidence:.4f}")
        
        if user:
            # Log successful access
            log_access_attempt(
                db, 
                user_id=user.id,
                success=True,
                confidence=confidence,
                location=location,
                device_id=device_id
            )
            
            # Update last access time for user
            user.last_access = datetime.now()
            db.commit()
            
            # Unlock door if requested
            door_unlocked = False
            if unlock and location:
                try:
                    await unlock_door(db, location, user.id)
                    door_unlocked = True
                except Exception as e:
                    print(f"Door unlock failed: {e}")
            
            return {
                "success": True,
                "message": "Face verified successfully",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "room_number": user.room_number,
                    "user_type": user.user_type
                },
                "confidence": confidence,
                "door_unlocked": door_unlocked  # حقل إضافي
            }
        else:
            # Save unknown face
            image_path = None
            
            # Reset file position again
            face_image.file = io.BytesIO(image_data)
            
            # Save unknown face and log access attempt
            image_path = save_unknown_face(image_data, location, device_id)
            
            log_access_attempt(
                db,
                user_id=None,
                success=False,
                confidence=confidence,
                image_path=image_path,
                location=location,
                device_id=device_id
            )
            
            return {
                "success": False,
                "message": "Face not recognized",
                "confidence": confidence,
                "door_unlocked": False
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@router.get("/access-logs", response_model=List[AccessLogResponse])
async def get_access_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    success: Optional[bool] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get access logs with optional filtering"""
    query = db.query(AccessLog)
    
    # Apply filters if provided
    if user_id is not None:
        query = query.filter(AccessLog.user_id == user_id)
    
    if success is not None:
        query = query.filter(AccessLog.success == success)
    
    if location:
        query = query.filter(AccessLog.location == location)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(AccessLog.access_time >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(AccessLog.access_time <= end)
        except ValueError:
            pass
    
    # Order by most recent first
    query = query.order_by(AccessLog.access_time.desc())
    
    # Paginate results
    logs = query.offset(skip).limit(limit).all()
    
    # Construct response
    result = []
    for log in logs:
        log_entry = {
            "id": log.id,
            "user_id": log.user_id,
            "access_time": log.access_time,
            "success": log.success,
            "confidence": log.confidence,
            "location": log.location,
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
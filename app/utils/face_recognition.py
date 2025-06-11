import face_recognition
import uuid
import os
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Tuple, Optional, List
from fastapi import HTTPException, UploadFile
from app.database import User, AccessLog
import json
import numpy as np
from PIL import Image
import logging

def ensure_directory_exists(directory: str):
    """Ensure the directory exists, create it if it doesn't"""
    if not os.path.exists(directory):
        os.makedirs(directory)

def decode_face_encoding(encoded_str: str) -> Optional[np.ndarray]:
    """Decode a JSON string face encoding to numpy array"""
    if not encoded_str:
        logging.warning("Input 'encoded_str' is None or empty.")
        return None
    try:
        data = json.loads(encoded_str)
        return np.array(data, dtype=np.float64)
    except (json.JSONDecodeError, ValueError) as e:
        logging.warning(f"Error decoding face encoding: {e}. Input string: '{encoded_str}'")
        return None

def compare_face_with_database(db: Session, face_encoding: np.ndarray, threshold: float = 0.6, user_type: Optional[str] = None) -> Tuple[Optional[User], float]:
    """
    Compare a face encoding with all users in the database
    Returns the best match user and confidence score
    """
    logging.info("compare_face_with_database called.")
    if not isinstance(face_encoding, np.ndarray) or face_encoding.size == 0:
        # Consider logging here if this check isn't expected to be hit due to upstream validation
        raise HTTPException(status_code=400, detail="Invalid face encoding provided")

    try:
        query = db.query(User).filter(User.is_active == True)
        if user_type:
            query = query.filter(User.user_type == user_type)
        users = query.all()
        logging.info(f"Retrieved {len(users)} active users from database (user_type: {user_type if user_type else 'any'}).")
    except Exception as e:
        logging.error(f"Database error while fetching users: {e}")
        # Depending on expected behavior, either re-raise or return a default
        return None, 0.0 # Or raise HTTPException(status_code=500, detail="Database error")

    if not users:
        logging.info("No active users found matching criteria.")
        return None, 0.0

    best_match = None
    best_match_distance = float('inf')

    try:
        for user in users:
            if not user.face_descriptor:
                logging.warning(f"User ID {user.id} has no face_descriptor. Skipping.")
                continue

            stored_encoding = decode_face_encoding(user.face_descriptor)

            if stored_encoding is None:
                logging.warning(f"Failed to decode face_descriptor for User ID {user.id}. Skipping.")
                continue

            if stored_encoding.size != face_encoding.size:
                logging.warning(f"Face encoding size mismatch for User ID {user.id}. DB: {stored_encoding.size}, Input: {face_encoding.size}. Skipping.")
                continue

            distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
            if distance < best_match_distance:
                best_match = user
                best_match_distance = distance
    except Exception as e:
        user_id_for_log = user.id if 'user' in locals() and hasattr(user, 'id') else "unknown"
        logging.error(f"Error during face comparison loop for User ID {user_id_for_log}: {e}")
        # Decide if to continue with users processed so far or return error
        # For now, let's assume we stop and return based on matches found *before* the error
        # If no matches yet, this will effectively be (None, 0.0) after confidence calculation

    confidence = max(0, 1 - best_match_distance) if best_match_distance <= 1.0 else 0

    final_match_user_id = best_match.id if best_match else "No match"
    if best_match and best_match_distance <= threshold:
        logging.info(f"Best match found: User ID {final_match_user_id}, Confidence: {confidence:.4f}, Distance: {best_match_distance:.4f}. Threshold: {threshold}")
        return best_match, confidence
    else:
        if best_match: # Match found but below threshold
            logging.info(f"Match found (User ID {best_match.id}, Distance: {best_match_distance:.4f}) but below threshold {threshold}. Confidence: {confidence:.4f}. Returning no match.")
        else: # No match at all or error led to no best_match
             logging.info(f"No suitable match found. Best distance: {best_match_distance:.4f}, Confidence: {confidence:.4f}. Threshold: {threshold}")
        return None, confidence

def save_unknown_face(image_file: UploadFile, location: Optional[str] = None, device_id: Optional[str] = None) -> Optional[str]:
    """Save unknown face image from UploadFile and return path"""
    try:
        ensure_directory_exists("unknown_faces")
        if not image_file or image_file.size == 0:
            raise ValueError("Invalid image file")

        # Convert UploadFile to PIL Image and save
        image = Image.open(image_file.file).convert("RGB")
        filename = f"unknown_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex}.jpg"
        path = os.path.join("unknown_faces", filename)

        image.save(path, "JPEG", quality=85)
        return path
    except Exception as e:
        print(f"Error saving unknown face: {e}")
        return None

def log_access_attempt(db: Session, user_id: Optional[int] = None, success: bool = False, confidence: float = 0.0, image_path: Optional[str] = None, location: Optional[str] = None, device_id: Optional[str] = None) -> Optional[int]:
    """Log an access attempt with proper error handling"""
    try:
        access_log = AccessLog(
            user_id=user_id,
            success=success,
            confidence=confidence,
            image_path=image_path,
            location=location,
            device_id=device_id,
            access_time=datetime.now()
        )
        db.add(access_log)
        db.commit()
        return access_log.id
    except Exception as e:
        print(f"Error logging access: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to log access attempt: {str(e)}")

# Example API endpoint integration (to be added in app/routers/access.py)
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from app.database import get_db
from app.utils.face_recognition import compare_face_with_database, save_unknown_face, log_access_attempt
from typing import Tuple, Optional

router = APIRouter()

@router.post("/verify")
async def verify_face(face_encoding: str, image: UploadFile, location: Optional[str] = None, device_id: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        # Decode face encoding from JSON string
        encoding_array = json.loads(face_encoding)
        face_encoding_np = np.array(encoding_array, dtype=np.float64)
        
        # Compare with database
        user, confidence = compare_face_with_database(db, face_encoding_np)
        
        if user:
            # Log successful access
            log_id = log_access_attempt(db, user_id=user.id, success=True, confidence=confidence, location=location, device_id=device_id)
            return {"message": "Access granted", "user_id": user.id, "confidence": confidence, "log_id": log_id}
        else:
            # Save unknown face and log attempt
            image_path = save_unknown_face(image)
            log_id = log_access_attempt(db, success=False, confidence=confidence, image_path=image_path, location=location, device_id=device_id)
            return {"message": "Access denied", "confidence": confidence, "log_id": log_id, "image_path": image_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
"""
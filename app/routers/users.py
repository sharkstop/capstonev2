"""
User management module for the Face Recognition API
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import aiofiles
from datetime import datetime
import json

from app.database import get_db, User
from app.schemas import UserCreate, UserResponse, GuestCreate
from app.utils.face_utils import process_face_image, encode_face_encoding
from app.routers.auth import get_current_active_user

# Router
router = APIRouter()

@router.post("/users/register")
async def register_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new user with JSON data
    """
    try:
        # قراءة البيانات من جسم الطلب
        request_data = await request.json()
        print(f"Received registration data: {request_data}")
        
        # استخراج البيانات من الطلب بالأسماء المستخدمة في الواجهة الأمامية
        name = request_data.get('name', '')
        email = request_data.get('email', '')
        user_type = request_data.get('userType', 'employee')
        room_number = request_data.get('roomNumber', '')
        reservation_number = request_data.get('reservationNumber', '')
        department = request_data.get('department', '')
        position = request_data.get('position', '')
        phone = request_data.get('phone', '')
        employee_id = request_data.get('employeeId', '')
        face_descriptor = request_data.get('face_descriptor', [])
        
        # التحقق من البيانات الإلزامية
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
            
        # التحقق من عدم وجود بريد إلكتروني مكرر
        if email:
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # تحويل face_descriptor إلى JSON string
        face_descriptor_str = json.dumps(face_descriptor) if face_descriptor else None
        
        # إنشاء مستخدم جديد
        new_user = User(
            name=name,
            email=email,
            phone=phone,
            employee_id=employee_id,
            department=department,
            position=position,
            room_number=room_number,
            reservation_number=reservation_number,
            face_descriptor=face_descriptor_str,
            user_type=user_type
        )
        
        # حفظ المستخدم في قاعدة البيانات
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": "تم تسجيل المستخدم بنجاح",
            "id": new_user.id
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/register/guest", response_model=UserResponse)
async def register_guest(
    name: str = Form(...),
    email: str = Form(...),
    room_number: str = Form(...),
    reservation_number: str = Form(...),
    face_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Register a new guest (requires employee authentication)
    """
    # Check if the current user is an employee
    if current_user.user_type != "employee":
        raise HTTPException(status_code=403, detail="Only employees can register guests")
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # Process face image
        face_encoding = await process_face_image(face_image)
        face_descriptor_str = json.dumps(encode_face_encoding(face_encoding))  # تحويل إلى JSON string
        
        # Save face image to disk
        file_extension = os.path.splitext(face_image.filename)[1]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"guest_{timestamp}{file_extension}"
        uploads_dir = "uploads"
        
        # Ensure uploads directory exists
        os.makedirs(uploads_dir, exist_ok=True)
        file_path = os.path.join(uploads_dir, filename)
        
        # Reset file position
        await face_image.seek(0)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await face_image.read()
            await out_file.write(content)
        
        # Create new guest
        db_guest = User(
            name=name,
            email=email,
            room_number=room_number,
            reservation_number=reservation_number,
            face_descriptor=face_descriptor_str,  # استخدام face_descriptor
            face_image_path=file_path,
            user_type="guest"
        )
        
        db.add(db_guest)
        db.commit()
        db.refresh(db_guest)
        
        return {
            "id": db_guest.id,
            "name": db_guest.name,
            "email": db_guest.email,
            "room_number": db_guest.room_number,
            "reservation_number": db_guest.reservation_number,
            "user_type": db_guest.user_type,
            "created_at": db_guest.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Guest registration failed: {str(e)}")

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    user_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all users, optionally filtered by type (requires employee authentication)
    """
    # Check if current user is an employee
    if current_user.user_type != "employee":
        raise HTTPException(status_code=403, detail="Not authorized to view users")
        
    # Filter users
    query = db.query(User)
    if user_type:
        query = query.filter(User.user_type == user_type)
        
    users = query.offset(skip).limit(limit).all()
    
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user by ID (requires employee authentication or own user)
    """
    # Check if current user is an employee or the requested user
    if current_user.user_type != "employee" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete user (requires employee authentication with admin position)
    """
    # Check if current user is an admin
    if current_user.user_type != "employee" or current_user.position != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete users")
        
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Delete user
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}



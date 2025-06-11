"""
Administrative functions for the Face Recognition API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db, User, SmartLock
from app.routers.auth import get_current_active_user
from app.schemas import SmartLockCreate, SmartLockResponse

# Router
router = APIRouter()

@router.post("/smart-locks", response_model=SmartLockResponse)
async def create_smart_lock(
    device_id: str = Form(...),
    name: str = Form(...),
    location: str = Form(...),
    ip_address: str = Form(...),
    api_key: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new smart lock (requires admin privileges)
    """
    # Check if user is admin
    if current_user.user_type != "employee" or current_user.position != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to manage smart locks")
    
    # Check if device_id already exists
    existing_lock = db.query(SmartLock).filter(SmartLock.device_id == device_id).first()
    if existing_lock:
        raise HTTPException(status_code=400, detail="Smart lock with this device ID already exists")
    
    # Create new smart lock
    smart_lock = SmartLock(
        device_id=device_id,
        name=name,
        location=location,
        ip_address=ip_address,
        api_key=api_key,
        last_status="registered",
        last_updated=datetime.now()
    )
    
    db.add(smart_lock)
    db.commit()
    db.refresh(smart_lock)
    
    return smart_lock

@router.get("/smart-locks", response_model=List[SmartLockResponse])
async def get_smart_locks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all smart locks (requires employee privileges)
    """
    # Check if user is employee
    if current_user.user_type != "employee":
        raise HTTPException(status_code=403, detail="Not authorized to view smart locks")
    
    # Get smart locks
    locks = db.query(SmartLock).offset(skip).limit(limit).all()
    
    return locks

@router.get("/stats")
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get system statistics (requires employee privileges)
    """
    # Check if user is employee
    if current_user.user_type != "employee":
        raise HTTPException(status_code=403, detail="Not authorized to view statistics")
    
    # Count users by type
    total_users = db.query(User).count()
    guests = db.query(User).filter(User.user_type == "guest").count()
    employees = db.query(User).filter(User.user_type == "employee").count()
    
    # Count access logs
    from app.database import AccessLog
    total_access_attempts = db.query(AccessLog).count()
    successful_access = db.query(AccessLog).filter(AccessLog.success == True).count()
    failed_access = db.query(AccessLog).filter(AccessLog.success == False).count()
    
    # Get recent failed access attempts
    recent_failures = db.query(AccessLog).filter(AccessLog.success == False).order_by(AccessLog.access_time.desc()).limit(5).all()
    
    # Format recent failures
    recent_failure_list = []
    for failure in recent_failures:
        failure_entry = {
            "id": failure.id,
            "time": failure.access_time,
            "location": failure.location,
            "image_path": failure.image_path
        }
        recent_failure_list.append(failure_entry)
    
    return {
        "users": {
            "total": total_users,
            "guests": guests,
            "employees": employees
        },
        "access": {
            "total": total_access_attempts,
            "successful": successful_access,
            "failed": failed_access,
            "success_rate": successful_access / total_access_attempts if total_access_attempts > 0 else 0
        },
        "recent_failures": recent_failure_list
    }
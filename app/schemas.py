"""
Schemas for the Face Recognition API
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Union
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    user_type: str = "employee"

class UserCreate(UserBase):
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    room_number: Optional[str] = None
    reservation_number: Optional[str] = None

class GuestCreate(UserBase):
    room_number: str
    reservation_number: str
    user_type: str = "guest"

class UserResponse(UserBase):
    id: int
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    room_number: Optional[str] = None
    reservation_number: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True  # تحديث من orm_mode إلى from_attributes

# Employee schemas
class EmployeeBase(UserBase):
    department: Optional[str] = None
    position: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    password: str

class Employee(EmployeeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # تحديث من orm_mode إلى from_attributes

# Access log schemas
class AccessLogBase(BaseModel):
    user_id: Optional[int] = None
    success: bool = False
    confidence: Optional[float] = None
    location: Optional[str] = None

class AccessLogCreate(AccessLogBase):
    pass

class AccessLogResponse(AccessLogBase):
    id: int
    access_time: datetime
    image_path: Optional[str] = None
    
    class Config:
        from_attributes = True  # تحديث من orm_mode إلى from_attributes

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

# Face verification schemas
class VerificationResult(BaseModel):
    success: bool
    message: str
    user: Optional[UserResponse] = None
    confidence: Optional[float] = None
# أضف هذا القسم تحت قسم "# Face verification schemas" في schemas.py
# Smart lock schemas
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SmartLockCreate(BaseModel):
    device_id: str
    name: str
    location: str
    ip_address: str
    api_key: str
    status: str = "locked"  # القيمة الافتراضية: "locked"
    last_status: str = "registered"  # القيمة الافتراضية: "registered"

class SmartLockResponse(BaseModel):
    id: int
    device_id: str
    name: str
    location: str
    ip_address: str
    api_key: str
    status: str
    last_status: str
    last_updated: datetime
    
    class Config:
        from_attributes = True  # لدعم تحويل كائنات ORM إلى JSON
# أضف هذا القسم تحت قسم "# Smart lock schemas" في schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Camera schemas
class CameraCreate(BaseModel):
    device_id: str
    name: str
    location: str
    ip_address: str
    status: str = "active"  # القيمة الافتراضية: "active"

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    ip_address: Optional[str] = None
    status: Optional[str] = None

class CameraResponse(BaseModel):
    id: int
    device_id: str
    name: str
    location: str
    ip_address: str
    status: str
    last_updated: datetime
    
    class Config:
        from_attributes = True  # لدعم تحويل كائنات ORM إلى JSON        
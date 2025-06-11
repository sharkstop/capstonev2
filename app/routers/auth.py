
"""
Authentication module for the Face Recognition API
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db, User
from app.utils.face_utils import process_face_image, encode_face_encoding
from app.schemas import Token, TokenData, Employee, EmployeeCreate

# Router
router = APIRouter()

# Authentication configuration
SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or user.user_type != "employee":
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Routes
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/face", response_model=Token)
async def login_with_face(face_image: UploadFile = File(...), db: Session = Depends(get_db)):
    """Login with face recognition"""
    from app.utils.face_recognition import compare_face_with_database
    
    try:
        # Process the uploaded image
        face_encoding = await process_face_image(face_image)
        
        # Compare with employees in the database
        user, confidence = compare_face_with_database(db, face_encoding, user_type="employee")
        
        if user:
            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )
            
            # Update last access time
            user.last_access = datetime.now()
            db.commit()
            
            return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "name": user.name}
        else:
            raise HTTPException(status_code=401, detail="Face not recognized")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.post("/register/employee", response_model=Employee)
async def register_employee(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    department: str = Form(...),
    position: str = Form(...),
    face_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Register a new employee (requires admin privileges)"""
    # Check if current user has admin privileges
    if current_user.user_type != "employee" or current_user.position != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to register employees")
    
    # Check if email already exists
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # Process face image
        face_encoding = await process_face_image(face_image)
        face_encoding_str = encode_face_encoding(face_encoding)
        
        # Save face image to disk
        import os
        import aiofiles
        from datetime import datetime
        
        file_extension = os.path.splitext(face_image.filename)[1]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"employee_{timestamp}{file_extension}"
        file_path = os.path.join("uploads", filename)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await face_image.read()
            await out_file.write(content)
            
        # Create new employee
        db_user = User(
            name=name,
            email=email,
            hashed_password=get_password_hash(password),
            face_encoding=face_encoding_str,
            face_image_path=file_path,
            user_type="employee",
            department=department,
            position=position
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "department": db_user.department,
            "position": db_user.position,
            "user_type": db_user.user_type,
            "created_at": db_user.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Employee registration failed: {str(e)}")

@router.get("/me", response_model=Employee)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "department": current_user.department,
        "position": current_user.position,
        "user_type": current_user.user_type,
        "created_at": current_user.created_at
    }

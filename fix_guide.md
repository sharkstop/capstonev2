# دليل إصلاح مشروع IFDD خطوة بخطوة

## 1. إصلاح مشكلة استيراد نماذج Employee

### الخطوة 1: إضافة نماذج Employee إلى ملف schemas.py

افتح ملف `app/schemas.py` وأضف النماذج المفقودة:

```python
# إضافة نماذج الموظف
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
```

## 2. تحديث تكوين Pydantic لإصدار V2

### الخطوة 2: تحديث جميع نماذج Pydantic

قم بتحديث جميع النماذج في ملف `app/schemas.py` لاستخدام `from_attributes` بدلاً من `orm_mode`:

```python
class UserResponse(UserBase):
    # ... الكود الحالي ...
    
    class Config:
        from_attributes = True  # تحديث من orm_mode
        
class AccessLogResponse(AccessLogBase):
    # ... الكود الحالي ...
    
    class Config:
        from_attributes = True  # تحديث من orm_mode
```

## 3. إصلاح مشكلة CORS

### الخطوة 3: تحديث إعدادات CORS في ملف main.py

قم بتعديل إعدادات CORS في ملف `main.py` لتحديد المنافذ المسموح بها بشكل صريح:

```python
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 4. توحيد أسماء الحقول بين الواجهة الأمامية والخلفية

### الخطوة 4: تحديث نموذج User في ملف database.py

افتح ملف `app/database.py` وتأكد من أن نموذج `User` يستخدم نفس أسماء الحقول المستخدمة في الواجهة الأمامية:

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)
    room_number = Column(String, nullable=True)
    reservation_number = Column(String, nullable=True)
    face_descriptor = Column(String, nullable=True)  # تغيير من face_encoding إلى face_descriptor
    face_image_path = Column(String, nullable=True)
    user_type = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    last_access = Column(DateTime, nullable=True)
```

### الخطوة 5: تحديث مسار التسجيل في ملف users.py

قم بتعديل مسار `/users/register` في ملف `app/routers/users.py` للتعامل مع البيانات المرسلة من الواجهة الأمامية:

```python
@router.post("/users/register")
async def register_user(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        # قراءة البيانات من جسم الطلب
        request_data = await request.json()
        print(f"Received registration data: {request_data}")
        
        # استخراج البيانات من الطلب
        name = request_data.get('name', '')
        email = request_data.get('email', '')
        user_type = request_data.get('userType', 'employee')
        phone = request_data.get('phone', '')
        employee_id = request_data.get('employeeId', '')
        department = request_data.get('department', '')
        position = request_data.get('position', '')
        room_number = request_data.get('roomNumber', '')
        reservation_number = request_data.get('reservationNumber', '')
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
```

### الخطوة 6: تحديث مسار تسجيل الموظف في ملف auth.py

قم بتعديل مسار `/register/employee` في ملف `app/routers/auth.py` لاستخدام نفس أسماء الحقول:

```python
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
    # ... الكود الحالي ...
    
    # تغيير face_encoding إلى face_descriptor
    face_descriptor_str = encode_face_encoding(face_encoding)
    
    # ... الكود الحالي ...
    
    # إنشاء مستخدم جديد
    db_user = User(
        name=name,
        email=email,
        hashed_password=get_password_hash(password),
        face_descriptor=face_descriptor_str,  # تغيير من face_encoding
        face_image_path=file_path,
        user_type="employee",
        department=department,
        position=position
    )
    
    # ... الكود الحالي ...
```

## 5. إصلاح مشكلة المصادقة

### الخطوة 7: تحديث دالة compare_face_with_database في ملف face_recognition.py

افتح ملف `app/utils/face_recognition.py` وتأكد من أنه يستخدم `face_descriptor` بدلاً من `face_encoding`:

```python
def compare_face_with_database(db: Session, face_encoding: np.ndarray, user_type: str = None, threshold: float = 0.6):
    """Compare face encoding with all users in database"""
    # Get all users with face encodings
    query = db.query(User).filter(User.face_descriptor.isnot(None))
    
    if user_type:
        query = query.filter(User.user_type == user_type)
        
    users = query.all()
    
    best_match = None
    best_distance = float('inf')
    
    for user in users:
        try:
            # تحويل face_descriptor من JSON string إلى numpy array
            stored_encoding = np.array(json.loads(user.face_descriptor))
            
            # حساب المسافة بين الوجهين
            distance = face_distance(face_encoding, stored_encoding)
            
            if distance < best_distance:
                best_distance = distance
                best_match = user
        except Exception as e:
            print(f"Error comparing face with user {user.id}: {str(e)}")
            continue
    
    # التحقق من أن أفضل تطابق أقل من الحد الأقصى
    if best_match and best_distance < threshold:
        return best_match, 1.0 - best_distance  # تحويل المسافة إلى نسبة الثقة
    
    return None, 0.0
```

## 6. إعادة إنشاء قاعدة البيانات

### الخطوة 8: حذف قاعدة البيانات الحالية وإعادة إنشائها

```bash
# حذف ملف قاعدة البيانات الحالي
rm face_recognition.db

# إعادة تشغيل التطبيق لإنشاء قاعدة البيانات من جديد
uvicorn main:app --reload
```

## 7. اختبار التطبيق

### الخطوة 9: اختبار التسجيل

1. تأكد من تشغيل الخادم الخلفي: `uvicorn main:app --reload`
2. تأكد من تشغيل الواجهة الأمامية: `npm run dev` أو `yarn dev`
3. افتح المتصفح على عنوان الواجهة الأمامية (عادة http://localhost:5173)
4. جرب تسجيل مستخدم جديد
5. تحقق من سجلات الخادم للتأكد من عدم وجود أخطاء

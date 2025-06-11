# تصميم نظام التعرف على وجوه متعددة

## نظرة عامة

نظام التعرف على وجوه متعددة هو ميزة أساسية لنظام التعرف على الوجوه في الفنادق، حيث يتيح التعرف على عدة أشخاص في نفس الوقت، مما يحسن كفاءة النظام ويوفر تجربة أفضل للمستخدمين، خاصة في المناطق المزدحمة مثل مداخل الفندق أو مناطق الاستقبال.

## المتطلبات الوظيفية

### 1. اكتشاف وتتبع الوجوه المتعددة

#### اكتشاف الوجوه
- **اكتشاف متزامن**: القدرة على اكتشاف ما يصل إلى 10 وجوه في إطار واحد
- **تحديد الإحداثيات**: تحديد موقع كل وجه (x, y, width, height) في الإطار
- **تقدير الثقة**: حساب درجة الثقة في كل وجه مكتشف

#### تتبع الوجوه
- **تخصيص معرفات فريدة**: تعيين معرف فريد لكل وجه مكتشف
- **تتبع الحركة**: متابعة حركة الوجوه بين الإطارات المتتالية
- **التعامل مع الاختفاء المؤقت**: الاحتفاظ بالمعرفات حتى مع اختفاء الوجوه مؤقتاً

### 2. معالجة الوجوه المتعددة

#### استخراج السمات
- **معالجة متوازية**: استخراج سمات جميع الوجوه المكتشفة بشكل متوازٍ
- **ترتيب الأولويات**: معالجة الوجوه الأكبر أو الأوضح أولاً
- **التعامل مع الحمل الزائد**: آلية للتعامل مع الحالات التي يتجاوز فيها عدد الوجوه قدرة المعالجة

#### المقارنة مع قاعدة البيانات
- **مقارنة متوازية**: مقارنة جميع الوجوه المكتشفة مع قاعدة البيانات بشكل متوازٍ
- **تجميع النتائج**: تجميع نتائج المقارنة لجميع الوجوه
- **ترتيب النتائج**: ترتيب النتائج حسب درجة الثقة

### 3. التعامل مع نتائج التعرف المتعددة

#### عرض النتائج
- **عرض متزامن**: عرض معلومات جميع الأشخاص المتعرف عليهم
- **تمييز بصري**: تمييز الأشخاص المصرح لهم وغير المصرح لهم بألوان مختلفة
- **عرض معلومات تفصيلية**: إمكانية عرض معلومات مفصلة عن كل شخص

#### الإجراءات المتخذة
- **إجراءات متعددة**: اتخاذ إجراءات مختلفة لكل شخص حسب نتيجة التعرف
- **أولويات الإجراءات**: تحديد أولويات الإجراءات في حالة تعارضها
- **تسجيل الإجراءات**: توثيق جميع الإجراءات المتخذة

## التصميم التقني

### 1. تحسين خوارزمية اكتشاف الوجوه

```python
import cv2
import numpy as np
from typing import List, Tuple, Dict

class MultiFaceDetector:
    def __init__(self, confidence_threshold: float = 0.5, nms_threshold: float = 0.3):
        """
        تهيئة كاشف الوجوه المتعددة
        
        :param confidence_threshold: عتبة الثقة للكشف عن الوجوه
        :param nms_threshold: عتبة Non-Maximum Suppression لتجنب التداخل
        """
        # استخدام نموذج MTCNN أو RetinaFace للكشف عن الوجوه
        # في هذا المثال، نستخدم نموذج DNN من OpenCV للبساطة
        self.confidence_threshold = confidence_threshold
        self.nms_threshold = nms_threshold
        
        # تحميل نموذج الكشف عن الوجوه
        prototxt_path = "models/deploy.prototxt"
        model_path = "models/res10_300x300_ssd_iter_140000.caffemodel"
        self.face_detector = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)
        
        # تهيئة متتبع الوجوه
        self.face_tracker = FaceTracker()
        
        # معرف الإطار الحالي
        self.frame_id = 0
    
    def detect_faces(self, frame: np.ndarray) -> List[Dict]:
        """
        اكتشاف الوجوه في الإطار
        
        :param frame: الإطار (صورة) للكشف عن الوجوه فيه
        :return: قائمة بالوجوه المكتشفة مع معلوماتها
        """
        self.frame_id += 1
        height, width = frame.shape[:2]
        
        # تحضير الإطار للكشف
        blob = cv2.dnn.blobFromImage(
            cv2.resize(frame, (300, 300)), 1.0, (300, 300),
            (104.0, 177.0, 123.0), swapRB=False, crop=False
        )
        
        # تمرير الإطار إلى نموذج الكشف
        self.face_detector.setInput(blob)
        detections = self.face_detector.forward()
        
        # معالجة النتائج
        faces = []
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            
            if confidence > self.confidence_threshold:
                # استخراج إحداثيات الوجه
                box = detections[0, 0, i, 3:7] * np.array([width, height, width, height])
                x1, y1, x2, y2 = box.astype(int)
                
                # إنشاء معلومات الوجه
                face_info = {
                    "bbox": (x1, y1, x2 - x1, y2 - y1),  # (x, y, width, height)
                    "confidence": float(confidence),
                    "frame_id": self.frame_id
                }
                
                faces.append(face_info)
        
        # تطبيق تتبع الوجوه
        tracked_faces = self.face_tracker.update(faces)
        
        return tracked_faces

class FaceTracker:
    def __init__(self, max_disappeared: int = 30, max_distance: float = 50.0):
        """
        تهيئة متتبع الوجوه
        
        :param max_disappeared: الحد الأقصى لعدد الإطارات التي يمكن أن يختفي فيها الوجه قبل إزالته
        :param max_distance: الحد الأقصى للمسافة بين موقعي وجه في إطارين متتاليين لاعتبارهما نفس الوجه
        """
        self.next_face_id = 0
        self.faces = {}  # {face_id: face_info}
        self.disappeared = {}  # {face_id: count}
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance
    
    def _calculate_center(self, bbox: Tuple[int, int, int, int]) -> Tuple[int, int]:
        """حساب مركز المربع المحيط"""
        x, y, w, h = bbox
        return (x + w // 2, y + h // 2)
    
    def _calculate_distance(self, center1: Tuple[int, int], center2: Tuple[int, int]) -> float:
        """حساب المسافة الإقليدية بين مركزين"""
        return np.sqrt((center1[0] - center2[0]) ** 2 + (center1[1] - center2[1]) ** 2)
    
    def update(self, faces: List[Dict]) -> List[Dict]:
        """
        تحديث حالة تتبع الوجوه
        
        :param faces: قائمة بالوجوه المكتشفة في الإطار الحالي
        :return: قائمة بالوجوه مع معرفات التتبع
        """
        # إذا لم يتم اكتشاف أي وجوه، زيادة عداد الاختفاء لجميع الوجوه المتتبعة
        if len(faces) == 0:
            for face_id in list(self.disappeared.keys()):
                self.disappeared[face_id] += 1
                
                # إزالة الوجوه التي اختفت لفترة طويلة
                if self.disappeared[face_id] > self.max_disappeared:
                    del self.faces[face_id]
                    del self.disappeared[face_id]
            
            return []
        
        # إذا لم تكن هناك وجوه متتبعة حالياً، إضافة جميع الوجوه المكتشفة
        if len(self.faces) == 0:
            for face in faces:
                face["id"] = self.next_face_id
                self.faces[self.next_face_id] = face
                self.disappeared[self.next_face_id] = 0
                self.next_face_id += 1
        else:
            # حساب مراكز الوجوه المكتشفة
            centers = [self._calculate_center(face["bbox"]) for face in faces]
            
            # حساب مراكز الوجوه المتتبعة
            tracked_centers = {face_id: self._calculate_center(face["bbox"]) for face_id, face in self.faces.items()}
            
            # حساب مصفوفة المسافات بين الوجوه المكتشفة والمتتبعة
            distances = {}
            for i, center in enumerate(centers):
                for face_id, tracked_center in tracked_centers.items():
                    distance = self._calculate_distance(center, tracked_center)
                    if distance <= self.max_distance:
                        distances.setdefault(i, {}).update({face_id: distance})
            
            # مطابقة الوجوه المكتشفة مع المتتبعة باستخدام خوارزمية المجري
            used_detected = set()
            used_tracked = set()
            
            # مطابقة الوجوه بناءً على أقل مسافة
            while distances:
                min_dist = float('inf')
                min_i = None
                min_face_id = None
                
                for i in distances:
                    for face_id in distances[i]:
                        if distances[i][face_id] < min_dist:
                            min_dist = distances[i][face_id]
                            min_i = i
                            min_face_id = face_id
                
                if min_i is not None and min_face_id is not None:
                    used_detected.add(min_i)
                    used_tracked.add(min_face_id)
                    
                    # تحديث معلومات الوجه المتتبع
                    faces[min_i]["id"] = min_face_id
                    self.faces[min_face_id] = faces[min_i]
                    self.disappeared[min_face_id] = 0
                    
                    # إزالة الوجه من قائمة المسافات
                    del distances[min_i]
                else:
                    break
            
            # إضافة الوجوه المكتشفة الجديدة
            for i, face in enumerate(faces):
                if i not in used_detected:
                    face["id"] = self.next_face_id
                    self.faces[self.next_face_id] = face
                    self.disappeared[self.next_face_id] = 0
                    self.next_face_id += 1
            
            # زيادة عداد الاختفاء للوجوه غير المطابقة
            for face_id in list(self.disappeared.keys()):
                if face_id not in used_tracked:
                    self.disappeared[face_id] += 1
                    
                    # إزالة الوجوه التي اختفت لفترة طويلة
                    if self.disappeared[face_id] > self.max_disappeared:
                        del self.faces[face_id]
                        del self.disappeared[face_id]
        
        # إرجاع قائمة بالوجوه المتتبعة
        return list(self.faces.values())
```

### 2. تحسين خوارزمية التعرف على الوجوه

```python
import face_recognition
import numpy as np
from typing import List, Dict, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import Session
from app.database import User
import json

class MultiFaceRecognition:
    def __init__(self, db: Session, max_workers: int = 4, threshold: float = 0.6):
        """
        تهيئة نظام التعرف على وجوه متعددة
        
        :param db: جلسة قاعدة البيانات
        :param max_workers: الحد الأقصى لعدد العمليات المتوازية
        :param threshold: عتبة التشابه للتعرف على الوجه
        """
        self.db = db
        self.max_workers = max_workers
        self.threshold = threshold
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    def recognize_faces(self, face_encodings: List[np.ndarray]) -> List[Dict]:
        """
        التعرف على وجوه متعددة
        
        :param face_encodings: قائمة بمصفوفات ترميز الوجوه
        :return: قائمة بنتائج التعرف
        """
        if not face_encodings:
            return []
        
        # تنفيذ عمليات التعرف بشكل متوازٍ
        future_results = [
            self.executor.submit(self._recognize_single_face, encoding)
            for encoding in face_encodings
        ]
        
        # جمع النتائج
        results = [future.result() for future in future_results]
        
        return results
    
    def _recognize_single_face(self, face_encoding: np.ndarray) -> Dict:
        """
        التعرف على وجه واحد
        
        :param face_encoding: مصفوفة ترميز الوجه
        :return: نتيجة التعرف
        """
        # الحصول على جميع المستخدمين النشطين
        users = self.db.query(User).filter(User.is_active == True).all()
        
        if not users:
            return {
                "success": False,
                "message": "لا يوجد مستخدمين مسجلين",
                "confidence": 0.0,
                "user": None
            }
        
        best_match = None
        best_match_distance = float('inf')
        
        for user in users:
            # فك ترميز مصفوفة الوجه المخزنة
            stored_encoding = self._decode_face_encoding(user.face_descriptor)
            if stored_encoding is None or stored_encoding.size != face_encoding.size:
                continue
            
            # حساب المسافة بين الوجهين
            distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
            
            # تحديث أفضل تطابق
            if distance < best_match_distance:
                best_match = user
                best_match_distance = distance
        
        # حساب درجة الثقة
        confidence = max(0, 1 - best_match_distance) if best_match_distance <= 1.0 else 0
        
        # تحديد نتيجة التعرف
        if best_match_distance <= self.threshold:
            return {
                "success": True,
                "message": "تم التعرف على الوجه بنجاح",
                "confidence": confidence,
                "user": {
                    "id": best_match.id,
                    "name": best_match.name,
                    "user_type": best_match.user_type,
                    "room_number": best_match.room_number
                }
            }
        else:
            return {
                "success": False,
                "message": "الوجه غير معروف",
                "confidence": confidence,
                "user": None
            }
    
    def _decode_face_encoding(self, encoded_str: str) -> Optional[np.ndarray]:
        """فك ترميز مصفوفة الوجه من سلسلة JSON"""
        try:
            if not encoded_str:
                return None
            data = json.loads(encoded_str)
            return np.array(data, dtype=np.float64)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"خطأ في فك ترميز مصفوفة الوجه: {e}")
            return None
```

### 3. تكامل مع واجهة برمجة التطبيقات (API)

```python
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import numpy as np
import io
from PIL import Image
import face_recognition
from app.database import get_db
from app.utils.multi_face_detection import MultiFaceDetector
from app.utils.multi_face_recognition import MultiFaceRecognition
from app.utils.alert_service import AlertService
from app.schemas import MultiFaceVerificationResult

router = APIRouter()

@router.post("/verify-multiple", response_model=List[MultiFaceVerificationResult])
async def verify_multiple_faces(
    face_image: UploadFile = File(...),
    location: Optional[str] = Form(None),
    device_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    التحقق من وجوه متعددة في صورة واحدة
    """
    try:
        # قراءة بيانات الصورة
        image_data = await face_image.read()
        image = Image.open(io.BytesIO(image_data))
        
        # تحويل الصورة إلى مصفوفة NumPy
        image_np = np.array(image)
        
        # اكتشاف الوجوه المتعددة
        face_detector = MultiFaceDetector()
        detected_faces = face_detector.detect_faces(image_np)
        
        if not detected_faces:
            return []
        
        # استخراج مصفوفات ترميز الوجوه
        face_encodings = []
        for face in detected_faces:
            x, y, w, h = face["bbox"]
            face_image = image_np[y:y+h, x:x+w]
            
            # استخراج ترميز الوجه
            rgb_face_image = face_image[:, :, ::-1]  # تحويل من BGR إلى RGB
            encodings = face_recognition.face_encodings(rgb_face_image)
            
            if encodings:
                face_encodings.append(encodings[0])
            else:
                # إذا لم يتم استخراج ترميز، إضافة None
                face_encodings.append(None)
        
        # التعرف على الوجوه
        face_recognition_system = MultiFaceRecognition(db)
        recognition_results = []
        
        for i, encoding in enumerate(face_encodings):
            if encoding is not None:
                result = face_recognition_system._recognize_single_face(encoding)
                
                # إضافة معلومات الوجه المكتشف
                result["face_id"] = detected_faces[i]["id"]
                result["bbox"] = detected_faces[i]["bbox"]
                
                recognition_results.append(result)
        
        # تسجيل محاولات الوصول
        alert_service = AlertService(db)
        
        for result in recognition_results:
            if result["success"]:
                # تسجيل وصول ناجح
                from app.utils.face_recognition import log_access_attempt
                log_access_attempt(
                    db,
                    user_id=result["user"]["id"],
                    success=True,
                    confidence=result["confidence"],
                    location=location,
                    device_id=device_id
                )
                
                # إطلاق تنبيه الوصول المصرح به
                await alert_service.trigger_alert("access_granted", result["user"]["id"], location)
            else:
                # تسجيل وصول فاشل
                from app.utils.face_recognition import log_access_attempt, save_unknown_face
                
                # حفظ صورة الوجه غير المعروف
                x, y, w, h = result["bbox"]
                unknown_face_image = image_np[y:y+h, x:x+w]
                image_path = save_unknown_face(io.BytesIO(Image.fromarray(unknown_face_image).tobytes()), location, device_id)
                
                log_access_attempt(
                    db,
                    user_id=None,
                    success=False,
                    confidence=result["confidence"],
                    image_path=image_path,
                    location=location,
                    device_id=device_id
                )
                
                # إطلاق تنبيه الوصول غير المصرح به
                await alert_service.trigger_alert("access_denied", None, location)
        
        return recognition_results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"فشل التحقق من الوجوه المتعددة: {str(e)}")
```

### 4. تحديث نماذج البيانات

```python
# إضافة إلى app/schemas.py

class FaceBoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class MultiFaceVerificationResult(BaseModel):
    face_id: int
    success: bool
    message: str
    confidence: float
    bbox: Tuple[int, int, int, int]
    user: Optional[UserResponse] = None
```

## واجهة المستخدم (UI/UX)

### 1. عرض الوجوه المتعددة

#### مكونات الواجهة
- **إطار الفيديو**: عرض بث الكاميرا مع تمييز الوجوه المكتشفة
- **مؤشرات الحالة**: عرض حالة كل وجه (معروف/غير معروف)
- **معلومات المستخدمين**: عرض معلومات الأشخاص المتعرف عليهم
- **إحصائيات**: عرض عدد الوجوه المكتشفة والمتعرف عليها

#### تجربة المستخدم
- **تمييز بصري**: استخدام ألوان مختلفة لتمييز الوجوه (أخضر للمصرح لهم، أحمر لغير المصرح لهم)
- **معلومات تفاعلية**: عرض معلومات إضافية عند تمرير المؤشر فوق وجه
- **تحديثات في الوقت الفعلي**: تحديث المعلومات فوراً مع حركة الأشخاص

### 2. لوحة التحكم

#### عرض الإحصائيات
- **عدد الأشخاص**: عرض عدد الأشخاص المكتشفين في الوقت الفعلي
- **نسب التعرف**: عرض نسبة الوجوه المتعرف عليها مقابل غير المتعرف عليها
- **خريطة حرارية**: عرض توزيع الأشخاص في المكان

#### إدارة الإنذارات
- **تنبيهات متعددة**: إمكانية إطلاق تنبيهات مختلفة لأشخاص مختلفين
- **تجميع التنبيهات**: تجميع التنبيهات المتشابهة لتجنب الإزعاج
- **أولويات التنبيهات**: عرض التنبيهات حسب الأولوية

## اعتبارات التنفيذ

### 1. الأداء والمقياس
- **تحسين الأداء**: استخدام وحدة معالجة الرسومات (GPU) لتسريع عمليات اكتشاف الوجوه واستخراج السمات
- **معالجة متوازية**: استخدام المعالجة المتوازية لتحسين الأداء مع الوجوه المتعددة
- **تقسيم الصورة**: تقسيم الصور الكبيرة إلى مناطق أصغر للمعالجة المتوازية

### 2. الدقة والموثوقية
- **تحسين دقة الاكتشاف**: استخدام نماذج متقدمة مثل RetinaFace أو MTCNN
- **تحسين دقة التعرف**: استخدام نماذج عميقة مثل FaceNet أو ArcFace
- **التعامل مع ظروف الإضاءة**: تطبيق تقنيات معالجة الصور لتحسين الأداء في ظروف الإضاءة المختلفة

### 3. الخصوصية والأمان
- **موافقة المستخدم**: التأكد من الحصول على موافقة المستخدمين قبل معالجة صورهم
- **تشفير البيانات**: تشفير بيانات الوجوه المخزنة
- **سجلات التدقيق**: الاحتفاظ بسجلات تدقيق مفصلة لجميع عمليات التعرف

## خاتمة

نظام التعرف على وجوه متعددة سيعزز بشكل كبير قدرات نظام التعرف على الوجوه للفنادق، مما يتيح التعامل مع المناطق المزدحمة بكفاءة أعلى وتجربة مستخدم أفضل. التصميم المقترح يوفر حلاً متكاملاً يجمع بين الدقة العالية والأداء السريع مع الحفاظ على الخصوصية والأمان.

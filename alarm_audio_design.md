# تصميم نظام الإنذارات والتنبيهات الصوتية المخصصة

## نظرة عامة

نظام الإنذارات والتنبيهات الصوتية هو جزء أساسي من نظام التعرف على الوجوه للفنادق، حيث يوفر تنبيهات فورية للموظفين والأمن في حالات مختلفة مثل اكتشاف شخص غير مصرح له أو نجاح عملية التحقق. سيتم تصميم النظام ليكون قابلاً للتخصيص بالكامل مع واجهة مستخدم سهلة الاستخدام.

## المتطلبات الوظيفية

### 1. أنواع التنبيهات والإنذارات

#### تنبيهات الوصول المصرح به
- **صوت ترحيبي**: عند التعرف على ضيف أو موظف مسجل
- **تنبيه صامت**: إشعار بصري فقط دون صوت
- **تنبيه مخصص**: صوت مخصص حسب نوع المستخدم (ضيف/موظف)

#### إنذارات الوصول غير المصرح به
- **إنذار أمني**: عند اكتشاف شخص غير مسجل
- **إنذار متدرج**: يزداد مستوى الصوت مع تكرار المحاولات
- **إنذار صامت**: إرسال تنبيه للأمن دون صوت مسموع

#### تنبيهات خاصة
- **تنبيه الثقة المنخفضة**: عند التعرف بنسبة ثقة منخفضة
- **تنبيه الوجوه المتعددة**: عند اكتشاف عدة وجوه في نفس الوقت
- **تنبيه محاولة الخداع**: عند اكتشاف محاولة استخدام صورة أو فيديو

### 2. إعدادات التخصيص

#### تخصيص الأصوات
- **مكتبة أصوات**: مجموعة من الأصوات الافتراضية المتاحة للاختيار
- **تحميل أصوات مخصصة**: إمكانية تحميل ملفات صوتية (MP3, WAV, OGG)
- **تسجيل رسائل صوتية**: إمكانية تسجيل رسائل صوتية مخصصة

#### إعدادات الصوت
- **مستوى الصوت**: التحكم في مستوى صوت كل نوع من التنبيهات
- **المدة**: تحديد مدة تشغيل الصوت
- **التكرار**: تحديد عدد مرات تكرار الصوت

#### جدولة التنبيهات
- **جدولة زمنية**: أصوات مختلفة حسب الوقت (صباحاً، مساءً، ليلاً)
- **أيام الأسبوع**: إعدادات مختلفة لأيام العمل والعطلات
- **مناسبات خاصة**: أصوات خاصة للمناسبات والأعياد

### 3. قنوات التنبيه

#### تنبيهات محلية
- **مكبرات الصوت**: تشغيل الصوت عبر مكبرات الصوت المتصلة بالنظام
- **شاشة العرض**: عرض تنبيهات بصرية على شاشة النظام

#### تنبيهات بعيدة
- **تطبيق الهاتف**: إرسال إشعارات للمسؤولين عبر تطبيق الهاتف
- **البريد الإلكتروني**: إرسال تنبيهات عبر البريد الإلكتروني
- **الرسائل النصية**: إرسال تنبيهات عبر الرسائل النصية

#### تكامل مع أنظمة الأمان
- **نظام الإنذار المركزي**: ربط مع نظام الإنذار المركزي للفندق
- **نظام المراقبة**: تشغيل تسجيل الكاميرات عند إطلاق إنذار
- **نظام التحكم بالأبواب**: قفل/فتح الأبواب تلقائياً حسب نوع التنبيه

## التصميم التقني

### 1. هيكل قاعدة البيانات

```python
# نموذج الإعدادات الصوتية
class AudioSetting(Base):
    __tablename__ = "audio_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # اسم الإعداد
    event_type = Column(String, nullable=False)  # نوع الحدث (access_granted, access_denied, etc.)
    sound_file = Column(String, nullable=True)  # مسار ملف الصوت
    volume = Column(Integer, default=80)  # مستوى الصوت (0-100)
    duration = Column(Integer, default=5)  # المدة بالثواني
    repeat_count = Column(Integer, default=1)  # عدد مرات التكرار
    is_active = Column(Boolean, default=True)  # حالة التفعيل
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

# نموذج جدولة التنبيهات
class AlertSchedule(Base):
    __tablename__ = "alert_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    audio_setting_id = Column(Integer, ForeignKey("audio_settings.id"))
    start_time = Column(Time, nullable=False)  # وقت البدء
    end_time = Column(Time, nullable=False)  # وقت الانتهاء
    days_of_week = Column(String, nullable=False)  # أيام الأسبوع (JSON string)
    location = Column(String, nullable=True)  # الموقع المحدد (إذا كان مطبقاً)
    is_active = Column(Boolean, default=True)
    
    # العلاقات
    audio_setting = relationship("AudioSetting")

# نموذج قنوات التنبيه
class NotificationChannel(Base):
    __tablename__ = "notification_channels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # اسم القناة
    channel_type = Column(String, nullable=False)  # نوع القناة (speaker, email, sms, app, etc.)
    configuration = Column(String, nullable=False)  # إعدادات القناة (JSON string)
    is_active = Column(Boolean, default=True)
    
# نموذج ربط الإعدادات بالقنوات
class AudioSettingChannel(Base):
    __tablename__ = "audio_setting_channels"
    
    id = Column(Integer, primary_key=True, index=True)
    audio_setting_id = Column(Integer, ForeignKey("audio_settings.id"))
    channel_id = Column(Integer, ForeignKey("notification_channels.id"))
    
    # العلاقات
    audio_setting = relationship("AudioSetting")
    channel = relationship("NotificationChannel")
```

### 2. واجهة برمجة التطبيقات (API)

#### إدارة الإعدادات الصوتية

```python
@router.post("/audio-settings", response_model=AudioSettingResponse)
async def create_audio_setting(
    name: str = Form(...),
    event_type: str = Form(...),
    sound_file: UploadFile = File(None),
    volume: int = Form(80),
    duration: int = Form(5),
    repeat_count: int = Form(1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """إنشاء إعداد صوتي جديد"""
    # التحقق من صلاحيات المستخدم
    if current_user.user_type != "employee" or current_user.position != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح بإدارة الإعدادات الصوتية")
    
    # معالجة ملف الصوت إذا تم تقديمه
    sound_file_path = None
    if sound_file:
        sound_file_path = await save_sound_file(sound_file)
    
    # إنشاء إعداد صوتي جديد
    audio_setting = AudioSetting(
        name=name,
        event_type=event_type,
        sound_file=sound_file_path,
        volume=volume,
        duration=duration,
        repeat_count=repeat_count
    )
    
    db.add(audio_setting)
    db.commit()
    db.refresh(audio_setting)
    
    return audio_setting

@router.get("/audio-settings", response_model=List[AudioSettingResponse])
async def get_audio_settings(
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """الحصول على الإعدادات الصوتية"""
    # التحقق من صلاحيات المستخدم
    if current_user.user_type != "employee":
        raise HTTPException(status_code=403, detail="غير مصرح بعرض الإعدادات الصوتية")
    
    # استعلام الإعدادات الصوتية
    query = db.query(AudioSetting)
    if event_type:
        query = query.filter(AudioSetting.event_type == event_type)
    
    return query.all()
```

#### إدارة جدولة التنبيهات

```python
@router.post("/alert-schedules", response_model=AlertScheduleResponse)
async def create_alert_schedule(
    audio_setting_id: int = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    days_of_week: str = Form(...),  # JSON string, e.g., ["Monday", "Tuesday"]
    location: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """إنشاء جدولة تنبيهات جديدة"""
    # التحقق من صلاحيات المستخدم
    if current_user.user_type != "employee" or current_user.position != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح بإدارة جدولة التنبيهات")
    
    # التحقق من وجود الإعداد الصوتي
    audio_setting = db.query(AudioSetting).filter(AudioSetting.id == audio_setting_id).first()
    if not audio_setting:
        raise HTTPException(status_code=404, detail="الإعداد الصوتي غير موجود")
    
    # إنشاء جدولة جديدة
    alert_schedule = AlertSchedule(
        audio_setting_id=audio_setting_id,
        start_time=datetime.strptime(start_time, "%H:%M").time(),
        end_time=datetime.strptime(end_time, "%H:%M").time(),
        days_of_week=days_of_week,
        location=location
    )
    
    db.add(alert_schedule)
    db.commit()
    db.refresh(alert_schedule)
    
    return alert_schedule
```

#### إدارة قنوات التنبيه

```python
@router.post("/notification-channels", response_model=NotificationChannelResponse)
async def create_notification_channel(
    name: str = Form(...),
    channel_type: str = Form(...),
    configuration: str = Form(...),  # JSON string
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """إنشاء قناة تنبيه جديدة"""
    # التحقق من صلاحيات المستخدم
    if current_user.user_type != "employee" or current_user.position != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح بإدارة قنوات التنبيه")
    
    # إنشاء قناة جديدة
    notification_channel = NotificationChannel(
        name=name,
        channel_type=channel_type,
        configuration=configuration
    )
    
    db.add(notification_channel)
    db.commit()
    db.refresh(notification_channel)
    
    return notification_channel
```

### 3. خدمة التنبيهات

```python
class AlertService:
    def __init__(self, db: Session):
        self.db = db
    
    async def trigger_alert(self, event_type: str, user_id: Optional[int] = None, location: Optional[str] = None):
        """إطلاق تنبيه بناءً على نوع الحدث"""
        try:
            # الحصول على الإعدادات الصوتية المناسبة
            current_time = datetime.now().time()
            current_day = datetime.now().strftime("%A")
            
            # البحث عن الإعدادات الصوتية النشطة لهذا النوع من الأحداث
            query = self.db.query(AudioSetting).filter(
                AudioSetting.event_type == event_type,
                AudioSetting.is_active == True
            )
            
            audio_settings = query.all()
            if not audio_settings:
                print(f"لا توجد إعدادات صوتية لنوع الحدث: {event_type}")
                return
            
            for setting in audio_settings:
                # التحقق من الجدولة
                schedule_query = self.db.query(AlertSchedule).filter(
                    AlertSchedule.audio_setting_id == setting.id,
                    AlertSchedule.is_active == True
                )
                
                if location:
                    schedule_query = schedule_query.filter(
                        (AlertSchedule.location == location) | (AlertSchedule.location == None)
                    )
                
                schedules = schedule_query.all()
                
                # التحقق من الوقت واليوم
                for schedule in schedules:
                    days = json.loads(schedule.days_of_week)
                    if current_day in days and schedule.start_time <= current_time <= schedule.end_time:
                        # الحصول على قنوات التنبيه
                        channels = self.db.query(NotificationChannel).join(
                            AudioSettingChannel,
                            AudioSettingChannel.channel_id == NotificationChannel.id
                        ).filter(
                            AudioSettingChannel.audio_setting_id == setting.id,
                            NotificationChannel.is_active == True
                        ).all()
                        
                        # إرسال التنبيه عبر كل قناة
                        for channel in channels:
                            await self._send_alert_to_channel(setting, channel, user_id, location)
                        
                        break
        except Exception as e:
            print(f"خطأ في إطلاق التنبيه: {str(e)}")
    
    async def _send_alert_to_channel(self, setting: AudioSetting, channel: NotificationChannel, user_id: Optional[int] = None, location: Optional[str] = None):
        """إرسال تنبيه عبر قناة محددة"""
        try:
            config = json.loads(channel.configuration)
            
            if channel.channel_type == "speaker":
                # تشغيل الصوت عبر مكبر الصوت
                await self._play_sound(setting.sound_file, setting.volume, setting.duration, setting.repeat_count)
            
            elif channel.channel_type == "email":
                # إرسال بريد إلكتروني
                recipient = config.get("email")
                if recipient:
                    await self._send_email(recipient, setting.name, user_id, location)
            
            elif channel.channel_type == "sms":
                # إرسال رسالة نصية
                phone = config.get("phone")
                if phone:
                    await self._send_sms(phone, setting.name, user_id, location)
            
            elif channel.channel_type == "app":
                # إرسال إشعار للتطبيق
                device_tokens = config.get("device_tokens", [])
                if device_tokens:
                    await self._send_push_notification(device_tokens, setting.name, user_id, location)
        
        except Exception as e:
            print(f"خطأ في إرسال التنبيه عبر القناة {channel.name}: {str(e)}")
    
    async def _play_sound(self, sound_file: str, volume: int, duration: int, repeat_count: int):
        """تشغيل ملف صوتي"""
        if not sound_file or not os.path.exists(sound_file):
            print(f"ملف الصوت غير موجود: {sound_file}")
            return
        
        # هنا يمكن استخدام مكتبة لتشغيل الصوت مثل pygame أو playsound
        # في بيئة الإنتاج، قد تحتاج إلى استخدام خدمة منفصلة لتشغيل الصوت
        
        print(f"تشغيل الصوت: {sound_file}, الحجم: {volume}, المدة: {duration}, التكرار: {repeat_count}")
    
    async def _send_email(self, recipient: str, alert_name: str, user_id: Optional[int] = None, location: Optional[str] = None):
        """إرسال بريد إلكتروني"""
        # استخدام خدمة بريد إلكتروني مثل SMTP أو SendGrid
        print(f"إرسال بريد إلكتروني إلى {recipient}: {alert_name}, المستخدم: {user_id}, الموقع: {location}")
    
    async def _send_sms(self, phone: str, alert_name: str, user_id: Optional[int] = None, location: Optional[str] = None):
        """إرسال رسالة نصية"""
        # استخدام خدمة رسائل نصية مثل Twilio
        print(f"إرسال رسالة نصية إلى {phone}: {alert_name}, المستخدم: {user_id}, الموقع: {location}")
    
    async def _send_push_notification(self, device_tokens: List[str], alert_name: str, user_id: Optional[int] = None, location: Optional[str] = None):
        """إرسال إشعار للتطبيق"""
        # استخدام خدمة إشعارات مثل Firebase Cloud Messaging
        print(f"إرسال إشعار للأجهزة: {device_tokens}: {alert_name}, المستخدم: {user_id}, الموقع: {location}")
```

### 4. تكامل مع نظام التعرف على الوجوه

```python
# تعديل في ملف app/routers/access.py

from app.utils.alert_service import AlertService

@router.post("/verify", response_model=VerificationResult)
async def verify_face(
    face_image: UploadFile = File(...),
    location: Optional[str] = Form(None),
    device_id: Optional[str] = Form(None),
    unlock: Optional[bool] = Form(False),
    db: Session = Depends(get_db)
):
    """
    التحقق من وجه مقابل المستخدمين المسجلين
    يمكن فتح الباب اختيارياً إذا تم التعرف على الوجه وكان unlock=True
    """
    try:
        # إنشاء خدمة التنبيهات
        alert_service = AlertService(db)
        
        # معالجة صورة الوجه والتحقق من قاعدة البيانات
        # ... (الكود الحالي)
        
        if user:
            # تسجيل الوصول الناجح
            # ... (الكود الحالي)
            
            # إطلاق تنبيه الوصول المصرح به
            await alert_service.trigger_alert("access_granted", user.id, location)
            
            # فتح الباب إذا تم طلب ذلك
            # ... (الكود الحالي)
            
            return {
                "success": True,
                "message": "تم التحقق من الوجه بنجاح",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "room_number": user.room_number,
                    "user_type": user.user_type
                },
                "confidence": confidence,
                "door_unlocked": door_unlocked
            }
        else:
            # حفظ الوجه غير المعروف وتسجيل محاولة الوصول
            # ... (الكود الحالي)
            
            # إطلاق تنبيه الوصول غير المصرح به
            await alert_service.trigger_alert("access_denied", None, location)
            
            return {
                "success": False,
                "message": "الوجه غير معروف",
                "confidence": confidence,
                "door_unlocked": False
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"فشل التحقق: {str(e)}")
```

## واجهة المستخدم (UI/UX)

### 1. صفحة إعدادات التنبيهات

![صفحة إعدادات التنبيهات](https://example.com/alert-settings.png)

#### المكونات الرئيسية:
- قائمة بالإعدادات الصوتية الحالية
- نموذج لإضافة/تعديل الإعدادات الصوتية
- مشغل صوت لمعاينة الأصوات
- واجهة لتحميل ملفات صوتية جديدة
- إعدادات الجدولة الزمنية
- إعدادات قنوات التنبيه

### 2. تجربة المستخدم

#### للمسؤولين:
- واجهة سهلة الاستخدام لإدارة الإعدادات الصوتية
- معاينة مباشرة للأصوات
- إحصائيات حول التنبيهات المرسلة
- تقارير عن فعالية التنبيهات

#### للموظفين:
- تنبيهات واضحة ومميزة لكل نوع من الأحداث
- إمكانية التأكيد على استلام التنبيهات
- واجهة لعرض سجل التنبيهات

#### للضيوف:
- تجربة سلسة مع تنبيهات صوتية مناسبة
- رسائل ترحيبية مخصصة
- إشعارات لطيفة عند التعرف عليهم

## اعتبارات التنفيذ

### 1. الأداء والمقياس
- استخدام قائمة انتظار للتنبيهات لتجنب تأخير عمليات التحقق
- تخزين مؤقت للإعدادات الصوتية المستخدمة بشكل متكرر
- تحسين أداء تشغيل الصوت

### 2. الأمان والخصوصية
- التحقق من صلاحيات المستخدمين قبل الوصول إلى إعدادات التنبيهات
- تشفير بيانات التكوين الحساسة
- سجلات تدقيق لجميع التغييرات في الإعدادات

### 3. قابلية التوسع
- دعم أنواع جديدة من التنبيهات
- واجهة برمجة مرنة لإضافة قنوات تنبيه جديدة
- هيكل بيانات قابل للتوسع

## خاتمة

نظام الإنذارات والتنبيهات الصوتية المخصصة سيعزز بشكل كبير وظائف نظام التعرف على الوجوه للفنادق، مما يوفر تجربة مستخدم أفضل وأمان محسن. التصميم المقترح يوفر مرونة كاملة للتخصيص مع الحفاظ على سهولة الاستخدام والأداء العالي.

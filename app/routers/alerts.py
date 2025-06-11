from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db, AudioSetting, AlertSchedule, NotificationChannel, AudioSettingChannel
from app.schemas import AudioSettingResponse, AlertScheduleResponse, NotificationChannelResponse, AlertResponse
from app.utils.alert_service import AlertService
from datetime import datetime
import os

router = APIRouter()

async def save_sound_file(sound_file: UploadFile) -> str:
    filename = f"{sound_file.filename}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    file_path = os.path.join("public/sounds", filename)
    os.makedirs("public/sounds", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(sound_file.file.read())
    return filename

@router.post("/alerts/trigger", response_model=AlertResponse)
async def trigger_alert(
    alert_type: str = Form(...),
    user_id: Optional[int] = Form(None),
    location: Optional[str] = Form(None),
    additional_data: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    alert_service = AlertService(db)
    additional_data_dict = json.loads(additional_data) if additional_data else None
    return await alert_service.trigger_alert(alert_type, user_id, location, additional_data_dict)

@router.get("/alerts/settings")
async def get_alert_settings(db: Session = Depends(get_db)):
    settings = db.query(AudioSetting).all()
    settings_dict = {setting.event_type: {
        "description": setting.description or setting.name,
        "sound": setting.sound_file,
        "volume": setting.volume / 100.0,
        "enabled": setting.is_active
    } for setting in settings}
    return {"settings": settings_dict}

@router.put("/alerts/settings/{alert_type}")
async def update_alert_settings(
    alert_type: str,
    sound: Optional[str] = Form(None),
    volume: Optional[float] = Form(None),
    enabled: Optional[bool] = Form(None),
    db: Session = Depends(get_db)
):
    setting = db.query(AudioSetting).filter(AudioSetting.event_type == alert_type).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Alert setting not found")
    
    if sound:
        setting.sound_file = sound
    if volume is not None:
        setting.volume = int(volume * 100)
    if enabled is not None:
        setting.is_active = enabled
    
    db.commit()
    db.refresh(setting)
    
    return {"success": True}
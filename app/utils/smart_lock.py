import requests
from sqlalchemy.orm import Session
from app.database import SmartLock
from datetime import datetime

class SmartLockError(Exception):
    pass

def get_lock_by_location(db: Session, location: str):
    return db.query(SmartLock).filter(SmartLock.location == location).first()

def get_lock_by_id(db: Session, device_id: str):
    return db.query(SmartLock).filter(SmartLock.device_id == device_id).first()

async def unlock_door(db: Session, location: str, user_id: int = None):
    try:
        lock = get_lock_by_location(db, location)
        if not lock:
            raise SmartLockError(f"No smart lock found for location: {location}")

        lock.last_status = "unlocking"
        lock.last_updated = datetime.now()
        db.commit()

        # Simulate API call (uncomment for real implementation)
        # response = requests.post(
        #     f"http://{lock.ip_address}/api/unlock",
        #     headers={"Authorization": f"Bearer {lock.api_key}"},
        #     json={"user_id": user_id}
        # )
        # if response.status_code != 200:
        #     raise SmartLockError(f"Failed to unlock door: {response.text}")

        lock.last_status = "unlocked"
        lock.last_updated = datetime.now()
        db.commit()

        return True
    except Exception as e:
        if 'lock' in locals() and lock:
            lock.last_status = f"error: {str(e)}"
            lock.last_updated = datetime.now()
            db.commit()
        raise SmartLockError(f"Failed to unlock door: {str(e)}")
"""
Alert service module for the hotel face recognition system.
"""
import logging
import os
import json
import time
from typing import Dict, Any, List, Optional
import threading
import datetime
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertService:
    """
    Service for managing and triggering alerts in the hotel face recognition system.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the alert service.
        
        Args:
            config_path: Path to alert configuration file
        """
        self.alerts = {}
        self.alert_history = []
        self.active_alerts = set()
        self.alert_callbacks = {}
        self.config_path = config_path or os.path.join(os.path.dirname(__file__), "alert_config.json")
        self.load_config()
        logger.info("Alert service initialized")
    
    def load_config(self) -> bool:
        """
        Load alert configuration from file.
        
        Returns:
            True if configuration loaded successfully, False otherwise
        """
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, "r") as f:
                    config = json.load(f)
                    self.alerts = config.get("alerts", {})
                    logger.info(f"Loaded {len(self.alerts)} alert configurations")
                return True
            else:
                # Create default configuration
                self.alerts = {
                    "unknown_person": {
                        "name": "Unknown Person",
                        "description": "Alert when an unknown person is detected",
                        "sound": "alarm.mp3",
                        "volume": 0.7,
                        "enabled": True,
                        "severity": "medium",
                        "notification_channels": ["sound", "dashboard", "email"]
                    },
                    "multiple_faces": {
                        "name": "Multiple Faces",
                        "description": "Alert when multiple faces are detected",
                        "sound": "multiple_faces.mp3",
                        "volume": 0.5,
                        "enabled": True,
                        "severity": "low",
                        "notification_channels": ["sound", "dashboard"]
                    },
                    "unauthorized_access": {
                        "name": "Unauthorized Access",
                        "description": "Alert when unauthorized access is attempted",
                        "sound": "unauthorized.mp3",
                        "volume": 0.8,
                        "enabled": True,
                        "severity": "high",
                        "notification_channels": ["sound", "dashboard", "email", "sms"]
                    },
                    "access_denied": {
                        "name": "Access Denied",
                        "description": "Alert when access is denied",
                        "sound": "access_denied.mp3",
                        "volume": 0.7,
                        "enabled": True,
                        "severity": "medium",
                        "notification_channels": ["sound", "dashboard"]
                    },
                    "access_granted": {
                        "name": "Access Granted",
                        "description": "Alert when access is granted",
                        "sound": "access_granted.mp3",
                        "volume": 0.5,
                        "enabled": True,
                        "severity": "low",
                        "notification_channels": ["sound", "dashboard"]
                    },
                    "vip_detected": {
                        "name": "VIP Detected",
                        "description": "Alert when a VIP is detected",
                        "sound": "vip_detected.mp3",
                        "volume": 0.7,
                        "enabled": True,
                        "severity": "medium",
                        "notification_channels": ["sound", "dashboard", "email"]
                    },
                    "low_confidence": {
                        "name": "Low Confidence",
                        "description": "Alert when face recognition has low confidence",
                        "sound": "low_confidence.mp3",
                        "volume": 0.6,
                        "enabled": True,
                        "severity": "low",
                        "notification_channels": ["sound", "dashboard"]
                    },
                    "system_error": {
                        "name": "System Error",
                        "description": "Alert when a system error occurs",
                        "sound": "system_error.mp3",
                        "volume": 0.8,
                        "enabled": True,
                        "severity": "high",
                        "notification_channels": ["sound", "dashboard", "email"]
                    }
                }
                self.save_config()
                logger.info("Created default alert configuration")
                return True
        except Exception as e:
            logger.error(f"Error loading alert configuration: {str(e)}")
            return False
    
    def save_config(self) -> bool:
        """
        Save alert configuration to file.
        
        Returns:
            True if configuration saved successfully, False otherwise
        """
        try:
            config = {
                "alerts": self.alerts
            }
            with open(self.config_path, "w") as f:
                json.dump(config, f, indent=2)
            logger.info("Alert configuration saved")
            return True
        except Exception as e:
            logger.error(f"Error saving alert configuration: {str(e)}")
            return False
    
    def get_alert_config(self, alert_type: str) -> Dict[str, Any]:
        """
        Get configuration for a specific alert type.
        
        Args:
            alert_type: Type of alert
            
        Returns:
            Alert configuration
        """
        return self.alerts.get(alert_type, {})
    
    def update_alert_config(self, alert_type: str, config: Dict[str, Any]) -> bool:
        """
        Update configuration for a specific alert type.
        
        Args:
            alert_type: Type of alert
            config: New configuration
            
        Returns:
            True if configuration updated successfully, False otherwise
        """
        try:
            if alert_type in self.alerts:
                self.alerts[alert_type].update(config)
            else:
                self.alerts[alert_type] = config
            self.save_config()
            logger.info(f"Updated configuration for alert type: {alert_type}")
            return True
        except Exception as e:
            logger.error(f"Error updating alert configuration: {str(e)}")
            return False
    
    def trigger_alert(self, alert_type: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Trigger an alert.
        
        Args:
            alert_type: Type of alert
            data: Additional data for the alert
            
        Returns:
            Alert result
        """
        try:
            if alert_type not in self.alerts:
                logger.warning(f"Unknown alert type: {alert_type}")
                return {
                    "success": False,
                    "message": f"Unknown alert type: {alert_type}",
                    "alert_id": None
                }
            
            config = self.alerts[alert_type]
            if not config.get("enabled", True):
                logger.info(f"Alert type {alert_type} is disabled")
                return {
                    "success": False,
                    "message": f"Alert type {alert_type} is disabled",
                    "alert_id": None
                }
            
            # Generate alert ID
            alert_id = f"{alert_type}_{int(time.time())}"
            
            # Create alert record
            alert_record = {
                "id": alert_id,
                "type": alert_type,
                "name": config.get("name", alert_type),
                "description": config.get("description", ""),
                "severity": config.get("severity", "medium"),
                "timestamp": datetime.datetime.now().isoformat(),
                "data": data or {},
                "sound": config.get("sound", ""),
                "volume": config.get("volume", 0.7),
                "notification_channels": config.get("notification_channels", ["sound", "dashboard"])
            }
            
            # Add to history
            self.alert_history.append(alert_record)
            
            # Add to active alerts
            self.active_alerts.add(alert_id)
            
            # Execute callbacks
            self._execute_callbacks(alert_type, alert_record)
            
            logger.info(f"Triggered alert: {alert_type} (ID: {alert_id})")
            return {
                "success": True,
                "message": f"Alert triggered: {alert_type}",
                "alert_id": alert_id,
                "alert_data": alert_record
            }
        except Exception as e:
            logger.error(f"Error triggering alert: {str(e)}")
            return {
                "success": False,
                "message": f"Error triggering alert: {str(e)}",
                "alert_id": None
            }
    
    def resolve_alert(self, alert_id: str) -> bool:
        """
        Resolve an active alert.
        
        Args:
            alert_id: ID of the alert to resolve
            
        Returns:
            True if alert resolved successfully, False otherwise
        """
        try:
            if alert_id in self.active_alerts:
                self.active_alerts.remove(alert_id)
                logger.info(f"Resolved alert: {alert_id}")
                return True
            else:
                logger.warning(f"Alert not found or already resolved: {alert_id}")
                return False
        except Exception as e:
            logger.error(f"Error resolving alert: {str(e)}")
            return False
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """
        Get all active alerts.
        
        Returns:
            List of active alerts
        """
        return [alert for alert in self.alert_history if alert["id"] in self.active_alerts]
    
    def get_alert_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get alert history.
        
        Args:
            limit: Maximum number of alerts to return
            
        Returns:
            List of alerts
        """
        return self.alert_history[-limit:]
    
    def register_callback(self, alert_type: str, callback) -> bool:
        """
        Register a callback function for a specific alert type.
        
        Args:
            alert_type: Type of alert
            callback: Callback function
            
        Returns:
            True if callback registered successfully, False otherwise
        """
        try:
            if alert_type not in self.alert_callbacks:
                self.alert_callbacks[alert_type] = []
            self.alert_callbacks[alert_type].append(callback)
            logger.info(f"Registered callback for alert type: {alert_type}")
            return True
        except Exception as e:
            logger.error(f"Error registering callback: {str(e)}")
            return False
    
    def _execute_callbacks(self, alert_type: str, alert_data: Dict[str, Any]) -> None:
        """
        Execute callbacks for a specific alert type.
        
        Args:
            alert_type: Type of alert
            alert_data: Alert data
        """
        callbacks = self.alert_callbacks.get(alert_type, [])
        for callback in callbacks:
            try:
                # Execute callback in a separate thread
                threading.Thread(target=callback, args=(alert_data,)).start()
            except Exception as e:
                logger.error(f"Error executing callback: {str(e)}")

# Singleton instance
_alert_service = None

def get_alert_service() -> AlertService:
    """
    Get the singleton instance of the alert service.
    
    Returns:
        AlertService instance
    """
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService()
    return _alert_service

def trigger_alert(db: Session, alert_type: str, user_id: Optional[int] = None, location: Optional[str] = None, additional_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Trigger an alert with the given parameters.
    
    Args:
        db: Database session
        alert_type: Type of alert
        user_id: Optional user ID associated with the alert
        location: Optional location where the alert was triggered
        additional_data: Optional additional data for the alert
        
    Returns:
        Alert result
    """
    try:
        # Get alert service
        alert_service = get_alert_service()
        
        # Prepare alert data
        data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "user_id": user_id,
            "location": location
        }
        
        # Add additional data
        if additional_data:
            data.update(additional_data)
        
        # Trigger alert
        result = alert_service.trigger_alert(alert_type, data)
        
        # Log alert to database if needed
        # This would be implemented if there's an Alert model in the database
        
        return result
    except Exception as e:
        logger.error(f"Error triggering alert: {str(e)}")
        return {
            "success": False,
            "message": f"Error triggering alert: {str(e)}",
            "alert_id": None
        }

def get_all_alert_settings(db: Session) -> List[Dict[str, Any]]:
    """
    Get all alert settings.
    
    Args:
        db: Database session
        
    Returns:
        List of alert settings
    """
    try:
        # Get alert service
        alert_service = get_alert_service()
        
        # Get all alert configurations
        settings = []
        for alert_type, config in alert_service.alerts.items():
            settings.append({
                "type": alert_type,
                "name": config.get("name", alert_type),
                "description": config.get("description", ""),
                "sound": config.get("sound", ""),
                "volume": config.get("volume", 0.7),
                "enabled": config.get("enabled", True),
                "severity": config.get("severity", "medium"),
                "notification_channels": config.get("notification_channels", ["sound", "dashboard"])
            })
        
        return settings
    except Exception as e:
        logger.error(f"Error getting alert settings: {str(e)}")
        return []

def update_alert_setting(db: Session, alert_type: str, settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update alert settings for a specific alert type.
    
    Args:
        db: Database session
        alert_type: Type of alert
        settings: New settings
        
    Returns:
        Update result
    """
    try:
        # Get alert service
        alert_service = get_alert_service()
        
        # Update alert configuration
        success = alert_service.update_alert_config(alert_type, settings)
        
        if success:
            return {
                "success": True,
                "message": f"Alert settings updated for {alert_type}",
                "settings": alert_service.get_alert_config(alert_type)
            }
        else:
            return {
                "success": False,
                "message": f"Failed to update alert settings for {alert_type}"
            }
    except Exception as e:
        logger.error(f"Error updating alert settings: {str(e)}")
        return {
            "success": False,
            "message": f"Error updating alert settings: {str(e)}"
        }

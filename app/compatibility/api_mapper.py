"""
API compatibility layer to ensure frontend and backend can communicate properly.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
import logging

from ..database import get_db
from ..routers import auth, users, access, admin

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/compat",
    tags=["compatibility"],
    responses={404: {"description": "Not found"}},
)

@router.post("/map_request")
async def map_request(request: Request, db: Session = Depends(get_db)):
    """
    Maps frontend API requests to the appropriate backend endpoints.
    """
    try:
        # Get request data
        data = await request.json()
        endpoint = data.get("endpoint")
        method = data.get("method", "GET")
        params = data.get("params", {})
        
        logger.info(f"Mapping request: {method} {endpoint}")
        
        # Map endpoints
        if endpoint.startswith("/api/verify"):
            # Map to access verification endpoint
            if method == "POST":
                return await access.verify_access(params.get("face_image"), params.get("location", "main_entrance"), db)
        
        elif endpoint.startswith("/api/users"):
            # Map to users endpoints
            if method == "GET":
                return users.get_users(params.get("user_type"), db)
            elif method == "POST":
                return users.create_user(params, db)
        
        elif endpoint.startswith("/api/login"):
            # Map to auth endpoints
            if method == "POST":
                if endpoint.endswith("/face"):
                    return await auth.login_with_face(params.get("face_image"), db)
                else:
                    return auth.login(params.get("username"), params.get("password"), db)
        
        elif endpoint.startswith("/api/access-logs"):
            # Map to admin access logs endpoint
            return admin.get_access_logs(
                params.get("limit", 100),
                params.get("offset", 0),
                params.get("user_id"),
                params.get("location"),
                params.get("success"),
                params.get("start_date"),
                params.get("end_date"),
                db
            )
        
        # If no mapping found
        raise HTTPException(status_code=404, detail=f"Endpoint {endpoint} not found or not mapped")
        
    except Exception as e:
        logger.error(f"Error in API mapper: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error mapping request: {str(e)}")

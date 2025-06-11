"""
Face recognition utility functions
"""
import face_recognition
import numpy as np
import io
from PIL import Image
import base64
import json
from fastapi import UploadFile, HTTPException

async def process_face_image(image: UploadFile) -> np.ndarray:
    """Process uploaded image and return face encoding"""
    try:
        # Read image file
        contents = await image.read()
        image_pil = Image.open(io.BytesIO(contents))
        
        # Convert to RGB (in case of RGBA)
        if image_pil.mode != 'RGB':
            image_pil = image_pil.convert('RGB')
            
        # Convert PIL Image to numpy array
        image_array = np.array(image_pil)
        
        # Get face encoding
        face_locations = face_recognition.face_locations(image_array)
        
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in image")
            
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if not face_encodings:
            raise HTTPException(status_code=400, detail="Failed to encode face")
            
        return face_encodings[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    finally:
        await image.seek(0)

def process_base64_image(base64_image: str) -> np.ndarray:
    """Process base64 image and return face encoding"""
    try:
        # Remove data:image/jpeg;base64, prefix if present
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
            
        # Decode base64 image
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB (in case of RGBA)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        # Convert PIL Image to numpy array
        image_array = np.array(image)
        
        # Get face encoding
        face_locations = face_recognition.face_locations(image_array)
        
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in image")
            
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if not face_encodings:
            raise HTTPException(status_code=400, detail="Failed to encode face")
            
        return face_encodings[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

def encode_face_encoding(encoding: np.ndarray) -> str:
    """Convert numpy array to JSON string for storage"""
    return json.dumps(encoding.tolist())

def decode_face_encoding(encoding_str: str) -> np.ndarray:
    """Convert JSON string back to numpy array"""
    return np.array(json.loads(encoding_str))


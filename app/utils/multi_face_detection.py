"""
Multi-face detection module for the hotel face recognition system.
"""
import cv2
import numpy as np
import face_recognition
from typing import List, Dict, Any, Optional, Tuple
import logging
from sqlalchemy.orm import Session
from io import BytesIO
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def detect_multiple_faces(image: np.ndarray, model: str = "hog") -> List[Dict[str, Any]]:
    """
    Detect multiple faces in an image and return their locations and encodings.
    
    Args:
        image: Image as numpy array
        model: Face detection model to use ('hog' or 'cnn')
        
    Returns:
        List of dictionaries containing face information
    """
    try:
        # Detect face locations
        face_locations = face_recognition.face_locations(image, model=model)
        
        if not face_locations:
            logger.info("No faces detected in image")
            return []
        
        # Extract face encodings
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        # Prepare results
        results = []
        for i, (location, encoding) in enumerate(zip(face_locations, face_encodings)):
            top, right, bottom, left = location
            face_width = right - left
            face_height = bottom - top
            
            # Calculate face center
            center_x = left + face_width // 2
            center_y = top + face_height // 2
            
            # Calculate face size (area)
            face_size = face_width * face_height
            
            results.append({
                "id": i,
                "location": {
                    "top": top,
                    "right": right,
                    "bottom": bottom,
                    "left": left
                },
                "center": {
                    "x": center_x,
                    "y": center_y
                },
                "size": face_size,
                "width": face_width,
                "height": face_height,
                "encoding": encoding.tolist()
            })
        
        # Sort by face size (larger faces first)
        results = sorted(results, key=lambda x: x["size"], reverse=True)
        
        logger.info(f"Detected {len(results)} faces in image")
        return results
    
    except Exception as e:
        logger.error(f"Error in detect_multiple_faces: {str(e)}")
        return []

def detect_and_recognize_multiple_faces(image_data: bytes, db: Session, max_faces: int = 5, threshold: float = 0.6) -> List[Dict[str, Any]]:
    """
    Detect and recognize multiple faces in an image.
    
    Args:
        image_data: Raw image data
        db: Database session
        max_faces: Maximum number of faces to detect
        threshold: Similarity threshold
        
    Returns:
        List of recognition results for each face
    """
    try:
        # Import here to avoid circular imports
        from .face_recognition import verify_face, convert_image_to_array
        
        # Convert image data to numpy array
        image = convert_image_to_array(image_data)
        if image is None:
            logger.error("Failed to convert image to array")
            return []
        
        # Detect faces
        faces = detect_multiple_faces(image)
        
        # Limit number of faces
        faces = faces[:max_faces]
        
        # Recognize each face
        results = []
        for face in faces:
            # Get face encoding
            face_encoding = np.array(face["encoding"])
            
            # Verify face against database
            result = verify_face(face_encoding, db, threshold)
            
            # Add face location to result
            result["face_location"] = face["location"]
            result["face_size"] = face["size"]
            
            results.append(result)
        
        logger.info(f"Recognized {len(results)} faces")
        return results
    
    except Exception as e:
        logger.error(f"Error in detect_and_recognize_multiple_faces: {str(e)}")
        return []

def process_multiple_faces(image_data: bytes, model: str = "hog") -> Dict[str, Any]:
    """
    Process image data to detect and analyze multiple faces.
    
    Args:
        image_data: Raw image data
        model: Face detection model to use ('hog' or 'cnn')
        
    Returns:
        Dictionary with detection results
    """
    try:
        # Convert image data to numpy array
        image = convert_image_to_array(image_data)
        if image is None:
            return {"success": False, "message": "Failed to process image", "faces": []}
        
        # Detect faces
        faces = detect_multiple_faces(image, model)
        
        # Analyze image quality
        quality = analyze_image_quality(image)
        
        return {
            "success": True,
            "message": f"Detected {len(faces)} faces",
            "faces": faces,
            "quality": quality,
            "total_faces": len(faces)
        }
    
    except Exception as e:
        logger.error(f"Error in process_multiple_faces: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}", "faces": []}

def convert_image_to_array(image_data: bytes) -> Optional[np.ndarray]:
    """
    Convert image data to numpy array.
    
    Args:
        image_data: Raw image data
        
    Returns:
        Numpy array representation of the image
    """
    try:
        # Convert image data to numpy array
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        return np.array(image)
    
    except Exception as e:
        logger.error(f"Error converting image to array: {str(e)}")
        return None

def analyze_image_quality(image: np.ndarray) -> Dict[str, Any]:
    """
    Analyze image quality for face detection.
    
    Args:
        image: Image as numpy array
        
    Returns:
        Dictionary with quality metrics
    """
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Calculate brightness
        brightness = np.mean(gray)
        
        # Calculate contrast
        contrast = np.std(gray)
        
        # Calculate blur
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        blur = np.var(laplacian)
        
        # Determine if image quality is good enough
        is_bright_enough = brightness > 40
        is_contrast_enough = contrast > 20
        is_sharp_enough = blur > 100
        
        overall_quality = "good" if (is_bright_enough and is_contrast_enough and is_sharp_enough) else "poor"
        
        return {
            "brightness": float(brightness),
            "contrast": float(contrast),
            "sharpness": float(blur),
            "is_bright_enough": is_bright_enough,
            "is_contrast_enough": is_contrast_enough,
            "is_sharp_enough": is_sharp_enough,
            "overall": overall_quality
        }
    
    except Exception as e:
        logger.error(f"Error analyzing image quality: {str(e)}")
        return {
            "brightness": 0,
            "contrast": 0,
            "sharpness": 0,
            "is_bright_enough": False,
            "is_contrast_enough": False,
            "is_sharp_enough": False,
            "overall": "error"
        }

def group_faces_by_distance(faces: List[Dict[str, Any]], max_distance: float = 0.6) -> List[List[Dict[str, Any]]]:
    """
    Group faces by similarity.
    
    Args:
        faces: List of face dictionaries
        max_distance: Maximum face distance to consider as same person
        
    Returns:
        List of face groups
    """
    try:
        if not faces:
            return []
        
        # Extract face encodings
        encodings = [np.array(face["encoding"]) for face in faces]
        
        # Initialize groups
        groups = []
        processed = set()
        
        for i, face in enumerate(faces):
            if i in processed:
                continue
            
            # Create new group
            group = [face]
            processed.add(i)
            
            # Find similar faces
            for j, other_face in enumerate(faces):
                if j in processed or i == j:
                    continue
                
                # Calculate face distance
                distance = face_recognition.face_distance([encodings[i]], encodings[j])[0]
                
                # Add to group if similar
                if distance < max_distance:
                    group.append(other_face)
                    processed.add(j)
            
            groups.append(group)
        
        return groups
    
    except Exception as e:
        logger.error(f"Error grouping faces: {str(e)}")
        return [[face] for face in faces]

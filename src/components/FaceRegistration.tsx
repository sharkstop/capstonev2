
import React, { useState } from 'react';
import FaceRegistrationContainer from './registration/face/FaceRegistrationContainer';

interface FaceRegistrationProps {
  onComplete: (imageSrc: string, faceDescriptor: Float32Array) => void;
  location?: string;
}

const FaceRegistration = ({ onComplete, location }: FaceRegistrationProps) => {
  return (
    <FaceRegistrationContainer 
      onComplete={onComplete}
      location={location} 
    />
  );
};

export default FaceRegistration;

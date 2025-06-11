
import React from 'react';

type RegistrationStep = 'user-type' | 'face-capture' | 'form' | 'success';

interface RegistrationTitleProps {
  currentStep: RegistrationStep;
}

const RegistrationTitle: React.FC<RegistrationTitleProps> = ({ currentStep }) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold mb-2">
        {currentStep === 'user-type' && 'Choose Registration Type'}
        {currentStep === 'face-capture' && 'Face Registration'}
        {currentStep === 'form' && 'Complete Your Profile'}
        {currentStep === 'success' && 'Registration Successful'}
      </h1>
      <p className="text-muted-foreground">
        {currentStep === 'user-type' && 'Select whether you are registering as a hotel guest or employee'}
        {currentStep === 'face-capture' && 'Capture your face to set up facial recognition access'}
        {currentStep === 'form' && 'Fill in your personal details to complete registration'}
        {currentStep === 'success' && 'Your facial recognition access has been set up successfully'}
      </p>
    </div>
  );
};

export default RegistrationTitle;

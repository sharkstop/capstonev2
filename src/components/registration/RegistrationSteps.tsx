
import React from 'react';

type RegistrationStep = 'user-type' | 'face-capture' | 'form' | 'success';

interface RegistrationStepsProps {
  currentStep: RegistrationStep;
}

const RegistrationSteps: React.FC<RegistrationStepsProps> = ({ currentStep }) => {
  return (
    <div className="max-w-3xl mx-auto w-full mb-8">
      <div className="flex items-center justify-between">
        {/* Steps indicator pills */}
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-12 rounded-full ${currentStep === 'user-type' ? 'bg-primary' : 'bg-primary/40'}`}></div>
          <div className={`h-2 w-12 rounded-full ${currentStep === 'face-capture' ? 'bg-primary' : currentStep === 'form' || currentStep === 'success' ? 'bg-primary/40' : 'bg-muted'}`}></div>
          <div className={`h-2 w-12 rounded-full ${currentStep === 'form' ? 'bg-primary' : currentStep === 'success' ? 'bg-primary/40' : 'bg-muted'}`}></div>
          <div className={`h-2 w-12 rounded-full ${currentStep === 'success' ? 'bg-primary' : 'bg-muted'}`}></div>
        </div>
        
        {/* Step indicator text */}
        <div className="text-sm font-medium text-muted-foreground">
          Step {
            currentStep === 'user-type' ? '1' : 
            currentStep === 'face-capture' ? '2' : 
            currentStep === 'form' ? '3' : '4'
          } of 4
        </div>
      </div>
    </div>
  );
};

export default RegistrationSteps;

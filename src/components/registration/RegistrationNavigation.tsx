
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type RegistrationStep = 'user-type' | 'face-capture' | 'form' | 'success';

interface RegistrationNavigationProps {
  currentStep: RegistrationStep;
  handleGoBack: () => void;
}

const RegistrationNavigation: React.FC<RegistrationNavigationProps> = ({ currentStep, handleGoBack }) => {
  return (
    <>
      {/* Back button */}
      {currentStep !== 'user-type' && (
        <Button 
          variant="ghost" 
          onClick={handleGoBack} 
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}
      
      {/* Spacer for alignment when back button is not shown */}
      {currentStep === 'user-type' && <div></div>}
    </>
  );
};

export default RegistrationNavigation;

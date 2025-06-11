
import React from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useNavigate } from 'react-router-dom';

const RegistrationHeader: React.FC = () => {
  const navigate = useNavigate();
  
  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <header className="container mx-auto p-4 flex items-center justify-between">
      <Logo className="text-primary" />
      
      <Button 
        variant="ghost" 
        onClick={handleReturnHome}
      >
        Return Home
      </Button>
    </header>
  );
};

export default RegistrationHeader;

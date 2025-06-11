
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RegistrationSuccessProps {
  userType: 'guest' | 'employee' | null;
  handleReturnHome: () => void;
}

const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({ userType, handleReturnHome }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto text-center"
    >
      <div className="glass-card p-8 rounded-xl shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
            <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Registration Complete!</h2>
        
        <p className="text-muted-foreground mb-6">
          {userType === 'guest' 
            ? 'You can now use facial recognition to access your room and hotel facilities.' 
            : 'You can now use facial recognition for secure access to staff areas.'}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/access')} 
            className="w-full"
          >
            Try Access Control
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleReturnHome} 
            className="w-full"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default RegistrationSuccess;

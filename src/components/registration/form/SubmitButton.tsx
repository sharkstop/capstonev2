
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck } from 'lucide-react';

interface SubmitButtonProps {
  isSubmitting?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isSubmitting = false }) => {
  return (
    <div className="pt-2">
      <Button 
        type="submit" 
        className="w-full relative overflow-hidden transition-all duration-300" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="animate-pulse">جاري التسجيل...</span>
          </>
        ) : (
          <>
            <UserCheck className="mr-2 h-4 w-4" />
            إكمال التسجيل
          </>
        )}
        
        {/* شريط التقدم الذي يظهر عند التسجيل */}
        {isSubmitting && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-white/30" 
            style={{ 
              width: '100%', 
              animation: 'progressAnimation 2s infinite',
              backgroundImage: 'linear-gradient(to right, transparent, white, transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        )}
      </Button>
      
      <style>
        {`
          @keyframes progressAnimation {
            0% { background-position: 100% 0; }
            100% { background-position: 0 0; }
          }
        `}
      </style>
    </div>
  );
};

export default SubmitButton;

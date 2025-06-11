
import React from 'react';
import { AlertTriangle, RefreshCw, Camera, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface FaceRegistrationErrorProps {
  error: string;
  startCapture: () => void;
}

const FaceRegistrationError: React.FC<FaceRegistrationErrorProps> = ({ error, startCapture }) => {
  const { language } = useLanguage();
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-2" />
      <p className="text-red-500 text-center px-4 mb-4 max-w-md">
        {error}
      </p>
      <div className="flex flex-col gap-3">
        <Button variant="outline" onClick={startCapture} className="mb-2">
          <RefreshCw className="h-4 w-4 me-2" />
          {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
        </Button>
        
        <div className="flex flex-col gap-2">
          <a 
            href={language === 'ar' 
              ? "https://support.google.com/chrome/answer/2693767?hl=ar" 
              : "https://support.google.com/chrome/answer/2693767?hl=en"}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary text-sm text-center hover:underline flex items-center justify-center"
          >
            <Camera className="h-4 w-4 me-1" />
            {language === 'ar' 
              ? 'كيفية السماح بالوصول إلى الكاميرا'
              : 'How to enable camera access'}
          </a>
          
          <a 
            href="chrome://settings/content/camera" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary text-sm text-center hover:underline flex items-center justify-center"
          >
            <Settings className="h-4 w-4 me-1" />
            {language === 'ar'
              ? 'فتح إعدادات الكاميرا مباشرة'
              : 'Open camera settings directly'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistrationError;

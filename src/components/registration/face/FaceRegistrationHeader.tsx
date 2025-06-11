
import React from 'react';
import { Camera } from 'lucide-react';

const FaceRegistrationHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <Camera className="h-16 w-16 text-muted-foreground mb-2" />
      <p className="text-muted-foreground text-center px-4">
        انقر على "بدء الكاميرا" لبدء تسجيل الوجه
      </p>
    </div>
  );
};

export default FaceRegistrationHeader;

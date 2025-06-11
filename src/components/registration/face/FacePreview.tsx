
import React from 'react';
import { Check } from 'lucide-react';

interface FacePreviewProps {
  imageSrc: string;
}

const FacePreview: React.FC<FacePreviewProps> = ({ imageSrc }) => {
  return (
    <div className="absolute inset-0">
      <img 
        src={imageSrc} 
        alt="الوجه الملتقط" 
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 right-2">
        <div className="flex items-center bg-green-500 text-white px-2 py-1 rounded-full">
          <Check className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">تم الالتقاط</span>
        </div>
      </div>
    </div>
  );
};

export default FacePreview;

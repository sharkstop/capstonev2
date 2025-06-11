
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check } from 'lucide-react';

interface FaceCaptureControlsProps {
  captureMode: boolean;
  captured: boolean;
  isLoading: boolean;
  faceDetected: boolean;
  startCapture: () => void;
  captureImage: () => void;
  resetCapture: () => void;
  confirmImage: () => void;
}

const FaceCaptureControls: React.FC<FaceCaptureControlsProps> = ({
  captureMode,
  captured,
  isLoading,
  faceDetected,
  startCapture,
  captureImage,
  resetCapture,
  confirmImage
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {!captureMode && !captured && !isLoading && (
        <Button className="w-full" onClick={startCapture}>
          <Camera className="h-4 w-4 mr-2" />
          بدء الكاميرا
        </Button>
      )}
      
      {captureMode && !captured && !isLoading && (
        <>
          <Button 
            className="w-full" 
            onClick={captureImage}
            disabled={!faceDetected}
          >
            <Camera className="h-4 w-4 mr-2" />
            التقاط
          </Button>
          <Button variant="outline" className="w-full" onClick={resetCapture}>
            إلغاء
          </Button>
        </>
      )}
      
      {captured && !isLoading && (
        <>
          <Button className="w-full" onClick={confirmImage}>
            <Check className="h-4 w-4 mr-2" />
            تأكيد
          </Button>
          <Button variant="outline" className="w-full" onClick={resetCapture}>
            إعادة الالتقاط
          </Button>
        </>
      )}
    </div>
  );
};

export default FaceCaptureControls;

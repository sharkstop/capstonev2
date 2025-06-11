import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFaceDetectionWithDisplay, startScan, stopScan } from '@/services/faceRecognitionService';

// تعريف الـ Props باستخدام interface
interface FaceCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  faceCanvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetected: boolean;
  setFaceDetected: (detected: boolean) => void;
  isLoading: boolean;
  permissionError: string | null;
  onRetryPermission: () => void;
  stream?: MediaStream | null; // أضفت هنا
}

const FaceCapture: React.FC<FaceCaptureProps> = ({
  videoRef,
  faceCanvasRef,
  faceDetected,
  setFaceDetected,
  isLoading,
  permissionError,
  onRetryPermission,
  stream, // أضفت هنا
}) => {
  const detectionIntervalRef = useRef<number | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video
        .play()
        .catch(err => console.warn('خطأ في تشغيل الفيديو:', err));
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      stopScan();
    };
  }, [stream]); // أضفت stream كـ dependency

  const startFaceDetection = async () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    if (!videoRef.current) return;

    try {
      await startScan(videoRef.current);
      detectionIntervalRef.current = window.setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            const detection = await getFaceDetectionWithDisplay(
              videoRef.current,
              faceCanvasRef.current
            );
            const detected = !!detection;
            setFaceDetected(detected);
            if (detected) setErrorCount(0);
          } catch (error) {
            console.error('Face detection failed:', error);
            setErrorCount(prev => prev + 1);
            if (errorCount > 5 && detectionIntervalRef.current) {
              clearInterval(detectionIntervalRef.current);
              stopScan();
            }
          }
        } else {
          console.log('Video element not ready yet for face detection');
        }
      }, 300);
    } catch (error) {
      console.error('خطأ في بدء كشف الوجه:', error);
    }
  };

  if (permissionError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-2" />
        <p className="text-red-500 text-center px-4 mb-4 max-w-md">{permissionError}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={onRetryPermission}>إعادة المحاولة</Button>
          <a
            href="https://support.google.com/chrome/answer/2693767?hl=ar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm text-center hover:underline"
          >
            كيفية السماح بالوصول إلى الكاميرا
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        onLoadedMetadata={() => {
          console.log('🎥 Metadata loaded, playing video');
          if (videoRef.current) {
            videoRef.current.play().catch(err => console.warn('Playback error:', err));
          }
          startFaceDetection();
        }}
      />

      <canvas
        ref={faceCanvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />

      {!faceDetected && !isLoading && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm flex items-center shadow animate-pulse">
          <Camera className="h-3 w-3 mr-1" />
          انظر إلى الكاميرا مباشرة
        </div>
      )}

      {faceDetected && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm flex items-center shadow">
          <Check className="h-3 w-3 mr-1" /> تم الكشف عن وجه
        </div>
      )}
    </div>
  );
};

export default FaceCapture;
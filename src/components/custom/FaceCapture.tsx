import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Card, Progress, Alert, Spin } from 'antd';
import { VideoCameraOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface FaceCaptureProps {
  onFaceDetected?: (faceData: any) => void;
  onMultipleFacesDetected?: (facesData: any[]) => void;
  location?: string;
  mode?: 'register' | 'verify' | 'multi-verify';
  maxFaces?: number;
  showPreview?: boolean;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onFaceDetected,
  onMultipleFacesDetected,
  location = 'main_entrance',
  mode = 'verify',
  maxFaces = 5,
  showPreview = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // تهيئة الكاميرا
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                resolve();
              };
            }
          });
          
          if (videoRef.current) {
            videoRef.current.play();
            setIsCapturing(true);
          }
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('فشل في الوصول إلى الكاميرا. يرجى التحقق من الأذونات.');
      }
    }
    
    setupCamera();
    
    // تنظيف عند إزالة المكون
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // التقاط صورة من الكاميرا
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !isCapturing) {
      setError('الكاميرا غير جاهزة.');
      return null;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        setError('فشل في إنشاء سياق الرسم.');
        return null;
      }
      
      // ضبط أبعاد الكانفاس لتطابق الفيديو
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // رسم الإطار الحالي على الكانفاس
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // تحويل الكانفاس إلى Blob
      return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            setError('فشل في تحويل الصورة.');
            resolve(null as unknown as Blob);
          }
        }, 'image/jpeg', 0.95);
      });
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('حدث خطأ أثناء التقاط الصورة.');
      return null;
    }
  };
  
  // التحقق من الوجه
  const verifyFace = async () => {
    setProcessing(true);
    setError(null);
    setVerificationResult(null);
    
    try {
      // التقاط صورة
      const imageBlob = await captureImage();
      if (!imageBlob) {
        setError('فشل في التقاط الصورة.');
        setProcessing(false);
        return;
      }
      
      // إنشاء FormData
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('location', location);
      
      // إرسال الطلب إلى الخادم
      const endpoint = mode === 'multi-verify' ? '/api/access/verify-multiple' : '/api/access/verify';
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // معالجة النتيجة
      if (mode === 'multi-verify') {
        setDetectedFaces(response.data.results || []);
        if (onMultipleFacesDetected) {
          onMultipleFacesDetected(response.data.results || []);
        }
      } else {
        setVerificationResult(response.data);
        if (onFaceDetected) {
          onFaceDetected(response.data);
        }
        
        // تشغيل الصوت المناسب
        if (response.data.success) {
          playSound('access_granted.mp3');
        } else {
          playSound('access_denied.mp3');
        }
      }
    } catch (err) {
      console.error('Error verifying face:', err);
      setError('حدث خطأ أثناء التحقق من الوجه.');
    } finally {
      setProcessing(false);
    }
  };
  
  // تشغيل صوت
  const playSound = (soundFile: string) => {
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.play().catch(err => console.error('Error playing sound:', err));
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  };
  
  // بدء العد التنازلي للتقاط الصورة تلقائياً
  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(interval);
          verifyFace();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };
  
  return (
    <Card title="التقاط الوجه" className="face-capture-card">
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-preview"
          muted
          playsInline
          style={{ display: showPreview ? 'block' : 'none' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {processing && (
          <div className="processing-overlay">
            <Spin size="large" tip="جاري معالجة الصورة..." />
          </div>
        )}
        
        {countdown !== null && (
          <div className="countdown-overlay">
            <div className="countdown">{countdown}</div>
          </div>
        )}
      </div>
      
      {error && (
        <Alert
          message="خطأ"
          description={error}
          type="error"
          showIcon
          className="error-alert"
        />
      )}
      
      {verificationResult && (
        <div className="verification-result">
          <Alert
            message={verificationResult.success ? "تم التعرف بنجاح" : "فشل التعرف"}
            description={verificationResult.message}
            type={verificationResult.success ? "success" : "error"}
            showIcon
            className="result-alert"
          />
          
          {verificationResult.user && (
            <div className="user-info">
              <h3>معلومات المستخدم</h3>
              <p><strong>الاسم:</strong> {verificationResult.user.name}</p>
              <p><strong>النوع:</strong> {verificationResult.user.user_type}</p>
              {verificationResult.user.room_number && (
                <p><strong>رقم الغرفة:</strong> {verificationResult.user.room_number}</p>
              )}
            </div>
          )}
          
          <div className="confidence-meter">
            <p>نسبة الثقة: {Math.round(verificationResult.confidence * 100)}%</p>
            <Progress
              percent={Math.round(verificationResult.confidence * 100)}
              status={verificationResult.success ? "success" : "exception"}
              strokeColor={verificationResult.success ? "#52c41a" : "#ff4d4f"}
            />
          </div>
        </div>
      )}
      
      {mode === 'multi-verify' && detectedFaces.length > 0 && (
        <div className="multi-face-results">
          <h3>تم اكتشاف {detectedFaces.length} وجوه</h3>
          {detectedFaces.map((face, index) => (
            <div key={index} className="face-result">
              <Alert
                message={face.success ? "تم التعرف بنجاح" : "فشل التعرف"}
                description={face.message}
                type={face.success ? "success" : "error"}
                showIcon
                className="face-alert"
              />
              
              {face.user && (
                <div className="user-info">
                  <p><strong>الاسم:</strong> {face.user.name}</p>
                  <p><strong>النوع:</strong> {face.user.user_type}</p>
                  {face.user.room_number && (
                    <p><strong>رقم الغرفة:</strong> {face.user.room_number}</p>
                  )}
                </div>
              )}
              
              <div className="confidence-meter">
                <p>نسبة الثقة: {Math.round(face.confidence * 100)}%</p>
                <Progress
                  percent={Math.round(face.confidence * 100)}
                  status={face.success ? "success" : "exception"}
                  strokeColor={face.success ? "#52c41a" : "#ff4d4f"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="action-buttons">
        <Button
          type="primary"
          icon={<VideoCameraOutlined />}
          onClick={verifyFace}
          loading={processing}
          disabled={!isCapturing || countdown !== null}
          className="verify-button"
        >
          {mode === 'register' ? 'التقاط صورة' : mode === 'multi-verify' ? 'التحقق من الوجوه المتعددة' : 'التحقق من الوجه'}
        </Button>
        
        <Button
          onClick={startCountdown}
          disabled={!isCapturing || processing || countdown !== null}
          className="countdown-button"
        >
          التقاط تلقائي (3 ثوان)
        </Button>
      </div>
      
      <style jsx>{`
        .video-container {
          position: relative;
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .video-preview {
          width: 100%;
          height: auto;
          background-color: #f0f0f0;
        }
        
        .processing-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          font-size: 18px;
        }
        
        .countdown-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.3);
        }
        
        .countdown {
          font-size: 72px;
          color: white;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }
        
        .error-alert {
          margin-top: 16px;
        }
        
        .verification-result {
          margin-top: 16px;
          padding: 16px;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        .result-alert {
          margin-bottom: 16px;
        }
        
        .user-info {
          margin: 16px 0;
          padding: 12px;
          border-radius: 6px;
          background-color: #f0f7ff;
        }
        
        .confidence-meter {
          margin-top: 12px;
        }
        
        .multi-face-results {
          margin-top: 16px;
        }
        
        .face-result {
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        .face-alert {
          margin-bottom: 12px;
        }
        
        .action-buttons {
          margin-top: 16px;
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        .verify-button {
          min-width: 150px;
        }
        
        .countdown-button {
          min-width: 150px;
        }
      `}</style>
    </Card>
  );
};

export default FaceCapture;

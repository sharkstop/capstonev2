import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import FaceCapture from './FaceCapture';
import FaceCaptureControls from './FaceCaptureControls';
import FacePreview from './FacePreview';
import FaceRegistrationHeader from './FaceRegistrationHeader';
import FaceRegistrationError from './FaceRegistrationError';
import FaceRegistrationStatus from './FaceRegistrationStatus';
import { 
  loadFaceRecognitionModels, 
  getFaceDescriptorFromMedia 
} from '@/services/faceRecognitionService';

interface FaceRegistrationContainerProps {
  onComplete: (imageSrc: string, faceDescriptor: Float32Array) => void;
  location?: string;
}

const FaceRegistrationContainer: React.FC<FaceRegistrationContainerProps> = ({ 
  onComplete,
  location 
}) => {
  const [captureMode, setCaptureMode] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // تحميل النماذج عند التركيب
  useEffect(() => {
    const backendUrl = localStorage.getItem('backendUrl');
    setUseBackend(!!backendUrl);

    const preloadModels = async () => {
      try {
        setIsLoading(true);
        if (!backendUrl) {
          await loadFaceRecognitionModels();
        }
        setModelsLoaded(true);
      } catch (err) {
        console.error("خطأ في تحميل النماذج:", err);
        setError("فشل تحميل نماذج التعرف على الوجوه.");
      } finally {
        setIsLoading(false);
      }
    };

    preloadModels();

    return () => {
      stopMediaStream();
    };
  }, []);

  // دالة لإيقاف بث الفيديو
  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (faceCanvasRef.current) {
      const ctx = faceCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, faceCanvasRef.current.width, faceCanvasRef.current.height);
      }
    }
  };

  // دالة انتظار جاهزية فيديو الريف - تم تحسينها بزيادة عدد المحاولات ووقت الانتظار
  const waitForVideoRef = useCallback(async (): Promise<HTMLVideoElement> => {
    let retries = 20; // زيادة من 10 إلى 20
    while (retries > 0) {
      if (videoRef.current) return videoRef.current;
      await new Promise(res => setTimeout(res, 200)); // زيادة من 100 إلى 200 مللي ثانية
      retries--;
    }
    throw new Error('عنصر الفيديو غير جاهز بعد انتظار');
  }, []);

  // معالجة أخطاء الكاميرا
  const handleCameraError = (error: any) => {
    console.error("خطأ في الوصول إلى الكاميرا:", error);
    stopMediaStream();

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      setPermissionError("لم تمنح الإذن للوصول إلى الكاميرا. يرجى السماح بالوصول إلى الكاميرا في إعدادات المتصفح.");
      toast.error("تم رفض الوصول إلى الكاميرا.");
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      setPermissionError("لم يتم العثور على كاميرا. يرجى التأكد من توصيل كاميرا.");
      toast.error("لم يتم العثور على كاميرا متصلة.");
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      setPermissionError("الكاميرا قيد الاستخدام من تطبيق آخر. يرجى إغلاق التطبيقات الأخرى.");
      toast.error("الكاميرا قيد الاستخدام.");
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      setPermissionError("لا يمكن العثور على كاميرا تلبي المتطلبات. سيتم المحاولة مرة أخرى بإعدادات أبسط.");
      startCapture(true);  // جرب ضبط أبسط
    } else {
      setPermissionError("حدث خطأ غير متوقع في الوصول إلى الكاميرا.");
      toast.error("حدث خطأ غير متوقع في الوصول إلى الكاميرا.");
    }
    setIsLoading(false);
    setCaptureMode(false);
  };

  // بدء التقاط الكاميرا (مع خيار ضبط أبسط) - تم تحسينها للتحقق من وجود عنصر الفيديو
  const startCapture = async (simpleSettings = false) => {
    try {
      console.log("بدء التقاط الكاميرا...");
      setError(null);
      setPermissionError(null);
      setFaceDetected(false);
      stopMediaStream();
      setIsLoading(true);
      setCaptureMode(true); // تعيين وضع الالتقاط إلى true مباشرة

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("المتصفح لا يدعم الوصول إلى الكاميرا.");
        setIsLoading(false);
        return;
      }

      // التحقق من وجود عنصر الفيديو قبل المتابعة
      if (!videoRef.current) {
        console.warn("عنصر الفيديو غير موجود، سيتم الانتظار...");
        // سنستمر في المحاولة لأن waitForVideoRef ستنتظر ظهور العنصر
      }

      const videoElement = await waitForVideoRef();
      console.log("تم العثور على عنصر الفيديو:", videoElement);

      // إيقاف أي بث قديم
      if (videoElement.srcObject) {
        (videoElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }

      // ضبط إعدادات الكاميرا
      const constraints = simpleSettings ? { video: true } : {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log("جاري طلب الوصول إلى الكاميرا...");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("تم الحصول على بث الكاميرا:", stream.getVideoTracks().length > 0);

      videoElement.srcObject = stream;
      console.log("تم تعيين srcObject للفيديو");

      // تأكد من أن الفيديو مرئي
      videoElement.style.display = 'block';

      // انتظر 200 مللي ثانية ثم تشغيل الفيديو
      await new Promise(res => setTimeout(res, 200));
      try {
        await videoElement.play();
        console.log("تم تشغيل الفيديو بنجاح");
      } catch (err) {
        console.warn("خطأ في تشغيل الفيديو:", err);
        // نستمر بالرغم من الخطأ
      }

      streamRef.current = stream;
    } catch (error) {
      handleCameraError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // التقاط صورة للوجه
  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      try {
        setIsLoading(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          toast.error("فشل الحصول على سياق الرسم.");
          return;
        }

        // تطابق حجم الكانفس مع الفيديو
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setImageSrc(imageData);

        // blob للصورة
        canvas.toBlob(async (blob) => {
          if (!blob) {
            toast.error("فشل في تحويل الصورة.");
            return;
          }
          setCapturedBlob(blob);

          const backendUrl = localStorage.getItem('backendUrl');

          if (backendUrl) {
            setFaceDescriptor(new Float32Array(128).fill(0));
            setCaptured(true);
            stopMediaStream();
          } else {
            const tempImg = new Image();
            tempImg.src = imageData;
            await new Promise((res) => { tempImg.onload = res; });

            const descriptor = await getFaceDescriptorFromMedia(tempImg);
            if (descriptor) {
              setFaceDescriptor(descriptor);
              setCaptured(true);
              stopMediaStream();
            } else {
              toast.error("لم يتم العثور على وجه في الصورة. يرجى المحاولة مجددًا.");
            }
          }
        }, 'image/jpeg', 0.9);
      } catch (err) {
        console.error("خطأ في التقاط الصورة:", err);
        toast.error("فشل التقاط الصورة. حاول مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // إعادة تعيين الحالة للبدء من جديد
  const resetCapture = () => {
    setCaptured(false);
    setImageSrc(null);
    setCapturedBlob(null);
    setCaptureMode(false);
    setError(null);
    setPermissionError(null);
    setFaceDetected(false);
    setFaceDescriptor(null);
    stopMediaStream();
  };

  // تأكيد الصورة
  const confirmImage = () => {
    if (imageSrc && (faceDescriptor || useBackend)) {
      onComplete(imageSrc, faceDescriptor || new Float32Array(128));
      toast.success("تم تسجيل صورة الوجه بنجاح");
    } else {
      toast.error("لم يتم التقاط صورة أو لم يتم العثور على وجه.");
    }
  };

  // إضافة useEffect لضمان بدء التقاط الكاميرا بعد تحميل المكون بالكامل
  useEffect(() => {
    if (captureMode && videoRef.current) {
      const timer = setTimeout(() => {
        console.log("تأكيد جاهزية الفيديو بعد تأخير");
        if (!streamRef.current) {
          startCapture(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [captureMode]);

  // تعديل الواجهة لتوضيح زر بدء الكاميرا
  const handleStartCameraClick = () => {
    console.log("تم النقر على زر بدء الكاميرا");
    startCapture(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg mx-auto"
    >
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-xl font-medium text-center mb-4">إعداد التعرف على الوجه</h3>

          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden mb-4">
            {/* إضافة عنصر الفيديو مباشرة هنا لضمان وجوده دائمًا في DOM */}
            <video 
              ref={videoRef} 
              style={{ display: captureMode && !captured ? 'block' : 'none' }}
              className="absolute inset-0 w-full h-full object-cover" 
              playsInline 
              muted
              autoPlay
            />

            {!captureMode && !captured && !error && !permissionError && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FaceRegistrationHeader />
                {/* إضافة زر بدء الكاميرا مباشرة هنا */}
                <button 
                  onClick={handleStartCameraClick}
                  className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full flex items-center"
                >
                  <span className="mr-2">بدء الكاميرا</span>
                </button>
              </div>
            )}

            {error && !permissionError && (
              <FaceRegistrationError error={error} startCapture={handleStartCameraClick} />
            )}

            {captureMode && !captured && (
              <FaceCapture
                startCapture={handleStartCameraClick}
                videoRef={videoRef}
                faceCanvasRef={faceCanvasRef}
                faceDetected={faceDetected}
                setFaceDetected={setFaceDetected}
                isLoading={isLoading}
                permissionError={permissionError}
                onRetryPermission={handleStartCameraClick}
              />
            )}

            {captured && imageSrc && <FacePreview imageSrc={imageSrc} />}

            {permissionError && !captureMode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
                <FaceRegistrationError error={permissionError} startCapture={handleStartCameraClick} />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={faceCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
          </div>

          <FaceCaptureControls
            captureMode={captureMode}
            captured={captured}
            isLoading={isLoading}
            faceDetected={faceDetected}
            startCapture={handleStartCameraClick}
            captureImage={captureImage}
            resetCapture={resetCapture}
            confirmImage={confirmImage}
          />

          <FaceRegistrationStatus />

          {useBackend && (
            <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-sm rounded-md">
              <p className="text-center">سيتم استخدام الخادم الخلفي للتعرف على الوجه</p>
              {location && (
                <p className="text-center text-xs mt-1">الموقع: {location}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FaceRegistrationContainer;


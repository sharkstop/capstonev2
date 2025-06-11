import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Camera, CheckCircle, XCircle, Upload, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import FaceCapture from './registration/face/FaceCapture';
import { 
  loadFaceRecognitionModels, 
  getFaceDescriptorFromMedia, 
  startScan, 
  stopScan 
} from '@/services/faceRecognitionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

import axios from 'axios';

// Interfaces
interface VerificationResponse {
  success: boolean;
  user?: { name: string, type: string, details: string, email: string, registered: string };
  confidence: number;
  door_unlocked: boolean;
}

interface LightingAnalysis {
  brightness: number;
  contrast: number;
  isOptimal: boolean;
}

interface FaceLandmarks {
  leftEye: [number, number][];
  rightEye: [number, number][];
  nose: [number, number][];
  mouth: [number, number][];
  jaw: [number, number][];
}

interface RecordingState {
  isRecording: boolean;
  recordedBlob: Blob | null;
  recordingDuration: number;
}

const FaceRecognition: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [location, setLocation] = useState<string>('');
  const [customAlarm, setCustomAlarm] = useState<File | null>(null);
  const [lightingAnalysis, setLightingAnalysis] = useState<LightingAnalysis>({ brightness: 0, contrast: 0, isOptimal: true });
  const [recordingState, setRecordingState] = useState<RecordingState>({ isRecording: false, recordedBlob: null, recordingDuration: 0 });
  const [autoEnhance, setAutoEnhance] = useState<boolean>(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.6);
  const [sendNotifications, setSendNotifications] = useState<boolean>(false);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(null);
  const [show3DModel, setShow3DModel] = useState<boolean>(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [continuousRecognition, setContinuousRecognition] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [peopleCount, setPeopleCount] = useState<number>(0);
  const [isCaptureInitialized, setIsCaptureInitialized] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const continuousRecognitionIntervalRef = useRef<number | null>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const preloadModelsAndCapture = async () => {
      try {
        setIsLoading(true);
        await loadFaceRecognitionModels();
        setModelsLoaded(true);
        if (!isCaptureInitialized) {
          await startCapture();
          const videoElement = videoRef.current;
          if (videoElement) await startScan(videoElement);
        }
      } catch (err) {
        console.error("خطأ في تحميل النماذج أو تهيئة الكاميرا:", err);
        toast.error("فشل تحميل نماذج التعرف أو الوصول إلى الكاميرا.");
        handleCameraError(err);
        playAlarmSound();
      } finally {
        setIsLoading(false);
      }
    };

    preloadModelsAndCapture();

    return () => {
      stopMediaStream();
      stopAlarmSound();
      stopRecording();
      if (continuousRecognitionIntervalRef.current) clearInterval(continuousRecognitionIntervalRef.current);
    };
  }, []);

  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (faceCanvasRef.current) {
      const ctx = faceCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, faceCanvasRef.current.width, faceCanvasRef.current.height);
    }
    if (analysisCanvasRef.current) {
      const ctx = analysisCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, analysisCanvasRef.current.width, analysisCanvasRef.current.height);
    }
    stopScan();
  };

  const waitForVideoRef = useCallback(async (): Promise<HTMLVideoElement> => {
    let retries = 20;
    while (retries > 0) {
      if (videoRef.current) return videoRef.current;
      await new Promise((res) => setTimeout(res, 200));
      retries--;
    }
    throw new Error('عنصر الفيديو غير جاهز بعد انتظار');
  }, []);

  const handleCameraError = (error: any) => {
    console.error("خطأ في الوصول إلى الكاميرا:", error);
    stopMediaStream();
    const errorMessage = error.message || error.toString();
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      setPermissionError("لم تمنح الإذن للوصول إلى الكاميرا.");
      toast.error("تم رفض الوصول إلى الكاميرا.");
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      setPermissionError("لم يتم العثور على كاميرا.");
      toast.error("لم يتم العثور على كاميرا متصلة.");
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      setPermissionError("الكاميرا قيد الاستخدام من تطبيق آخر.");
      toast.error("الكاميرا قيد الاستخدام.");
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      setPermissionError("لا يمكن العثور على كاميرا تلبي المتطلبات.");
      startCapture(true);
    } else if (errorMessage.includes('يجب بدء التحليل')) {
      setPermissionError("فشل في تهيئة التحليل، يرجى إعادة المحاولة.");
      setIsCaptureInitialized(false);
      startCapture();
    } else {
      setPermissionError("حدث خطأ غير متوقع في الوصول إلى الكاميرا.");
      toast.error("حدث خطأ غير متوقع.");
    }
    playAlarmSound();
    setIsLoading(false);
  };

  const analyzeLighting = (video: HTMLVideoElement): LightingAnalysis => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { brightness: 0, contrast: 0, isOptimal: false };

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let totalBrightness = 0;
    let minBrightness = 255;
    let maxBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
    }

    const avgBrightness = totalBrightness / (data.length / 4);
    const contrast = maxBrightness - minBrightness;
    const isOptimal = avgBrightness > 50 && avgBrightness < 200 && contrast > 50;

    return { brightness: avgBrightness, contrast, isOptimal };
  };

  const extractFaceLandmarks = (faceDescriptor: Float32Array): FaceLandmarks => {
    const landmarks: FaceLandmarks = {
      leftEye: [[100, 100], [120, 120]],
      rightEye: [[200, 100], [220, 120]],
      nose: [[150, 150]],
      mouth: [[140, 200], [160, 200]],
      jaw: [[100, 250], [200, 250]],
    };
    return landmarks;
  };

  const drawLandmarks = (landmarks: FaceLandmarks, video: HTMLVideoElement) => {
    const ctx = analysisCanvasRef.current?.getContext('2d');
    if (!ctx || !video.videoWidth || !video.videoHeight) return;

    ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00ff00';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';

    const minX = Math.min(...landmarks.jaw.map(p => p[0]));
    const maxX = Math.max(...landmarks.jaw.map(p => p[0]));
    const minY = Math.min(...landmarks.jaw.map(p => p[1]));
    const maxY = Math.max(...landmarks.jaw.map(p => p[1]));
    ctx.strokeRect(minX - 10, minY - 10, maxX - minX + 20, maxY - minY + 20);

    ['leftEye', 'rightEye', 'nose', 'mouth', 'jaw'].forEach(part => {
      const points = landmarks[part as keyof FaceLandmarks];
      ctx.beginPath();
      points.forEach((point, index) => {
        ctx.arc(point[0], point[1], 3, 0, Math.PI * 2);
        if (index > 0) ctx.lineTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('عين يسار', landmarks.leftEye[0][0] - 20, landmarks.leftEye[0][1] - 5);
    ctx.fillText('عين يمين', landmarks.rightEye[0][0] - 20, landmarks.rightEye[0][1] - 5);
    ctx.fillText('أنف', landmarks.nose[0][0] - 10, landmarks.nose[0][1] - 5);
    ctx.fillText('فم', landmarks.mouth[0][0] - 10, landmarks.mouth[0][1] - 5);
  };

  const startCapture = async (simpleSettings = false) => {
    if (isCaptureInitialized) return;
    try {
      setPermissionError(null);
      setFaceDetected(false);
      stopMediaStream();
      setIsLoading(true);

      const videoElement = await waitForVideoRef();
      if (videoElement.srcObject) {
        (videoElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;
      await videoElement.play().catch(err => { throw err; });

      await new Promise((resolve) => {
        if (videoElement.readyState >= 2) resolve(null);
        else videoElement.addEventListener('canplay', resolve, { once: true });
      });

      streamRef.current = stream;
      setIsCaptureInitialized(true);

      const lighting = analyzeLighting(videoElement);
      setLightingAnalysis(lighting);
      if (!lighting.isOptimal) toast.warning("الإضاءة غير مثالية، قد يؤثر ذلك على دقة التعرف.");

      await startScan(videoElement);
      if (continuousRecognition) startContinuousRecognition();
    } catch (error) {
      handleCameraError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    setIsCaptureInitialized(false);
    await startCapture();
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.style.filter = nightMode ? 'brightness(1.5) contrast(1.2)' : 'none';
  }, [nightMode]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.style.transform = `scale(${zoomLevel})`;
  }, [zoomLevel]);

  const startRecording = (stream: MediaStream) => {
    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setRecordingState((prev) => ({ ...prev, recordedBlob: blob, isRecording: false }));
    };

    mediaRecorder.start();
    setRecordingState((prev) => ({ ...prev, isRecording: true, recordingDuration: 0 }));

    const interval = setInterval(() => {
      setRecordingState((prev) => {
        const newDuration = prev.recordingDuration + 1;
        if (newDuration >= 10) {
          stopRecording();
          clearInterval(interval);
        }
        return { ...prev, recordingDuration: newDuration };
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      setRecordingState((prev) => ({ ...prev, isRecording: false }));
    }
  };

  const playAlarmSound = () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'running') stopAlarmSound();
      if (customAlarm && alarmAudioRef.current) {
        alarmAudioRef.current.play();
        setIsAlarmPlaying(true);
      } else {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.5);
        oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 1);

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        audioContextRef.current = audioContext;
        oscillatorRef.current = oscillator;
        gainNodeRef.current = gainNode;
        setIsAlarmPlaying(true);

        const interval = setInterval(() => {
          if (oscillator.frequency.value === 500) oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.5);
          else oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.5);
        }, 500);

        oscillator.onended = () => clearInterval(interval);
      }
    } catch (err) {
      console.error('خطأ في تشغيل صوت الإنذار:', err);
      toast.error('فشل في تشغيل صوت الإنذار.');
    }
  };

  const stopAlarmSound = () => {
    if (customAlarm && alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
    if (audioContextRef.current && oscillatorRef.current && gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      oscillatorRef.current.stop(audioContextRef.current.currentTime + 0.1);
      audioContextRef.current.close();
      audioContextRef.current = null;
      oscillatorRef.current = null;
      gainNodeRef.current = null;
    }
    setIsAlarmPlaying(false);
  };

  const handleAlarmUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error("يرجى تحميل ملف صوتي (مثل MP3 أو WAV).");
        return;
      }
      setCustomAlarm(file);
      if (alarmAudioRef.current) alarmAudioRef.current.src = URL.createObjectURL(file);
      toast.success("تم تحميل صوت الإنذار المخصص بنجاح!");
    }
  };

  const notifyAdmin = async (message: string, videoBlob?: Blob | null) => {
    try {
      const formData = new FormData();
      formData.append('message', message);
      if (notes) formData.append('notes', notes);
      if (videoBlob) formData.append('video', videoBlob, 'unknown_person.webm');
      await axios.post('http://localhost:8000/api/admin/notify', formData);
      toast.success("تم إرسال تنبيه للمسؤول!");
    } catch (err) {
      console.error("خطأ في إرسال التنبيه:", err);
      toast.error("فشل في إرسال تنبيه للمسؤول.");
      playAlarmSound();
    }
  };

  // Removed logAccessAttempt function as backend handles logging internally

  const identifyFace = async (faceEncoding: number[]): Promise<VerificationResponse> => {
    try {
      // TODO: Use REACT_APP_API_BASE_URL from environment variables if available and consistent with project setup
      const response = await axios.post('http://localhost:8000/api/verify', {
        face_encoding: JSON.stringify(faceEncoding),
        location,
      });
      return response.data;
    } catch (err) {
      console.error("خطأ في التعرف على الوجه:", err);
      playAlarmSound();
      throw new Error("فشل في التعرف على الوجه");
    }
  };

  const startRecognition = async () => {
    try {
      setIsLoading(true);
      if (videoRef.current && isCaptureInitialized) {
        let faceDescriptor = await getFaceDescriptorFromMedia(videoRef.current);
        if (faceDescriptor) {
          if (autoEnhance && !lightingAnalysis.isOptimal) {
            toast.info("جاري تحسين جودة الصورة...");
            await new Promise((res) => setTimeout(res, 500));
          }

          const faceEncoding = Array.from(faceDescriptor);
          const landmarks = extractFaceLandmarks(faceDescriptor);
          setFaceLandmarks(landmarks);
          drawLandmarks(landmarks, videoRef.current);

          const response = await identifyFace(faceEncoding);
          // Logging is now handled by the backend within the /api/verify call
          if (response.success && response.confidence >= confidenceThreshold) {
            toast.success(`مرحبًا ${response.user?.name}!`, { duration: 5000 });
            if (location) toast.info(`تم فتح الباب في ${location}`, { duration: 5000 });
            if (response.door_unlocked) toast.success("تم فتح الباب تلقائيًا!");
            setPeopleCount((prev) => prev + 1);
            return { ...response, user: response.user };
          } else {
            toast.error("شخص مجهول", { duration: 5000 });
            playAlarmSound();
            startRecording(streamRef.current!);
            if (sendNotifications && recordingState.recordedBlob) await notifyAdmin("تم اكتشاف شخص مجهول!", recordingState.recordedBlob);
            return { success: false, confidence: 0, door_unlocked: false };
          }
        } else {
          toast.error("لم يتم العثور على وجه.", { duration: 5000 });
          // Logging is now handled by the backend
          playAlarmSound();
        }
      }
    } catch (error) {
      console.error("خطأ في التعرف:", error);
      toast.error("فشل التعرف على الوجه.", { duration: 5000 });
      // Logging is now handled by the backend
      playAlarmSound();
    } finally {
      setIsLoading(false);
    }
  };

  const startContinuousRecognition = () => {
    if (continuousRecognitionIntervalRef.current) clearInterval(continuousRecognitionIntervalRef.current);
    continuousRecognitionIntervalRef.current = window.setInterval(async () => {
      if (faceDetected && !isLoading && isCaptureInitialized) await startRecognition();
    }, 1000);
  };

  const toggleContinuousRecognition = () => {
    setContinuousRecognition((prev) => {
      const newState = !prev;
      if (newState) {
        startContinuousRecognition();
        toast.info("تم تفعيل التعرف المستمر!");
      } else {
        if (continuousRecognitionIntervalRef.current) clearInterval(continuousRecognitionIntervalRef.current);
        toast.info("تم إيقاف التعرف المستمر!");
      }
      return newState;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-3xl mx-auto p-6"
    >
      <Card className="glass-card overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
            نظام التعرف على الوجه الذكي
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="mb-6">
            <Label htmlFor="location" className="text-gray-700 dark:text-gray-300 text-lg">
              الموقع (اختياري)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="أدخل الموقع (مثل: غرفة 101)"
              className="mt-2 p-2 text-lg"
            />
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-enhance" className="text-gray-700 dark:text-gray-300 text-lg">
                تحسين الإضاءة تلقائيًا
              </Label>
              <Switch id="auto-enhance" checked={autoEnhance} onCheckedChange={setAutoEnhance} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="send-notifications" className="text-gray-700 dark:text-gray-300 text-lg">
                إرسال تنبيهات للمسؤول
              </Label>
              <Switch id="send-notifications" checked={sendNotifications} onCheckedChange={setSendNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-3d" className="text-gray-700 dark:text-gray-300 text-lg">
                عرض نموذج 3D
              </Label>
              <Switch id="show-3d" checked={show3DModel} onCheckedChange={setShow3DModel} />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300 text-lg">
                عتبة الثقة: {(confidenceThreshold * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={(value) => setConfidenceThreshold(value[0])}
                min={0.3}
                max={0.9}
                step={0.05}
                className="mt-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 dark:text-gray-300 text-lg">
                تبديل الكاميرا ({facingMode === 'user' ? 'الأمامية' : 'خلفية'})
              </Label>
              <Button
                onClick={switchCamera}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center"
              >
                <Camera className="w-5 h-5 mr-2" /> تبديل
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="night-mode" className="text-gray-700 dark:text-gray-300 text-lg">
                الوضع الليلي
              </Label>
              <Switch id="night-mode" checked={nightMode} onCheckedChange={setNightMode} />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300 text-lg">
                التكبير: {zoomLevel.toFixed(1)}x
              </Label>
              <Slider
                value={[zoomLevel]}
                onValueChange={(value) => setZoomLevel(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="mt-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="continuous-recognition" className="text-gray-700 dark:text-gray-300 text-lg">
                التعرف المستمر
              </Label>
              <Switch
                id="continuous-recognition"
                checked={continuousRecognition}
                onCheckedChange={toggleContinuousRecognition}
              />
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="custom-alarm" className="text-gray-700 dark:text-gray-300 text-lg">
              تحميل صوت إنذار مخصص
            </Label>
            <div className="flex items-center mt-2">
              <Input
                id="custom-alarm"
                type="file"
                accept="audio/*"
                onChange={handleAlarmUpload}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('custom-alarm')?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" /> اختر ملف صوتي
              </Button>
              {customAlarm && <span className="ml-3 text-gray-600 dark:text-gray-400 text-lg">{customAlarm.name}</span>}
            </div>
            <audio ref={alarmAudioRef} preload="auto" />
          </div>

          <div className="mb-6">
            <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300 text-lg">
              ملاحظات للمسؤول (اختياري)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات عن الشخص المكتشف..."
              className="mt-2 p-2 text-lg"
            />
          </div>

          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-inner">
            <h4 className="text-xl font-medium text-gray-800 dark:text-gray-200">
              عدد الأشخاص المكتشفين: {peopleCount}
            </h4>
          </div>

          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-inner">
            <h4 className="text-xl font-medium text-gray-800 dark:text-gray-200">
              تحليل الإضاءة
            </h4>
            <div className="space-y-2">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">السطوع: {lightingAnalysis.brightness.toFixed(0)}</Label>
                <Progress value={(lightingAnalysis.brightness / 255) * 100} className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">التباين: {lightingAnalysis.contrast.toFixed(0)}</Label>
                <Progress value={(lightingAnalysis.contrast / 255) * 100} className="mt-1" />
              </div>
              <p className={lightingAnalysis.isOptimal ? 'text-green-500' : 'text-red-500 text-lg'}>
                {lightingAnalysis.isOptimal ? 'الإضاءة مثالية للتعرف' : 'الإضاءة غير مثالية، قد تؤثر على الدقة'}
              </p>
            </div>
          </div>

          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-6 shadow-2xl">
            <canvas ref={faceCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
            <canvas ref={analysisCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
            {show3DModel && <canvas ref={threeCanvasRef} className="absolute top-0 right-0 w-72 h-72 pointer-events-none bg-transparent" />}
            {permissionError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <p className="text-red-500 text-center px-4 mb-4 max-w-md text-lg">{permissionError}</p>
                <Button
                  onClick={() => { setIsCaptureInitialized(false); startCapture(false); }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full"
                >
                  إعادة المحاولة
                </Button>
              </div>
            )}
            {!permissionError && (
              <FaceCapture
                videoRef={videoRef}
                faceCanvasRef={faceCanvasRef}
                faceDetected={faceDetected}
                setFaceDetected={setFaceDetected}
                isLoading={isLoading}
                permissionError={permissionError}
                onRetryPermission={() => { setIsCaptureInitialized(false); startCapture(false); }}
                stream={streamRef.current}
              />
            )}
          </div>

          <AnimatePresence>
            {recordingState.isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-center mb-4"
              >
                <div className="flex items-center bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
                  <span className="text-red-500 text-lg">جاري التسجيل... {recordingState.recordingDuration} ث</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center gap-6 mt-6">
            <Button
              onClick={startRecognition}
              disabled={isLoading || !faceDetected || continuousRecognition}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full flex items-center text-lg"
            >
              <CheckCircle className="w-6 h-6 mr-2" /> تعرف على الوجه
            </Button>
            <Button
              onClick={stopMediaStream}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full flex items-center text-lg"
            >
              <XCircle className="w-6 h-6 mr-2" /> إيقاف
            </Button>
          </div>

          <AnimatePresence>
            {isAlarmPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-center mt-6"
              >
                <Button
                  onClick={stopAlarmSound}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center text-lg"
                >
                  {customAlarm ? <VolumeX className="w-6 h-6 mr-2" /> : <Volume2 className="w-6 h-6 mr-2" />} إيقاف الإنذار
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {faceDetected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-xl mt-6"
              >
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">تفاصيل المستخدم</h3>
                {faceDetected && (
                  <div className="grid grid-cols-2 gap-4 text-lg">
                    <div className="flex items-center">
                      <span>الاسم: <strong>{faceDetected ? 'جاري التحقق...' : 'غير معروف'}</strong></span>
                    </div>
                    <div className="flex items-center">
                      <span>النوع: <strong>{faceDetected ? 'جاري التحقق...' : 'غير معروف'}</strong></span>
                    </div>
                    <div className="flex items-center">
                      <span>التفاصيل: <strong>{faceDetected ? 'جاري التحقق...' : 'غير معروف'}</strong></span>
                    </div>
                    <div className="flex items-center">
                      <span>البريد الإلكتروني: <strong>{faceDetected ? 'جاري التحقق...' : 'غير معروف'}</strong></span>
                    </div>
                    <div className="flex items-center">
                      <span>تاريخ التسجيل: <strong>{faceDetected ? 'جاري التحقق...' : 'غير معروف'}</strong></span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {recordingState.recordedBlob && !recordingState.isRecording && (
            <div className="mt-6">
              <h4 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">تسجيل الفيديو</h4>
              <video src={URL.createObjectURL(recordingState.recordedBlob)} controls className="w-full rounded-xl" />
              <Button
                onClick={() => setRecordingState((prev) => ({ ...prev, recordedBlob: null }))}
                className="mt-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full"
              >
                حذف التسجيل
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FaceRecognition;
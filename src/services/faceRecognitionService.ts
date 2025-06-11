import * as faceapi from 'face-api.js';
import { toast } from 'sonner';

// متغيرات التحكم
let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;
let isScanning = false;

// دالة لتحميل نماذج التعرف على الوجوه
export const loadFaceRecognitionModels = async (): Promise<void> => {
  if (loadingPromise) return loadingPromise;
  if (modelsLoaded) return Promise.resolve();

  loadingPromise = (async () => {
    try {
      console.log('جاري تحميل نماذج التعرف على الوجوه...');
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      console.log('تم تحميل جميع نماذج التعرف على الوجوه بنجاح');
      toast.success('تم تحميل نماذج التعرف على الوجوه بنجاح');
    } catch (error) {
      console.error('خطأ في تحميل نماذج التعرف على الوجوه:', error);
      toast.error('فشل تحميل نماذج التعرف على الوجوه، يرجى التأكد من وجود النماذج في public/models');
      throw new Error('فشل تحميل نماذج التعرف على الوجوه');
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
};

// دالة للتحقق من جاهزية الـ video element مع إعادة المحاولة
const ensureMediaElementReady = async (mediaElement: HTMLVideoElement | HTMLImageElement): Promise<void> => {
  if (mediaElement instanceof HTMLVideoElement) {
    if (mediaElement.readyState < 2) {
      await new Promise<void>((resolve) => {
        const onCanPlay = () => {
          mediaElement.removeEventListener('canplay', onCanPlay);
          resolve();
        };
        mediaElement.addEventListener('canplay', onCanPlay, { once: true });
      });
    }
    let retries = 10;
    while (retries > 0 && (mediaElement.videoWidth === 0 || mediaElement.videoHeight === 0)) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      retries--;
    }
    if (mediaElement.videoWidth === 0 || mediaElement.videoHeight === 0) {
      throw new Error('الفيديو غير جاهز: الأبعاد غير متاحة بعد الانتظار');
    }
  }
};

// دالة لبدء التحليل مع إدارة التحقق الدقيق
export const startScan = async (mediaElement: HTMLVideoElement): Promise<void> => {
  try {
    if (!modelsLoaded) await loadFaceRecognitionModels();
    if (isScanning) return; // تجنب الاستدعاء المتكرر
    await ensureMediaElementReady(mediaElement);
    if (!mediaElement.srcObject || !(mediaElement.srcObject as MediaStream).active) {
      throw new Error('لا يوجد stream نشط أو الـ stream غير فعال');
    }
    isScanning = true;
    console.log('بدء التحليل بنجاح');
  } catch (error) {
    console.error('خطأ في بدء التحليل:', error);
    isScanning = false; // إعادة تعيين المتغير في حالة الفشل
    throw error;
  }
};

// دالة لإيقاف التحليل
export const stopScan = (): void => {
  isScanning = false;
  console.log('تم إيقاف التحليل');
};

// دالة للكشف عن الوجوه
export const detectFaces = async (mediaElement: HTMLImageElement | HTMLVideoElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>[] | null> => {
  try {
    if (!isScanning) await startScan(mediaElement as HTMLVideoElement); // بدء التحليل تلقائيًا إذا لم يبدأ
    await ensureMediaElementReady(mediaElement);
    const detections = await faceapi.detectAllFaces(mediaElement).withFaceLandmarks().withFaceDescriptors();
    return detections.length > 0 ? detections : null;
  } catch (error) {
    console.error('خطأ في الكشف عن الوجوه:', error);
    return null;
  }
};

// دالة للكشف عن وجه واحد
export const detectSingleFace = async (mediaElement: HTMLImageElement | HTMLVideoElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>> | null> => {
  try {
    if (!isScanning) await startScan(mediaElement as HTMLVideoElement); // بدء التحليل تلقائيًا
    await ensureMediaElementReady(mediaElement);
    const detection = await faceapi.detectSingleFace(mediaElement).withFaceLandmarks().withFaceDescriptor();
    return detection || null;
  } catch (error) {
    console.error('خطأ في الكشف عن الوجه:', error);
    return null;
  }
};

// دالة للحصول على بيانات الوجه وعرضها
export const getFaceDetectionWithDisplay = async (mediaElement: HTMLImageElement | HTMLVideoElement, canvas: HTMLCanvasElement | null): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>> | null> => {
  try {
    if (!isScanning) await startScan(mediaElement as HTMLVideoElement); // بدء التحليل تلقائيًا
    await ensureMediaElementReady(mediaElement);
    const detection = await faceapi.detectSingleFace(mediaElement).withFaceLandmarks().withFaceDescriptor();
    if (detection && canvas) {
      const displaySize = { width: mediaElement.width, height: mediaElement.height };
      if (mediaElement instanceof HTMLVideoElement) {
        displaySize.width = mediaElement.videoWidth;
        displaySize.height = mediaElement.videoHeight;
      }
      faceapi.matchDimensions(canvas, displaySize);
      const resizedDetection = faceapi.resizeResults(detection, displaySize);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const { detection } = resizedDetection;
        const box = detection.box;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        const cornerSize = Math.min(box.width, box.height) * 0.15;
        ctx.beginPath(); ctx.moveTo(box.x, box.y + cornerSize); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + cornerSize, box.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(box.x + box.width - cornerSize, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + cornerSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - cornerSize); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + cornerSize, box.y + box.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(box.x + box.width - cornerSize, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - cornerSize); ctx.stroke();
        ctx.shadowColor = 'rgba(0, 255, 255, 0.7)'; ctx.shadowBlur = 10; ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'; ctx.lineWidth = 1; ctx.strokeRect(box.x - 5, box.y - 5, box.width + 10, box.height + 10);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.setLineDash([]);
      }
    }
    return detection || null;
  } catch (error) {
    console.error('خطأ في الكشف عن الوجه وعرضه:', error);
    return null;
  }
};

// دالة لاستخراج واصف الوجه
export const getFaceDescriptorFromMedia = async (mediaElement: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | null> => {
  try {
    if (!isScanning) await startScan(mediaElement as HTMLVideoElement); // بدء التحليل تلقائيًا
    await ensureMediaElementReady(mediaElement);
    const detection = await detectSingleFace(mediaElement);
    if (detection) {
      console.log('تم استخراج واصف الوجه بنجاح');
      return detection.descriptor;
    }
    console.log('لم يتم العثور على وجه لاستخراج الواصف');
    return null;
  } catch (error) {
    console.error('خطأ في استخراج واصف الوجه:', error);
    return null;
  }
};

// دالة للمقارنة بين وجهين
export const compareFaces = (descriptor1: Float32Array, descriptor2: Float32Array): number => {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
};

// دالة للتحقق من تطابق
export const isFaceMatch = (distance: number, threshold = 0.6): boolean => {
  return distance < threshold;
};
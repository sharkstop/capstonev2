# دليل تكامل الواجهة الأمامية مع الميزات المتقدمة للتعرف على الوجوه

هذا الدليل يشرح كيفية دمج الميزات المتقدمة الجديدة للتعرف على الوجوه في الواجهة الأمامية الحالية. يتضمن شرحاً للنقاط النهائية (API Endpoints) الجديدة، وأمثلة على كيفية استخدامها، وشرحاً للتغييرات المطلوبة في الواجهة الأمامية.

## 1. نظام التعرف على وجوه متعددة

### نقطة النهاية الجديدة: `/api/access/verify-multiple`

```typescript
// مثال على استخدام نقطة النهاية للتعرف على وجوه متعددة
import axios from 'axios';

// دالة للتعرف على وجوه متعددة في صورة
async function verifyMultipleFaces(imageData: Blob, location: string = 'lobby') {
  // إنشاء كائن FormData
  const formData = new FormData();
  formData.append('image', imageData);
  formData.append('location', location);
  
  try {
    const response = await axios.post('/api/access/verify-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
    // الاستجابة ستكون بالشكل التالي:
    // {
    //   "success": true,
    //   "results": [
    //     {
    //       "success": true,
    //       "user": {
    //         "id": 1,
    //         "name": "أحمد محمد",
    //         "user_type": "guest",
    //         "room_number": "101"
    //       },
    //       "confidence": 0.92,
    //       "message": "Face recognized successfully"
    //     },
    //     {
    //       "success": false,
    //       "user": null,
    //       "confidence": 0.45,
    //       "message": "Face not recognized"
    //     }
    //   ],
    //   "total_faces": 2,
    //   "recognized_faces": 1
    // }
  } catch (error) {
    console.error('Error verifying multiple faces:', error);
    throw error;
  }
}

// استخدام الدالة مع صورة من كاميرا الويب
async function captureAndVerifyMultipleFaces() {
  try {
    // الحصول على صورة من كاميرا الويب
    const videoElement = document.getElementById('video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    
    // تحويل الصورة إلى Blob
    const imageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
    
    // إرسال الصورة للتحقق
    const results = await verifyMultipleFaces(imageBlob, 'hotel_entrance');
    
    // معالجة النتائج
    handleVerificationResults(results);
  } catch (error) {
    console.error('Error in capture and verify:', error);
  }
}

// معالجة نتائج التحقق
function handleVerificationResults(results) {
  // عرض عدد الوجوه المكتشفة
  console.log(`تم اكتشاف ${results.total_faces} وجوه`);
  console.log(`تم التعرف على ${results.recognized_faces} وجوه`);
  
  // معالجة كل وجه على حدة
  results.results.forEach((result, index) => {
    if (result.success) {
      console.log(`الوجه ${index + 1}: تم التعرف عليه - ${result.user.name}`);
      // تشغيل صوت النجاح
      playSuccessSound();
      // عرض معلومات المستخدم
      displayUserInfo(result.user);
    } else {
      console.log(`الوجه ${index + 1}: غير معروف - الثقة: ${result.confidence}`);
      // تشغيل صوت التنبيه
      playAlertSound();
      // تسجيل الوجه غير المعروف
      logUnknownFace();
    }
  });
}
```

## 2. نظام الإنذارات الصوتية المخصصة

### نقطة النهاية الجديدة: `/api/alerts/trigger`

```typescript
// مثال على استخدام نظام الإنذارات الصوتية
import axios from 'axios';

// أنواع الإنذارات المتاحة
const ALERT_TYPES = {
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  VIP_DETECTED: 'vip_detected',
  MULTIPLE_FACES: 'multiple_faces',
  LOW_CONFIDENCE: 'low_confidence',
  SYSTEM_ERROR: 'system_error'
};

// دالة لتشغيل إنذار صوتي
async function triggerAlert(alertType: string, userId?: number, location?: string, additionalData?: any) {
  try {
    const response = await axios.post('/api/alerts/trigger', {
      alert_type: alertType,
      user_id: userId,
      location: location,
      additional_data: additionalData
    });
    
    if (response.data.success) {
      // تشغيل الصوت في المتصفح
      playAlertSound(response.data.alert_data.sound, response.data.alert_data.volume);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error triggering alert:', error);
    throw error;
  }
}

// دالة لتشغيل صوت في المتصفح
function playAlertSound(soundFile: string, volume: number = 0.7) {
  const audio = new Audio(`/sounds/${soundFile}`);
  audio.volume = volume;
  audio.play().catch(err => console.error('Error playing sound:', err));
}

// استخدام الدالة عند التعرف على مستخدم
function onUserRecognized(user) {
  if (user.user_type === 'vip') {
    // تشغيل إنذار VIP
    triggerAlert(ALERT_TYPES.VIP_DETECTED, user.id, 'main_entrance', {
      room_number: user.room_number,
      check_in_date: user.check_in_date
    });
  } else {
    // تشغيل إنذار الوصول المسموح
    triggerAlert(ALERT_TYPES.ACCESS_GRANTED, user.id, 'main_entrance');
  }
}

// استخدام الدالة عند عدم التعرف على مستخدم
function onUserNotRecognized(confidence: number) {
  if (confidence > 0.4) {
    // ثقة منخفضة ولكن قريبة من الحد
    triggerAlert(ALERT_TYPES.LOW_CONFIDENCE, null, 'main_entrance', {
      confidence: confidence
    });
  } else {
    // عدم التعرف تماماً
    triggerAlert(ALERT_TYPES.ACCESS_DENIED, null, 'main_entrance');
  }
}
```

### نقطة النهاية الجديدة: `/api/alerts/settings`

```typescript
// مثال على إدارة إعدادات الإنذارات
import axios from 'axios';

// دالة للحصول على جميع إعدادات الإنذارات
async function getAllAlertSettings() {
  try {
    const response = await axios.get('/api/alerts/settings');
    return response.data.settings;
  } catch (error) {
    console.error('Error getting alert settings:', error);
    throw error;
  }
}

// دالة لتحديث إعدادات إنذار معين
async function updateAlertSettings(alertType: string, settings: {
  sound?: string,
  volume?: number,
  enabled?: boolean
}) {
  try {
    const response = await axios.put(`/api/alerts/settings/${alertType}`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating alert settings:', error);
    throw error;
  }
}

// مثال على استخدام الدوال في واجهة المستخدم
async function initializeAlertSettingsUI() {
  // الحصول على جميع الإعدادات
  const settings = await getAllAlertSettings();
  
  // عرض الإعدادات في واجهة المستخدم
  Object.entries(settings).forEach(([alertType, setting]) => {
    // إنشاء عناصر واجهة المستخدم لكل نوع إنذار
    createAlertSettingUI(alertType, setting);
  });
}

// دالة لإنشاء واجهة مستخدم لإعدادات الإنذار
function createAlertSettingUI(alertType, setting) {
  // هذه مجرد أمثلة على كيفية إنشاء واجهة المستخدم
  const container = document.createElement('div');
  container.className = 'alert-setting';
  
  // عنوان الإنذار
  const title = document.createElement('h3');
  title.textContent = setting.description;
  
  // زر تفعيل/تعطيل
  const enableToggle = document.createElement('input');
  enableToggle.type = 'checkbox';
  enableToggle.checked = setting.enabled;
  enableToggle.addEventListener('change', () => {
    updateAlertSettings(alertType, { enabled: enableToggle.checked });
  });
  
  // اختيار ملف الصوت
  const soundSelect = document.createElement('select');
  // إضافة خيارات الصوت
  ['access_granted.mp3', 'access_denied.mp3', 'vip_alert.mp3', 'multiple_faces.mp3'].forEach(sound => {
    const option = document.createElement('option');
    option.value = sound;
    option.textContent = sound;
    option.selected = sound === setting.sound;
    soundSelect.appendChild(option);
  });
  soundSelect.addEventListener('change', () => {
    updateAlertSettings(alertType, { sound: soundSelect.value });
  });
  
  // شريط تمرير مستوى الصوت
  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = '0';
  volumeSlider.max = '1';
  volumeSlider.step = '0.1';
  volumeSlider.value = setting.volume.toString();
  volumeSlider.addEventListener('change', () => {
    updateAlertSettings(alertType, { volume: parseFloat(volumeSlider.value) });
  });
  
  // إضافة العناصر إلى الحاوية
  container.appendChild(title);
  container.appendChild(enableToggle);
  container.appendChild(soundSelect);
  container.appendChild(volumeSlider);
  
  // إضافة الحاوية إلى الصفحة
  document.getElementById('alert-settings-container').appendChild(container);
}
```

## 3. تحسين لوحة التحكم وسجل الوصول

### نقطة النهاية الجديدة: `/api/admin/access-logs`

```typescript
// مثال على استخدام نقطة النهاية للحصول على سجلات الوصول
import axios from 'axios';

// دالة للحصول على سجلات الوصول مع خيارات تصفية
async function getAccessLogs(options: {
  limit?: number,
  offset?: number,
  user_id?: number,
  location?: string,
  success?: boolean,
  start_date?: string,
  end_date?: string
}) {
  try {
    const response = await axios.get('/api/admin/access-logs', { params: options });
    return response.data;
  } catch (error) {
    console.error('Error getting access logs:', error);
    throw error;
  }
}

// دالة للحصول على إحصائيات الوصول
async function getAccessStatistics(options: {
  start_date?: string,
  end_date?: string,
  location?: string
}) {
  try {
    const response = await axios.get('/api/admin/access-statistics', { params: options });
    return response.data;
  } catch (error) {
    console.error('Error getting access statistics:', error);
    throw error;
  }
}

// مثال على استخدام الدوال في لوحة التحكم
async function initializeDashboard() {
  // الحصول على سجلات الوصول الأخيرة
  const logs = await getAccessLogs({
    limit: 10,
    offset: 0
  });
  
  // عرض السجلات في جدول
  displayAccessLogs(logs);
  
  // الحصول على إحصائيات الوصول
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const statistics = await getAccessStatistics({
    start_date: lastWeek,
    end_date: today
  });
  
  // عرض الإحصائيات في لوحة التحكم
  displayStatistics(statistics);
}

// دالة لعرض سجلات الوصول في جدول
function displayAccessLogs(logs) {
  const tableBody = document.getElementById('access-logs-table-body');
  tableBody.innerHTML = '';
  
  logs.forEach(log => {
    const row = document.createElement('tr');
    
    // إنشاء خلايا الجدول
    const timeCell = document.createElement('td');
    timeCell.textContent = new Date(log.access_time).toLocaleString();
    
    const userCell = document.createElement('td');
    userCell.textContent = log.user ? log.user.name : 'غير معروف';
    
    const locationCell = document.createElement('td');
    locationCell.textContent = log.location || 'غير محدد';
    
    const successCell = document.createElement('td');
    successCell.textContent = log.success ? 'نجاح' : 'فشل';
    successCell.className = log.success ? 'success' : 'failure';
    
    const confidenceCell = document.createElement('td');
    confidenceCell.textContent = `${(log.confidence * 100).toFixed(1)}%`;
    
    // إضافة الخلايا إلى الصف
    row.appendChild(timeCell);
    row.appendChild(userCell);
    row.appendChild(locationCell);
    row.appendChild(successCell);
    row.appendChild(confidenceCell);
    
    // إضافة الصف إلى الجدول
    tableBody.appendChild(row);
  });
}

// دالة لعرض الإحصائيات في لوحة التحكم
function displayStatistics(statistics) {
  // عرض الإحصائيات الأساسية
  document.getElementById('total-attempts').textContent = statistics.total_attempts;
  document.getElementById('successful-attempts').textContent = statistics.successful_attempts;
  document.getElementById('failed-attempts').textContent = statistics.failed_attempts;
  document.getElementById('success-rate').textContent = `${statistics.success_rate.toFixed(1)}%`;
  document.getElementById('unique-users').textContent = statistics.unique_users;
  
  // عرض الإحصائيات حسب الساعة (باستخدام مكتبة رسوم بيانية مثل Chart.js)
  const hourlyData = Object.entries(statistics.by_hour).map(([hour, count]) => ({
    hour: parseInt(hour),
    count: count
  })).sort((a, b) => a.hour - b.hour);
  
  // إنشاء مخطط بياني للإحصائيات حسب الساعة
  createHourlyChart(hourlyData);
  
  // عرض الإحصائيات حسب الموقع
  const locationData = Object.entries(statistics.by_location).map(([location, count]) => ({
    location,
    count
  })).sort((a, b) => b.count - a.count);
  
  // إنشاء مخطط بياني للإحصائيات حسب الموقع
  createLocationChart(locationData);
}

// دالة لإنشاء مخطط بياني للإحصائيات حسب الساعة
function createHourlyChart(data) {
  // هذا مثال باستخدام Chart.js
  const ctx = document.getElementById('hourly-chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(item => `${item.hour}:00`),
      datasets: [{
        label: 'عدد محاولات الوصول',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// دالة لإنشاء مخطط بياني للإحصائيات حسب الموقع
function createLocationChart(data) {
  // هذا مثال باستخدام Chart.js
  const ctx = document.getElementById('location-chart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(item => item.location),
      datasets: [{
        label: 'عدد محاولات الوصول',
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    }
  });
}
```

## 4. تكامل مكون التقاط الوجه مع الميزات الجديدة

```tsx
// مثال على تحديث مكون FaceCapture.tsx للعمل مع الميزات الجديدة
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { triggerAlert, ALERT_TYPES } from '../services/alertService';

interface FaceCaptureProps {
  onFaceDetected?: (faceData: any) => void;
  onMultipleFacesDetected?: (facesData: any[]) => void;
  location?: string;
  mode?: 'register' | 'verify' | 'multi-verify';
  maxFaces?: number;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onFaceDetected,
  onMultipleFacesDetected,
  location = 'main_entrance',
  mode = 'verify',
  maxFaces = 5
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<any[]>([]);
  
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
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      return null;
    }
    
    // ضبط أبعاد الكانفاس لتتطابق مع الفيديو
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
          setError('فشل في التقاط الصورة');
          resolve(null);
        }
      }, 'image/jpeg', 0.95);
    });
  };
  
  // التحقق من الوجوه في الصورة
  const verifyFaces = async () => {
    try {
      const imageBlob = await captureImage();
      
      if (!imageBlob) {
        return;
      }
      
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('location', location);
      
      let response;
      
      if (mode === 'multi-verify') {
        // استخدام نقطة النهاية للتعرف على وجوه متعددة
        response = await axios.post('/api/access/verify-multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // معالجة النتائج
        if (response.data.success) {
          setDetectedFaces(response.data.results);
          
          // إذا تم اكتشاف وجوه متعددة، تشغيل إنذار
          if (response.data.total_faces > 1) {
            triggerAlert(ALERT_TYPES.MULTIPLE_FACES, null, location, {
              total_faces: response.data.total_faces,
              recognized_faces: response.data.recognized_faces
            });
          }
          
          // معالجة كل وجه على حدة
          response.data.results.forEach(result => {
            if (result.success) {
              // تشغيل إنذار النجاح
              triggerAlert(
                result.user.user_type === 'vip' ? ALERT_TYPES.VIP_DETECTED : ALERT_TYPES.ACCESS_GRANTED,
                result.user.id,
                location
              );
            } else {
              // تشغيل إنذار الفشل
              triggerAlert(
                result.confidence > 0.4 ? ALERT_TYPES.LOW_CONFIDENCE : ALERT_TYPES.ACCESS_DENIED,
                null,
                location,
                { confidence: result.confidence }
              );
            }
          });
          
          // استدعاء الدالة المخصصة للتعامل مع الوجوه المتعددة
          if (onMultipleFacesDetected) {
            onMultipleFacesDetected(response.data.results);
          }
        }
      } else {
        // استخدام نقطة النهاية للتعرف على وجه واحد
        response = await axios.post('/api/access/verify', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // معالجة النتيجة
        if (response.data.success) {
          setDetectedFaces([response.data]);
          
          // تشغيل الإنذار المناسب
          if (response.data.user) {
            triggerAlert(
              response.data.user.user_type === 'vip' ? ALERT_TYPES.VIP_DETECTED : ALERT_TYPES.ACCESS_GRANTED,
              response.data.user.id,
              location
            );
          } else {
            triggerAlert(
              response.data.confidence > 0.4 ? ALERT_TYPES.LOW_CONFIDENCE : ALERT_TYPES.ACCESS_DENIED,
              null,
              location,
              { confidence: response.data.confidence }
            );
          }
          
          // استدعاء الدالة المخصصة للتعامل مع الوجه
          if (onFaceDetected) {
            onFaceDetected(response.data);
          }
        }
      }
    } catch (err) {
      console.error('Error verifying faces:', err);
      setError('حدث خطأ أثناء التحقق من الوجوه');
      
      // تشغيل إنذار خطأ النظام
      triggerAlert(ALERT_TYPES.SYSTEM_ERROR, null, location, {
        error: err.message
      });
    }
  };
  
  // التحقق التلقائي كل ثانيتين
  useEffect(() => {
    let interval;
    
    if (isCapturing) {
      interval = setInterval(() => {
        verifyFaces();
      }, 2000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isCapturing, location, mode]);
  
  return (
    <div className="face-capture-container">
      <video
        ref={videoRef}
        className="face-capture-video"
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="detected-faces">
        {detectedFaces.map((face, index) => (
          <div key={index} className={`face-result ${face.success ? 'success' : 'failure'}`}>
            {face.success ? (
              <div>
                <h3>{face.user.name}</h3>
                <p>الثقة: {(face.confidence * 100).toFixed(1)}%</p>
                {face.user.room_number && (
                  <p>الغرفة: {face.user.room_number}</p>
                )}
              </div>
            ) : (
              <div>
                <h3>غير معروف</h3>
                <p>الثقة: {(face.confidence * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button
        className="capture-button"
        onClick={verifyFaces}
        disabled={!isCapturing}
      >
        التقاط وتحقق
      </button>
    </div>
  );
};

export default FaceCapture;
```

## 5. تكامل مكون تسجيل الوجه مع الميزات الجديدة

```tsx
// مثال على تحديث مكون FaceRegistrationContainer.tsx للعمل مع الميزات الجديدة
import React, { useState } from 'react';
import axios from 'axios';
import FaceCapture from './FaceCapture';
import { triggerAlert, ALERT_TYPES } from '../services/alertService';

interface FaceRegistrationContainerProps {
  onRegistrationComplete?: (userData: any) => void;
  location?: string;
}

const FaceRegistrationContainer: React.FC<FaceRegistrationContainerProps> = ({
  onRegistrationComplete,
  location = 'registration_desk'
}) => {
  const [step, setStep] = useState<'info' | 'capture' | 'confirm' | 'complete'>('info');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    user_type: 'guest',
    room_number: '',
    check_in_date: '',
    check_out_date: ''
  });
  const [faceData, setFaceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // التعامل مع تغيير بيانات المستخدم
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // التعامل مع اكتشاف الوجه
  const handleFaceDetected = (data: any) => {
    setFaceData(data);
    
    // الانتقال إلى خطوة التأكيد إذا تم اكتشاف وجه
    if (data && data.encoding) {
      setStep('confirm');
    }
  };
  
  // إرسال بيانات التسجيل
  const handleSubmit = async () => {
    if (!faceData || !faceData.encoding) {
      setError('لم يتم التقاط صورة الوجه بشكل صحيح');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // إنشاء كائن FormData
      const formData = new FormData();
      
      // إضافة بيانات المستخدم
      Object.entries(userData).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      // إضافة بيانات الوجه
      formData.append('face_descriptor', JSON.stringify(faceData.encoding));
      formData.append('location', location);
      
      // إرسال البيانات
      const response = await axios.post('/api/users/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // تشغيل إنذار النجاح
        triggerAlert(ALERT_TYPES.ACCESS_GRANTED, response.data.user.id, location, {
          action: 'registration'
        });
        
        // الانتقال إلى خطوة الاكتمال
        setStep('complete');
        
        // استدعاء الدالة المخصصة للتعامل مع اكتمال التسجيل
        if (onRegistrationComplete) {
          onRegistrationComplete(response.data.user);
        }
      } else {
        setError(response.data.message || 'حدث خطأ أثناء التسجيل');
        
        // تشغيل إنذار الخطأ
        triggerAlert(ALERT_TYPES.SYSTEM_ERROR, null, location, {
          error: response.data.message,
          action: 'registration'
        });
      }
    } catch (err) {
      console.error('Error registering user:', err);
      setError('حدث خطأ أثناء التسجيل');
      
      // تشغيل إنذار الخطأ
      triggerAlert(ALERT_TYPES.SYSTEM_ERROR, null, location, {
        error: err.message,
        action: 'registration'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // عرض نموذج إدخال البيانات
  const renderInfoForm = () => (
    <div className="info-form">
      <h2>تسجيل مستخدم جديد</h2>
      <div className="form-group">
        <label htmlFor="name">الاسم</label>
        <input
          type="text"
          id="name"
          name="name"
          value={userData.name}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">البريد الإلكتروني</label>
        <input
          type="email"
          id="email"
          name="email"
          value={userData.email}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="phone">رقم الهاتف</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={userData.phone}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="user_type">نوع المستخدم</label>
        <select
          id="user_type"
          name="user_type"
          value={userData.user_type}
          onChange={handleInputChange}
        >
          <option value="guest">ضيف</option>
          <option value="employee">موظف</option>
          <option value="vip">VIP</option>
        </select>
      </div>
      
      {userData.user_type === 'guest' && (
        <>
          <div className="form-group">
            <label htmlFor="room_number">رقم الغرفة</label>
            <input
              type="text"
              id="room_number"
              name="room_number"
              value={userData.room_number}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="check_in_date">تاريخ الوصول</label>
            <input
              type="date"
              id="check_in_date"
              name="check_in_date"
              value={userData.check_in_date}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="check_out_date">تاريخ المغادرة</label>
            <input
              type="date"
              id="check_out_date"
              name="check_out_date"
              value={userData.check_out_date}
              onChange={handleInputChange}
            />
          </div>
        </>
      )}
      
      <button
        className="next-button"
        onClick={() => setStep('capture')}
        disabled={!userData.name}
      >
        التالي
      </button>
    </div>
  );
  
  // عرض مكون التقاط الوجه
  const renderFaceCapture = () => (
    <div className="face-capture-step">
      <h2>التقاط صورة الوجه</h2>
      <p>يرجى النظر إلى الكاميرا والابتسام</p>
      
      <FaceCapture
        onFaceDetected={handleFaceDetected}
        location={location}
        mode="register"
      />
      
      <button
        className="back-button"
        onClick={() => setStep('info')}
      >
        رجوع
      </button>
    </div>
  );
  
  // عرض خطوة التأكيد
  const renderConfirmation = () => (
    <div className="confirmation-step">
      <h2>تأكيد التسجيل</h2>
      
      <div className="user-summary">
        <h3>بيانات المستخدم</h3>
        <p><strong>الاسم:</strong> {userData.name}</p>
        <p><strong>البريد الإلكتروني:</strong> {userData.email || 'غير محدد'}</p>
        <p><strong>رقم الهاتف:</strong> {userData.phone || 'غير محدد'}</p>
        <p><strong>نوع المستخدم:</strong> {
          userData.user_type === 'guest' ? 'ضيف' :
          userData.user_type === 'employee' ? 'موظف' :
          userData.user_type === 'vip' ? 'VIP' : userData.user_type
        }</p>
        
        {userData.user_type === 'guest' && (
          <>
            <p><strong>رقم الغرفة:</strong> {userData.room_number || 'غير محدد'}</p>
            <p><strong>تاريخ الوصول:</strong> {userData.check_in_date || 'غير محدد'}</p>
            <p><strong>تاريخ المغادرة:</strong> {userData.check_out_date || 'غير محدد'}</p>
          </>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="confirmation-buttons">
        <button
          className="back-button"
          onClick={() => setStep('capture')}
          disabled={isSubmitting}
        >
          التقاط صورة جديدة
        </button>
        
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري التسجيل...' : 'تأكيد التسجيل'}
        </button>
      </div>
    </div>
  );
  
  // عرض خطوة الاكتمال
  const renderComplete = () => (
    <div className="complete-step">
      <h2>تم التسجيل بنجاح</h2>
      <p>تم تسجيل {userData.name} بنجاح في النظام.</p>
      
      <button
        className="new-registration-button"
        onClick={() => {
          setStep('info');
          setUserData({
            name: '',
            email: '',
            phone: '',
            user_type: 'guest',
            room_number: '',
            check_in_date: '',
            check_out_date: ''
          });
          setFaceData(null);
          setError(null);
        }}
      >
        تسجيل مستخدم جديد
      </button>
    </div>
  );
  
  // عرض الخطوة الحالية
  return (
    <div className="face-registration-container">
      {step === 'info' && renderInfoForm()}
      {step === 'capture' && renderFaceCapture()}
      {step === 'confirm' && renderConfirmation()}
      {step === 'complete' && renderComplete()}
    </div>
  );
};

export default FaceRegistrationContainer;
```

## 6. تكامل خدمة الإنذارات الصوتية

```typescript
// src/services/alertService.ts
import axios from 'axios';

// أنواع الإنذارات المتاحة
export const ALERT_TYPES = {
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  VIP_DETECTED: 'vip_detected',
  MULTIPLE_FACES: 'multiple_faces',
  LOW_CONFIDENCE: 'low_confidence',
  SYSTEM_ERROR: 'system_error'
};

// مخزن الأصوات المحملة مسبقاً
const audioCache = new Map<string, HTMLAudioElement>();

// دالة لتشغيل إنذار صوتي
export async function triggerAlert(alertType: string, userId?: number, location?: string, additionalData?: any) {
  try {
    const response = await axios.post('/api/alerts/trigger', {
      alert_type: alertType,
      user_id: userId,
      location: location,
      additional_data: additionalData
    });
    
    if (response.data.success) {
      // تشغيل الصوت في المتصفح
      playAlertSound(response.data.alert_data.sound, response.data.alert_data.volume);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error triggering alert:', error);
    throw error;
  }
}

// دالة لتشغيل صوت في المتصفح
export function playAlertSound(soundFile: string, volume: number = 0.7) {
  // التحقق من وجود الصوت في المخزن
  if (audioCache.has(soundFile)) {
    const audio = audioCache.get(soundFile);
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(err => console.error('Error playing sound:', err));
    return;
  }
  
  // إنشاء عنصر صوت جديد
  const audio = new Audio(`/sounds/${soundFile}`);
  audio.volume = volume;
  
  // تخزين الصوت في المخزن
  audioCache.set(soundFile, audio);
  
  // تشغيل الصوت
  audio.play().catch(err => console.error('Error playing sound:', err));
}

// دالة للحصول على جميع إعدادات الإنذارات
export async function getAllAlertSettings() {
  try {
    const response = await axios.get('/api/alerts/settings');
    return response.data.settings;
  } catch (error) {
    console.error('Error getting alert settings:', error);
    throw error;
  }
}

// دالة لتحديث إعدادات إنذار معين
export async function updateAlertSettings(alertType: string, settings: {
  sound?: string,
  volume?: number,
  enabled?: boolean
}) {
  try {
    const response = await axios.put(`/api/alerts/settings/${alertType}`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating alert settings:', error);
    throw error;
  }
}

// تحميل الأصوات مسبقاً
export function preloadAlertSounds() {
  // قائمة الأصوات الافتراضية
  const defaultSounds = [
    'access_granted.mp3',
    'access_denied.mp3',
    'vip_alert.mp3',
    'multiple_faces.mp3',
    'low_confidence.mp3',
    'system_error.mp3'
  ];
  
  // تحميل الأصوات
  defaultSounds.forEach(sound => {
    const audio = new Audio(`/sounds/${sound}`);
    audio.load();
    audioCache.set(sound, audio);
  });
}

// تحميل الأصوات عند بدء التطبيق
preloadAlertSounds();
```

## 7. تكامل لوحة التحكم مع الميزات الجديدة

```tsx
// مثال على تحديث مكون Dashboard.tsx للعمل مع الميزات الجديدة
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import { getAllAlertSettings, updateAlertSettings } from '../services/alertService';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'settings'>('overview');
  const [statistics, setStatistics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [alertSettings, setAlertSettings] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [location, setLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    loadDashboardData();
  }, [dateRange, location]);
  
  // تحميل بيانات لوحة التحكم
  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // تحميل الإحصائيات
      const statsParams: any = {
        start_date: dateRange.start,
        end_date: dateRange.end
      };
      
      if (location !== 'all') {
        statsParams.location = location;
      }
      
      const statsResponse = await axios.get('/api/admin/access-statistics', {
        params: statsParams
      });
      
      setStatistics(statsResponse.data);
      
      // تحميل سجلات الوصول
      const logsParams: any = {
        limit: 100,
        offset: 0,
        start_date: dateRange.start,
        end_date: dateRange.end
      };
      
      if (location !== 'all') {
        logsParams.location = location;
      }
      
      const logsResponse = await axios.get('/api/admin/access-logs', {
        params: logsParams
      });
      
      setLogs(logsResponse.data.logs);
      
      // تحميل إعدادات الإنذارات
      const settings = await getAllAlertSettings();
      setAlertSettings(settings);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // إنشاء المخططات البيانية
  useEffect(() => {
    if (statistics && !isLoading) {
      createCharts();
    }
  }, [statistics, isLoading, activeTab]);
  
  // إنشاء المخططات البيانية
  const createCharts = () => {
    // مخطط محاولات الوصول
    const attemptsCtx = document.getElementById('attempts-chart') as HTMLCanvasElement;
    if (attemptsCtx) {
      const attemptsChart = new Chart(attemptsCtx, {
        type: 'pie',
        data: {
          labels: ['ناجحة', 'فاشلة'],
          datasets: [{
            data: [statistics.successful_attempts, statistics.failed_attempts],
            backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 99, 132, 0.5)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1
          }]
        }
      });
      
      // تنظيف المخطط عند إزالة المكون
      return () => {
        attemptsChart.destroy();
      };
    }
    
    // مخطط محاولات الوصول حسب الساعة
    const hourlyCtx = document.getElementById('hourly-chart') as HTMLCanvasElement;
    if (hourlyCtx) {
      const hourlyData = Object.entries(statistics.by_hour).map(([hour, count]) => ({
        hour: parseInt(hour),
        count: count as number
      })).sort((a, b) => a.hour - b.hour);
      
      const hourlyChart = new Chart(hourlyCtx, {
        type: 'bar',
        data: {
          labels: hourlyData.map(item => `${item.hour}:00`),
          datasets: [{
            label: 'عدد محاولات الوصول',
            data: hourlyData.map(item => item.count),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // تنظيف المخطط عند إزالة المكون
      return () => {
        hourlyChart.destroy();
      };
    }
    
    // مخطط محاولات الوصول حسب الموقع
    const locationCtx = document.getElementById('location-chart') as HTMLCanvasElement;
    if (locationCtx && statistics.by_location) {
      const locationData = Object.entries(statistics.by_location).map(([location, count]) => ({
        location,
        count: count as number
      })).sort((a, b) => b.count - a.count);
      
      const locationChart = new Chart(locationCtx, {
        type: 'pie',
        data: {
          labels: locationData.map(item => item.location),
          datasets: [{
            label: 'عدد محاولات الوصول',
            data: locationData.map(item => item.count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
          }]
        }
      });
      
      // تنظيف المخطط عند إزالة المكون
      return () => {
        locationChart.destroy();
      };
    }
  };
  
  // تحديث إعدادات الإنذار
  const handleAlertSettingChange = async (alertType: string, setting: string, value: any) => {
    try {
      const settings: any = {};
      settings[setting] = value;
      
      const response = await updateAlertSettings(alertType, settings);
      
      if (response.success) {
        // تحديث الإعدادات المحلية
        setAlertSettings(prev => ({
          ...prev,
          [alertType]: {
            ...prev[alertType],
            [setting]: value
          }
        }));
      }
    } catch (error) {
      console.error('Error updating alert settings:', error);
    }
  };
  
  // عرض علامات التبويب
  const renderTabs = () => (
    <div className="dashboard-tabs">
      <button
        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        نظرة عامة
      </button>
      <button
        className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
        onClick={() => setActiveTab('logs')}
      >
        سجلات الوصول
      </button>
      <button
        className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        الإعدادات
      </button>
    </div>
  );
  
  // عرض نظرة عامة
  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="date-filter">
        <label htmlFor="start-date">من:</label>
        <input
          type="date"
          id="start-date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
        />
        
        <label htmlFor="end-date">إلى:</label>
        <input
          type="date"
          id="end-date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
        />
        
        <label htmlFor="location">الموقع:</label>
        <select
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="all">جميع المواقع</option>
          <option value="main_entrance">المدخل الرئيسي</option>
          <option value="restaurant">المطعم</option>
          <option value="gym">صالة الألعاب الرياضية</option>
          <option value="pool">حمام السباحة</option>
          <option value="conference_room">قاعة المؤتمرات</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="loading">جاري تحميل البيانات...</div>
      ) : statistics ? (
        <div className="statistics-container">
          <div className="statistics-cards">
            <div className="stat-card">
              <h3>إجمالي محاولات الوصول</h3>
              <p className="stat-value">{statistics.total_attempts}</p>
            </div>
            
            <div className="stat-card success">
              <h3>محاولات ناجحة</h3>
              <p className="stat-value">{statistics.successful_attempts}</p>
              <p className="stat-percentage">{statistics.success_rate.toFixed(1)}%</p>
            </div>
            
            <div className="stat-card failure">
              <h3>محاولات فاشلة</h3>
              <p className="stat-value">{statistics.failed_attempts}</p>
              <p className="stat-percentage">{(100 - statistics.success_rate).toFixed(1)}%</p>
            </div>
            
            <div className="stat-card">
              <h3>مستخدمين فريدين</h3>
              <p className="stat-value">{statistics.unique_users}</p>
            </div>
          </div>
          
          <div className="charts-container">
            <div className="chart-wrapper">
              <h3>محاولات الوصول</h3>
              <canvas id="attempts-chart"></canvas>
            </div>
            
            <div className="chart-wrapper">
              <h3>محاولات الوصول حسب الساعة</h3>
              <canvas id="hourly-chart"></canvas>
            </div>
            
            {location === 'all' && (
              <div className="chart-wrapper">
                <h3>محاولات الوصول حسب الموقع</h3>
                <canvas id="location-chart"></canvas>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-data">لا توجد بيانات متاحة</div>
      )}
    </div>
  );
  
  // عرض سجلات الوصول
  const renderLogs = () => (
    <div className="access-logs">
      <div className="date-filter">
        <label htmlFor="logs-start-date">من:</label>
        <input
          type="date"
          id="logs-start-date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
        />
        
        <label htmlFor="logs-end-date">إلى:</label>
        <input
          type="date"
          id="logs-end-date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
        />
        
        <label htmlFor="logs-location">الموقع:</label>
        <select
          id="logs-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="all">جميع المواقع</option>
          <option value="main_entrance">المدخل الرئيسي</option>
          <option value="restaurant">المطعم</option>
          <option value="gym">صالة الألعاب الرياضية</option>
          <option value="pool">حمام السباحة</option>
          <option value="conference_room">قاعة المؤتمرات</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="loading">جاري تحميل البيانات...</div>
      ) : logs.length > 0 ? (
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>الوقت</th>
                <th>المستخدم</th>
                <th>الموقع</th>
                <th>النتيجة</th>
                <th>الثقة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className={log.success ? 'success-row' : 'failure-row'}>
                  <td>{new Date(log.access_time).toLocaleString()}</td>
                  <td>{log.user ? log.user.name : 'غير معروف'}</td>
                  <td>{log.location || 'غير محدد'}</td>
                  <td className={log.success ? 'success' : 'failure'}>
                    {log.success ? 'نجاح' : 'فشل'}
                  </td>
                  <td>{(log.confidence * 100).toFixed(1)}%</td>
                  <td>
                    {log.image_path && (
                      <button
                        className="view-image-button"
                        onClick={() => window.open(`/api/admin/access-logs/${log.id}/image`, '_blank')}
                      >
                        عرض الصورة
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">لا توجد سجلات متاحة</div>
      )}
    </div>
  );
  
  // عرض إعدادات الإنذارات
  const renderSettings = () => (
    <div className="alert-settings">
      <h2>إعدادات الإنذارات الصوتية</h2>
      
      {isLoading ? (
        <div className="loading">جاري تحميل البيانات...</div>
      ) : alertSettings ? (
        <div className="settings-container">
          {Object.entries(alertSettings).map(([alertType, setting]) => (
            <div key={alertType} className="alert-setting-card">
              <h3>{setting.description}</h3>
              
              <div className="setting-row">
                <label htmlFor={`${alertType}-enabled`}>تفعيل:</label>
                <input
                  type="checkbox"
                  id={`${alertType}-enabled`}
                  checked={setting.enabled}
                  onChange={(e) => handleAlertSettingChange(alertType, 'enabled', e.target.checked)}
                />
              </div>
              
              <div className="setting-row">
                <label htmlFor={`${alertType}-sound`}>الصوت:</label>
                <select
                  id={`${alertType}-sound`}
                  value={setting.sound}
                  onChange={(e) => handleAlertSettingChange(alertType, 'sound', e.target.value)}
                >
                  <option value="access_granted.mp3">صوت الوصول المسموح</option>
                  <option value="access_denied.mp3">صوت الوصول المرفوض</option>
                  <option value="vip_alert.mp3">صوت تنبيه VIP</option>
                  <option value="multiple_faces.mp3">صوت وجوه متعددة</option>
                  <option value="low_confidence.mp3">صوت ثقة منخفضة</option>
                  <option value="system_error.mp3">صوت خطأ النظام</option>
                </select>
                
                <button
                  className="play-sound-button"
                  onClick={() => {
                    const audio = new Audio(`/sounds/${setting.sound}`);
                    audio.volume = setting.volume;
                    audio.play().catch(err => console.error('Error playing sound:', err));
                  }}
                >
                  تشغيل
                </button>
              </div>
              
              <div className="setting-row">
                <label htmlFor={`${alertType}-volume`}>مستوى الصوت:</label>
                <input
                  type="range"
                  id={`${alertType}-volume`}
                  min="0"
                  max="1"
                  step="0.1"
                  value={setting.volume}
                  onChange={(e) => handleAlertSettingChange(alertType, 'volume', parseFloat(e.target.value))}
                />
                <span>{(setting.volume * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">لا توجد إعدادات متاحة</div>
      )}
    </div>
  );
  
  return (
    <div className="dashboard-container">
      <h1>لوحة التحكم</h1>
      
      {renderTabs()}
      
      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default Dashboard;
```

## 8. ملاحظات هامة للتكامل

1. **تأكد من وجود ملفات الصوت**: يجب وضع ملفات الصوت في مجلد `/public/sounds/` في مشروع React.

2. **تأكد من تثبيت المكتبات اللازمة**:
   ```bash
   npm install chart.js axios
   ```

3. **تأكد من إضافة نقاط النهاية الجديدة في الخلفية**:
   - `/api/access/verify-multiple`
   - `/api/alerts/trigger`
   - `/api/alerts/settings`
   - `/api/admin/access-logs`
   - `/api/admin/access-statistics`

4. **تأكد من تحديث نماذج قاعدة البيانات**:
   - إضافة حقل `additional_data` في نموذج `AccessLog`
   - إضافة نموذج `AlertSettings` لتخزين إعدادات الإنذارات

5. **تأكد من تحديث ملفات CSS**:
   - إضافة أنماط للمكونات الجديدة
   - تحسين تجربة المستخدم

## 9. خطوات التكامل

1. قم بإضافة الملفات الجديدة في الخلفية:
   - `app/utils/multi_face_detection.py`
   - `app/utils/alert_service.py`

2. قم بتحديث ملف `app/utils/face_recognition.py` بالكود الجديد.

3. قم بتحديث نقاط النهاية في الخلفية لدعم الميزات الجديدة.

4. قم بإضافة خدمة الإنذارات الصوتية في الواجهة الأمامية.

5. قم بتحديث مكونات الواجهة الأمامية لاستخدام الميزات الجديدة.

6. قم بإضافة ملفات الصوت في مجلد `/public/sounds/`.

7. قم باختبار النظام للتأكد من عمل جميع الميزات بشكل صحيح.

# تحليل الخطأ في مكون FaceRegistrationContainer

## الخطأ المرصود
من خلال لقطة الشاشة، يظهر الخطأ التالي في وحدة التحكم بالمتصفح:

```
خطأ في الوصول إلى الكاميرا: Error: عنصر الفيديو غير جاهز بعد انتظار
waitForVideoRef FaceRegistrationContainer.tsx:95
```

هذا الخطأ يتكرر عدة مرات، ويشير إلى أن دالة `waitForVideoRef` في السطر 95 من ملف `FaceRegistrationContainer.tsx` تفشل في الحصول على مرجع عنصر الفيديو.

## تحليل الكود

### دالة waitForVideoRef

```javascript
// دالة انتظار جاهزية فيديو الريف
const waitForVideoRef = async (): Promise<HTMLVideoElement> => {
  let retries = 10;
  while (retries > 0) {
    if (videoRef.current) return videoRef.current;
    await new Promise(res => setTimeout(res, 100));
    retries--;
  }
  throw new Error('عنصر الفيديو غير جاهز بعد انتظار');
};
```

هذه الدالة تحاول الحصول على مرجع عنصر الفيديو (`videoRef.current`) لمدة تصل إلى 10 محاولات، مع انتظار 100 مللي ثانية بين كل محاولة. إذا لم يتم العثور على المرجع بعد كل المحاولات، يتم إلقاء خطأ.

### استخدام الدالة في startCapture

```javascript
const startCapture = async (simpleSettings = false) => {
  try {
    // ... كود آخر ...
    
    const videoElement = await waitForVideoRef();
    
    // ... كود آخر ...
  } catch (error) {
    handleCameraError(error);
  } finally {
    setIsLoading(false);
  }
};
```

تستدعي دالة `startCapture` دالة `waitForVideoRef` للحصول على مرجع عنصر الفيديو قبل محاولة الوصول إلى الكاميرا.

### عرض عنصر الفيديو في المكون

في الجزء الخاص بعرض المكون، يتم استخدام `videoRef` في مكون `FaceCapture`:

```jsx
{captureMode && !captured && (
  <FaceCapture
    startCapture={() => startCapture(false)}
    videoRef={videoRef}
    faceCanvasRef={faceCanvasRef}
    faceDetected={faceDetected}
    setFaceDetected={setFaceDetected}
    isLoading={isLoading}
    permissionError={permissionError}
    onRetryPermission={() => startCapture(false)}
  />
)}
```

لكن لا نرى تعريف مكون `FaceCapture` في الكود المقدم، لذا لا يمكننا التأكد من كيفية استخدام `videoRef` داخله.

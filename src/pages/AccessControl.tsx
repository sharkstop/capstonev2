import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Logo from '@/components/Logo';
import FaceRecognition from '@/components/FaceRecognition';
import AccessResult from '@/components/AccessResult';
import SecurityAlert from '@/components/SecurityAlert';
import { DoorOpen, ShieldAlert, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// تعريف واجهة الـ Props لمكون FaceRecognition
interface FaceRecognitionProps {
  onSuccess: (userInfo: any, image?: string) => void;
  onFail: (image?: string) => void;
}

const AccessControl = () => {
  const navigate = useNavigate();
  const [accessState, setAccessState] = useState<'initial' | 'scanning' | 'result'>('initial');
  const [accessSuccess, setAccessSuccess] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>('06:55 AM EEST, Wednesday, May 21, 2025');
  const [scanImage, setScanImage] = useState<string | null>(null);

  // تحديث التاريخ والوقت تلقائيًا
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZoneName: 'short',
      };
      const formattedDateTime = now.toLocaleString('en-US', options).replace('GMT', 'EEST');
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleStartScan = () => {
    setAccessState('scanning');
  };

  const handleScanSuccess = (userInfo: any, image?: string) => {
    setUserData(userInfo);
    setAccessSuccess(true);
    setAccessState('result');
    if (image) setScanImage(image);
  };

  const handleScanFail = (image?: string) => {
    setAccessSuccess(false);
    setAccessState('result');
    if (image) setScanImage(image);

    // عرض تنبيه أمني بعد تأخير
    setTimeout(() => {
      setShowSecurityAlert(true);
    }, 1500);
  };

  const handleReset = () => {
    setAccessState('initial');
    setAccessSuccess(false);
    setUserData(null);
    setScanImage(null);
  };

  const handleCloseSecurityAlert = () => {
    setShowSecurityAlert(false);
  };

  const handleViewSecurityDetails = () => {
    setShowSecurityAlert(false);
    navigate('/dashboard/logs');
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="container mx-auto p-4 flex items-center justify-between">
        <Logo className="text-primary" />
        <Button variant="ghost" onClick={handleReturnHome}>
          Return Home
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">نظام التعرف </h1>
          <p className="text-muted-foreground">
            IFDD
          </p>
        </div>

        {/* Back Button (when not on initial state) */}
        {accessState !== 'initial' && (
          <div className="max-w-lg mx-auto w-full mb-4">
            <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Access Control Content */}
        <div className="flex-1 flex items-start justify-center">
          <AnimatePresence mode="wait">
            {accessState === 'initial' && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-3xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-card">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <DoorOpen className="h-10 w-10 text-primary" />
                      </div>

                      <h2 className="text-xl font-medium mb-2">طلب الوصول</h2>
                      <p className="text-muted-foreground mb-6">
                       بدء التعرف باعلي معايير الامان والراحه
                      </p>

                      <Button onClick={handleStartScan} className="w-full">
                        بدء التعرف
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-4">
                        <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
                      </div>

                      <h2 className="text-xl font-medium mb-2">عرض الأمان</h2>
                      <p className="text-muted-foreground mb-6">
                        التنبيهات الامنيه كيف يستجيب النظام لمحاولات الوصول غير المصرح بها
                      </p>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSecurityAlert(true);
                        }}
                        className="w-full"
                      >
                        عرض تنبيه أمني
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-medium mb-2">كيفية العمل</h3>
                  <ol className="space-y-2 text-muted-foreground">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium mr-2">
                        1
                      </span>
                      <span>اضغط على "بدء التعرف" لبدء عملية التعرف على الوجه</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium mr-2">
                        2
                      </span>
                      <span>النظام سيقوم بتصوير وتحليل وجهك</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium mr-2">
                        3
                      </span>
                      <span>في هذه التجربة، النظام سيحدد نجاح أو فشل التسجيل (96% معدل نجاح)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium mr-2">
                        4
                      </span>
                      <span>إذا نجح، الباب يفتح؛ إذا فشل، تنبيه أمني سيتم تفعيله</span>
                    </li>
                  </ol>
                </div>
              </motion.div>
            )}

            {accessState === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-3xl text-center"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">جاري التعرف على الوجه...</h2>
                  <p className="text-muted-foreground mb-6">
                    يرجى الانتظار، النظام يقوم بتحليل وجهك. قد يستغرق الأمر بضع ثوانٍ.
                  </p>
                  <FaceRecognition
                    onSuccess={handleScanSuccess}
                    onFail={handleScanFail}
                  />
                </div>
              </motion.div>
            )}

            {accessState === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-3xl"
              >
                <AccessResult success={accessSuccess} userData={userData} onClose={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Security Alert Modal */}
      <AnimatePresence>
        {showSecurityAlert && (
          <SecurityAlert
            timestamp={new Date(currentDateTime)}
            location="Main Entrance"
            image={scanImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80'}
            onDismiss={handleCloseSecurityAlert}
            onViewDetails={handleViewSecurityDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessControl;
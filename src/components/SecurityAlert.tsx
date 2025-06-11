import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SecurityAlertProps {
  timestamp: Date;
  location: string;
  image?: string;
  onDismiss: () => void;
  onViewDetails: () => void;
}

const SecurityAlert = ({ timestamp, location, image, onDismiss, onViewDetails }: SecurityAlertProps) => {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAlert(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowAlert(false);
    setTimeout(onDismiss, 300);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: showAlert ? 1 : 0, scale: showAlert ? 1 : 0.9 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full mx-4"
      >
        <Card className="border-red-500/50 overflow-hidden">
          <div className="bg-red-500 text-white p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold">تنبيه أمني</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-red-600 rounded-full"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <CardContent className="p-4">
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-2 mt-1">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>

              <div>
                <h4 className="font-medium text-lg">محاولة وصول غير مصرح بها</h4>
                <p className="text-muted-foreground text-sm">
                  {formatTime(timestamp)} في {location}
                </p>
              </div>
            </div>

            {image && (
              <div className="mb-4 relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={image}
                  alt="صورة الكاميرا الأمنية"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <Camera className="h-3 w-3 mr-1" />
                  صورة الكاميرا
                </div>
              </div>
            )}

            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md p-3 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                شخص مجهول حاول الوصول إلى منطقة محظورة. تم إخطار الأفراد الأمنيين.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="default"
                className="w-full bg-red-500 hover:bg-red-600"
                onClick={onViewDetails}
              >
                عرض التفاصيل
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDismiss}
              >
                إخفاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SecurityAlert;
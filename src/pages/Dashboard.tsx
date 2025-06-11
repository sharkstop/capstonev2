import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SecurityAlert from '../components/SecurityAlert'; // تأكدي إن الملف موجود في نفس المجلد
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertTriangle, Clock, MapPin, Search, UserX, RefreshCw, Loader2 } from 'lucide-react';
import { authService } from '@/services/apiService';

interface AccessLog {
  id: number;
  status: string;
  user: string;
  location: string;
  timestamp: string;
  deviceId: string;
  image?: string;
}

interface Alert {
  id: number;
  access_time: string;
  image_path: string;
  location?: string;
}

interface SecurityAlertData {
  id: number;
  timestamp: Date;
  location: string;
  image?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>('06:51 AM EEST, Wednesday, May 21, 2025');
  const [backendUrl, setBackendUrl] = useState('');

  // التحقق من المصادقة وجلب البيانات
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      toast.error('يجب تسجيل الدخول للوصول إلى هذه الصفحة');
      navigate('/login');
      return;
    }

    const url = localStorage.getItem('backendUrl');
    if (!url) {
      toast.error('لم يتم تكوين عنوان الخادم الخلفي. يرجى الانتقال إلى الإعدادات وتكوينه.', {
        action: {
          label: 'الإعدادات',
          onClick: () => navigate('/dashboard/settings'),
        },
      });
      setLoading(false);
      return;
    }

    setBackendUrl(url);
    fetchData();
  }, [navigate]);

  // تحديث التاريخ والوقت
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

  // جلب البيانات (سجل المحاولات + التنبيهات)
  const fetchData = async () => {
    try {
      setLoading(true);

      // جلب سجل المحاولات (Access Logs)
      const logsResponse = await axios.get('http://localhost:8000/api/access/logs');
      setLogs(logsResponse.data);

      // جلب التنبيهات (Alerts)
      const logs = logsResponse.data;
      const alertsData = logs
        .filter((log: any) => log.image_path && log.status === 'Failed')
        .map((log: any) => ({
          id: log.id,
          access_time: log.timestamp,
          image_path: log.image,
          location: log.location,
        }));
      setAlerts(alertsData);

      // إنشاء Security Alerts للمحاولات الفاشلة
      const failedAttempts = logsResponse.data.filter((log: AccessLog) => log.status === 'Failed');
      const newSecurityAlerts = failedAttempts.map((log: AccessLog) => ({
        id: log.id,
        timestamp: new Date(log.timestamp),
        location: log.location,
        image: log.image,
      }));
      setSecurityAlerts(newSecurityAlerts);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setError('فشل في جلب البيانات. حاولي مرة أخرى.');
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  // تحديث البيانات يدويًا
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // حذف تنبيه أمني
  const dismissSecurityAlert = (alertId: number) => {
    setSecurityAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  // جلب رابط الصورة
  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    } else {
      return `${backendUrl}/${imagePath}`;
    }
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex-1 ml-64 p-8">
        {/* عرض التاريخ والوقت */}
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-inner">
          <h4 className="text-xl font-medium text-gray-800 dark:text-gray-200">
            التاريخ والوقت الحالي: {currentDateTime}
          </h4>
        </div>

        {/* عرض التنبيهات الأمنية */}
        {securityAlerts.map((alert) => (
          <SecurityAlert
            key={alert.id}
            timestamp={alert.timestamp}
            location={alert.location}
            image={alert.image}
            onDismiss={() => dismissSecurityAlert(alert.id)}
            onViewDetails={() => console.log('عرض التفاصيل للتنبيه:', alert.id)}
          />
        ))}

        {/* زر التحديث */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">تحديث</span>
          </Button>
        </div>

        {/* Tabs لعرض التنبيهات وسجل المحاولات */}
        <Tabs defaultValue="alerts">
          <TabsList className="mb-6">
            <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
            <TabsTrigger value="logs">سجل المحاولات</TabsTrigger>
          </TabsList>

          {/* تبويب التنبيهات */}
          <TabsContent value="alerts" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  سجل التنبيهات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.map((alert) => (
                      <Card
                        key={alert.id}
                        className="overflow-hidden border-red-100 dark:border-red-900/20"
                      >
                        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                          <img
                            src={getImageUrl(alert.image_path)}
                            alt="Unknown face"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/400x300?text=Image+Not+Found';
                            }}
                          />
                          <div className="absolute top-2 right-2">
                            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              تنبيه
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <UserX className="h-4 w-4 mr-1" />
                              <span>شخص غير معروف</span>
                            </div>
                            <div className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                              #{alert.id}
                            </div>
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatDate(alert.access_time)}</span>
                            </div>

                            {alert.location && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{alert.location}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-4 opacity-50" />
                    <p>لا توجد تنبيهات مسجلة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب سجل المحاولات */}
          <TabsContent value="logs" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">سجل الوصول</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-4 bg-gray-800 rounded-lg shadow-md"
                    >
                      <span className={log.status === 'Success' ? 'text-green-500' : 'text-red-500'}>
                        {log.status === 'Success' ? 'نجاح' : 'فشل'}
                      </span>
                      <span>{log.user}</span>
                      <span>{log.location}</span>
                      <span>{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                      <span>{log.deviceId}</span>
                      {log.image && (
                        <img src={log.image} alt="محاولة التعرف" className="w-12 h-12 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
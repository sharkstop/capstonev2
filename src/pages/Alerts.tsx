
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertTriangle, Clock, MapPin, Search, UserX, RefreshCw, Loader2 } from 'lucide-react';
import { authService, accessService } from '@/services/apiService';

interface Alert {
  id: number;
  access_time: string;
  image_path: string;
  location?: string;
}

const Alerts = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [backendUrl, setBackendUrl] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
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
          onClick: () => navigate('/dashboard/settings')
        }
      });
      setIsLoading(false);
      return;
    }

    setBackendUrl(url);
    loadAlerts();
  }, [navigate]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      
      // Get failed access attempts (alerts)
      const logs = await accessService.getAccessLogs({ success: false });
      
      // Filter logs with image paths
      const alertsData = logs
        .filter((log: any) => log.image_path)
        .map((log: any) => ({
          id: log.id,
          access_time: log.access_time,
          image_path: log.image_path,
          location: log.location
        }));
      
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('فشل جلب التنبيهات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAlerts();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    } else {
      return `${backendUrl}/${imagePath}`;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">التنبيهات</h1>
            
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">تحديث</span>
            </Button>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">كل التنبيهات</TabsTrigger>
              <TabsTrigger value="today">اليوم</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    سجل التنبيهات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : alerts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {alerts.map((alert) => (
                        <Card key={alert.id} className="overflow-hidden border-red-100 dark:border-red-900/20">
                          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                            <img 
                              src={getImageUrl(alert.image_path)} 
                              alt="Unknown face"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Not+Found';
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
            
            <TabsContent value="today" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    تنبيهات اليوم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {alerts
                        .filter(alert => {
                          const today = new Date();
                          const alertDate = new Date(alert.access_time);
                          return alertDate.toDateString() === today.toDateString();
                        })
                        .map((alert) => (
                          <Card key={alert.id} className="overflow-hidden border-red-100 dark:border-red-900/20">
                            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                              <img 
                                src={getImageUrl(alert.image_path)} 
                                alt="Unknown face"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Not+Found';
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
                        ))
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Alerts;


import React, { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MoonStar, Sun, Server, Trash, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const Settings = () => {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [backendUrl, setBackendUrl] = useState<string>(localStorage.getItem('backendUrl') || '');
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'unchecked' | 'online' | 'offline'>('unchecked');
  const [apiVersion, setApiVersion] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('faceApiKey') || '');

  // Load settings on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('backendUrl');
    if (savedUrl) {
      setBackendUrl(savedUrl);
      testBackendConnection(savedUrl);
    }
  }, []);

  // Save backend URL to local storage
  const saveBackendUrl = () => {
    if (!backendUrl) {
      toast.error('الرجاء إدخال عنوان الخادم');
      return;
    }
    
    localStorage.setItem('backendUrl', backendUrl);
    toast.success('تم حفظ عنوان الخادم بنجاح');
    testBackendConnection(backendUrl);
  };

  // Save API Key to local storage
  const saveApiKey = () => {
    localStorage.setItem('faceApiKey', apiKey);
    toast.success('تم حفظ مفتاح API بنجاح');
    setShowApiKey(false);
  };

  // Clear API Key
  const clearApiKey = () => {
    localStorage.removeItem('faceApiKey');
    setApiKey('');
    toast.success('تم مسح مفتاح API بنجاح');
  };

  // Test backend connection
  const testBackendConnection = async (url: string = backendUrl) => {
    if (!url) {
      toast.error('الرجاء إدخال عنوان الخادم');
      return;
    }
    
    try {
      setIsChecking(true);
      setHealthStatus('unchecked');
      setApiVersion(null);
      
      // Test the health check endpoint
      const response = await fetch(`${url}/health`);
      
      if (response.ok) {
        const data = await response.json();
        setHealthStatus('online');
        setApiVersion(data.version || 'Unknown');
        toast.success('تم الاتصال بالخادم بنجاح');
      } else {
        setHealthStatus('offline');
        toast.error('فشل الاتصال بالخادم');
      }
    } catch (error) {
      console.error('Error testing backend connection:', error);
      setHealthStatus('offline');
      toast.error('فشل الاتصال بالخادم، تأكد من العنوان وأن الخادم يعمل');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">{t('nav.settings')}</h1>
          
          <div className="grid gap-8 max-w-3xl">
            {/* Language Settings */}
            <Card>
              <CardHeader>
                <CardTitle>اللغة</CardTitle>
                <CardDescription>تغيير لغة التطبيق</CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSwitcher />
              </CardContent>
            </Card>
            
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>المظهر</CardTitle>
                <CardDescription>تغيير مظهر التطبيق</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Sun className="h-5 w-5 text-orange-500" />
                  <Switch 
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                  <MoonStar className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            {/* Backend API Settings */}
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الخادم الخلفي</CardTitle>
                <CardDescription>إعدادات الاتصال بالخادم الخلفي (Python FastAPI)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="backend-url">عنوان الخادم</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="backend-url" 
                        placeholder="http://localhost:8000" 
                        value={backendUrl}
                        onChange={(e) => setBackendUrl(e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      أدخل عنوان الخادم الخلفي الذي يستضيف واجهة برمجة التطبيقات FastAPI
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={saveBackendUrl}>
                      حفظ
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => testBackendConnection()}
                      disabled={isChecking}
                    >
                      <Server className="mr-2 h-4 w-4" />
                      {isChecking ? 'جاري الفحص...' : 'اختبار الاتصال'}
                    </Button>
                  </div>
                  
                  {/* Health Status Indicator */}
                  {healthStatus !== 'unchecked' && (
                    <div className={`mt-2 p-2 rounded ${
                      healthStatus === 'online' 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                      <p className="text-sm">
                        حالة الخادم: {healthStatus === 'online' ? 'متصل' : 'غير متصل'}
                        {apiVersion && healthStatus === 'online' && ` (الإصدار: ${apiVersion})`}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* API Key Settings */}
            <Card>
              <CardHeader>
                <CardTitle>مفتاح API</CardTitle>
                <CardDescription>إعداد مفتاح API للوصول إلى واجهة برمجة التطبيقات المؤمنة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">مفتاح API</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="api-key" 
                        type={showApiKey ? "text" : "password"} 
                        placeholder="أدخل مفتاح API" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      مفتاح API مطلوب للوصول إلى بعض الوظائف المؤمنة
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={saveApiKey}>
                      حفظ المفتاح
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={clearApiKey}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      مسح المفتاح
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

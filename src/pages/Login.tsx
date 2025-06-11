
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Lock, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import FaceRegistration from '@/components/FaceRegistration';
import { authService } from '@/services/apiService';

type LoginTab = 'credentials' | 'face';

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LoginTab>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConfigured, setIsBackendConfigured] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }

    // Check if backend URL is configured
    const backendUrl = localStorage.getItem('backendUrl');
    setIsBackendConfigured(!!backendUrl);
    
    if (!backendUrl) {
      toast.warning('لم يتم تكوين عنوان الخادم الخلفي. يرجى الانتقال إلى الإعدادات وتكوينه.', {
        action: {
          label: 'الإعدادات',
          onClick: () => navigate('/dashboard/settings')
        }
      });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await authService.loginWithCredentials(email, password);
      
      if (result && result.access_token) {
        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/dashboard');
      }
    } catch (error) {
      // Error is handled in the authService
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceLogin = async (imageSrc: string, faceDescriptor: Float32Array) => {
    setIsLoading(true);
    
    try {
      // Convert data URL to Blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      // Use face login API
      const result = await authService.loginWithFace(blob);
      
      if (result && result.access_token) {
        toast.success(`مرحبا ${result.name || ''}! تم تسجيل الدخول بنجاح`);
        navigate('/dashboard');
      }
    } catch (error) {
      // Error is handled in the authService
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToRegister = () => {
    navigate('/register');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="container mx-auto p-4 flex items-center justify-between">
        <Logo className="text-primary" />
        
        <Button 
          variant="ghost" 
          onClick={handleGoToHome}
        >
          العودة للرئيسية
        </Button>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 container mx-auto p-8 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle>تسجيل دخول الموظفين</CardTitle>
              <CardDescription>
                قم بتسجيل الدخول للوصول إلى لوحة التحكم
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LoginTab)}>
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="credentials">
                    <Lock className="h-4 w-4 mr-2" />
                    كلمة المرور
                  </TabsTrigger>
                  <TabsTrigger 
                    value="face" 
                    disabled={!isBackendConfigured}
                    title={!isBackendConfigured ? "يجب تكوين عنوان الخادم الخلفي أولاً" : undefined}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    الوجه
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="credentials">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="أدخل البريد الإلكتروني"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0"
                          onClick={() => toast.info('يرجى التواصل مع المسؤول لإعادة تعيين كلمة المرور')}
                        >
                          نسيت كلمة المرور؟
                        </Button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="أدخل كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !isBackendConfigured}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          جاري تسجيل الدخول...
                        </>
                      ) : (
                        'تسجيل الدخول'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="face">
                  {isBackendConfigured ? (
                    isLoading ? (
                      <div className="py-8 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p>جاري معالجة تسجيل الدخول...</p>
                      </div>
                    ) : (
                      <FaceRegistration onComplete={handleFaceLogin} location="login" />
                    )
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>يجب تكوين عنوان الخادم الخلفي أولاً</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate('/dashboard/settings')}
                      >
                        الذهاب إلى الإعدادات
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter>
              <div className="w-full text-center text-muted-foreground text-sm">
                <p>
                  ليس لديك حساب؟{' '}
                  <Button 
                    variant="link" 
                    className="px-1 h-auto"
                    onClick={handleGoToRegister}
                  >
                    تسجيل جديد
                  </Button>
                </p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

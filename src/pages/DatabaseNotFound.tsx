
import React from 'react';
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Database } from 'lucide-react';

const DatabaseNotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "Database page not available: User attempted to access database route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="container mx-auto p-4">
        <Logo className="text-primary" />
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="text-[150px] font-bold text-primary/10 leading-none">DB</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">قاعدة البيانات غير متوفرة</h1>
              <p className="text-muted-foreground mb-8 max-w-md text-right">
                صفحة قاعدة البيانات التي تحاول الوصول إليها غير متوفرة حاليًا. سيتم تنفيذ هذه الميزة قريبًا.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/dashboard')} variant="outline">
                  العودة إلى لوحة التحكم
                </Button>
                <Button onClick={() => navigate('/dashboard/logs')}>
                  <Database className="h-4 w-4 ml-2" />
                  عرض سجلات الوصول
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseNotFound;

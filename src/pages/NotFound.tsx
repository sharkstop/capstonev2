
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { useLanguage } from '@/contexts/LanguageContext';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
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
          <div className="text-[150px] font-bold text-primary/10 leading-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">{t('notFound.title')}</h1>
              <p className="text-muted-foreground mb-8 max-w-md">
                {t('notFound.message')}
              </p>
              <Button onClick={() => navigate('/')}>
                {t('notFound.button')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

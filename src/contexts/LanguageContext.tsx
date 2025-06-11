
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    // Common
    'app.name': 'نظام IFDD',
    'app.tagline': 'نظام التعرف على الوجه',
    'app.loading': 'جاري التحميل...',
    'app.error': 'حدث خطأ',
    'app.save': 'حفظ',
    'app.cancel': 'إلغاء',
    'app.confirm': 'تأكيد',
    'app.back': 'رجوع',
    'app.next': 'التالي',
    'app.submit': 'إرسال',
    'app.success': 'تم بنجاح',
    
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.users': 'المستخدمين',
    'nav.register': 'تسجيل',
    'nav.access': 'التحكم بالوصول',
    'nav.logs': 'سجلات الوصول',
    'nav.database': 'قاعدة البيانات',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    
    // Settings
    'settings.language': 'اللغة',
    'settings.language.arabic': 'العربية',
    'settings.language.english': 'الإنجليزية',
    'settings.theme': 'السمة',
    'settings.theme.light': 'فاتح',
    'settings.theme.dark': 'داكن',
    'settings.theme.system': 'النظام',
    
    // Not Found
    'notFound.title': 'الصفحة غير موجودة',
    'notFound.message': 'عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو لم تعد موجودة.',
    'notFound.button': 'العودة إلى الصفحة الرئيسية',
    
    // Database Not Found
    'databaseNotFound.title': 'قاعدة البيانات غير متوفرة',
    'databaseNotFound.message': 'عذراً، قاعدة البيانات غير متوفرة حالياً. يرجى المحاولة لاحقاً أو الاتصال بالدعم الفني.',
    'databaseNotFound.action': 'إعادة المحاولة',
  },
  en: {
    // Common
    'app.name': 'IFDD System',
    'app.tagline': 'Facial Recognition System',
    'app.loading': 'Loading...',
    'app.error': 'An error occurred',
    'app.save': 'Save',
    'app.cancel': 'Cancel',
    'app.confirm': 'Confirm',
    'app.back': 'Back',
    'app.next': 'Next',
    'app.submit': 'Submit',
    'app.success': 'Success',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.users': 'All Users',
    'nav.register': 'Registration',
    'nav.access': 'Access Control',
    'nav.logs': 'Access Logs',
    'nav.database': 'Database',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Settings
    'settings.language': 'Language',
    'settings.language.arabic': 'Arabic',
    'settings.language.english': 'English',
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.system': 'System',
    
    // Not Found
    'notFound.title': 'Page Not Found',
    'notFound.message': 'Sorry, we couldn\'t find the page you\'re looking for. It might have been moved or no longer exists.',
    'notFound.button': 'Return to Home',
    
    // Database Not Found
    'databaseNotFound.title': 'Database Not Available',
    'databaseNotFound.message': 'Sorry, the database is currently unavailable. Please try again later or contact support.',
    'databaseNotFound.action': 'Try Again',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get saved language from localStorage or default to Arabic
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'ar';
  });

  useEffect(() => {
    // Update document direction based on language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Save to localStorage
    localStorage.setItem('language', language);
  }, [language]);
  
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };
  
  const value = {
    language,
    setLanguage,
    t
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

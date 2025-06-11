
import React from 'react';
import { Globe } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">{t('settings.language')}</h3>
      </div>
      
      <RadioGroup 
        value={language} 
        onValueChange={(value) => setLanguage(value as 'ar' | 'en')}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <RadioGroupItem value="ar" id="arabic" />
          <Label htmlFor="arabic" className="cursor-pointer">
            {t('settings.language.arabic')}
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <RadioGroupItem value="en" id="english" />
          <Label htmlFor="english" className="cursor-pointer">
            {t('settings.language.english')}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default LanguageSwitcher;

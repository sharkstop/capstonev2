
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CommonFieldsProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CommonFields: React.FC<CommonFieldsProps> = ({ formData, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">الاسم الكامل</Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="أدخل الاسم الكامل"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="أدخل البريد الإلكتروني"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="أدخل رقم الهاتف"
          />
        </div>
      </div>
    </div>
  );
};

export default CommonFields;

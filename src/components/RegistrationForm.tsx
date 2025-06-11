
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import FormHeader from './registration/form/FormHeader';
import CommonFields from './registration/form/CommonFields';
import GuestFields from './registration/form/GuestFields';
import EmployeeFields from './registration/form/EmployeeFields';
import SubmitButton from './registration/form/SubmitButton';

interface RegistrationFormProps {
  userType: 'guest' | 'employee';
  faceImage: string;
  onComplete: (userData: any) => void;
}

const RegistrationForm = ({ userType, faceImage, onComplete }: RegistrationFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roomNumber: '',
    bookingId: '',
    department: '',
    employeeId: '',
    position: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let isValid = true;
    let errorMessage = '';
    
    if (!formData.fullName) {
      isValid = false;
      errorMessage = 'يرجى إدخال الاسم الكامل';
    } else if (!formData.email) {
      isValid = false;
      errorMessage = 'يرجى إدخال البريد الإلكتروني';
    }
    
    if (userType === 'guest') {
      if (!formData.roomNumber) {
        isValid = false;
        errorMessage = 'يرجى إدخال رقم الغرفة';
      } else if (!formData.bookingId) {
        isValid = false;
        errorMessage = 'يرجى إدخال رقم الحجز';
      }
    } else { // employee
      if (!formData.employeeId) {
        isValid = false;
        errorMessage = 'يرجى إدخال رقم الموظف';
      } else if (!formData.department) {
        isValid = false;
        errorMessage = 'يرجى اختيار القسم';
      } else if (!formData.position) {
        isValid = false;
        errorMessage = 'يرجى إدخال المنصب';
      }
    }
    
    if (!isValid) {
      toast.error(errorMessage);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const userData = {
        name: formData.fullName,
        userType,
        email: formData.email,
        phone: formData.phone,
        roomNumber: formData.roomNumber,
        bookingId: formData.bookingId,
        department: formData.department,
        employeeId: formData.employeeId,
        position: formData.position,
        registeredAt: new Date().toISOString(),
      };
      
      onComplete(userData);
    } catch (error) {
      console.error("خطأ في معالجة النموذج:", error);
      toast.error("حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-xl mx-auto"
    >
      <Card className="glass-card">
        <CardContent className="p-6">
          <FormHeader userType={userType} />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <CommonFields formData={formData} handleChange={handleChange} />
            
            {userType === 'guest' && (
              <GuestFields formData={formData} handleChange={handleChange} />
            )}
            
            {userType === 'employee' && (
              <EmployeeFields 
                formData={formData} 
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}
              />
            )}
            
            <SubmitButton isSubmitting={isSubmitting} />
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RegistrationForm;

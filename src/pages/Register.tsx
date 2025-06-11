import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UserTypeSelector from '@/components/UserTypeSelector';
import FaceRegistration from '@/components/FaceRegistration';
import RegistrationForm from '@/components/RegistrationForm';
import { toast } from 'sonner';
import RegistrationHeader from '@/components/registration/RegistrationHeader';
import RegistrationSteps from '@/components/registration/RegistrationSteps';
import RegistrationTitle from '@/components/registration/RegistrationTitle';
import RegistrationNavigation from '@/components/registration/RegistrationNavigation';
import RegistrationSuccess from '@/components/registration/RegistrationSuccess';
import { databaseService } from '@/services/databaseService';

type RegistrationStep = 'user-type' | 'face-capture' | 'form' | 'success';

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('user-type');
  const [userType, setUserType] = useState<'guest' | 'employee' | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [userData, setUserData] = useState<any | null>(null);

  const handleUserTypeSelection = (type: 'guest' | 'employee') => {
    setUserType(type);
    setCurrentStep('face-capture');
  };

  const handleFaceCapture = (imageSrc: string, descriptor: Float32Array) => {
    setFaceImage(imageSrc);
    setFaceDescriptor(descriptor);
    setCurrentStep('form');
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (faceDescriptor) {
        const userId = await databaseService.registerUser(data, faceDescriptor);
        setUserData({ ...data, id: userId });
        toast.success("تم التسجيل بنجاح!", {
          description: "تم تسجيل بيانات وجهك بشكل آمن.",
        });
        setCurrentStep('success');
      } else {
        toast.error("لم يتم العثور على بيانات الوجه. يرجى المحاولة مرة أخرى.");
        setCurrentStep('face-capture');
      }
    } catch (err) {
      console.error("خطأ في تسجيل المستخدم:", err);
      toast.error("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleGoBack = () => {
    if (currentStep === 'face-capture') {
      setCurrentStep('user-type');
    } else if (currentStep === 'form') {
      setCurrentStep('face-capture');
    } else if (currentStep === 'success') {
      setCurrentStep('user-type');
      setUserType(null);
      setFaceImage(null);
      setFaceDescriptor(null);
      setUserData(null);
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <RegistrationHeader />
      
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        <div className="max-w-3xl mx-auto w-full mb-8">
          <div className="flex items-center justify-between">
            <RegistrationNavigation 
              currentStep={currentStep} 
              handleGoBack={handleGoBack} 
            />
            
            <RegistrationSteps currentStep={currentStep} />
          </div>
        </div>
        
        <RegistrationTitle currentStep={currentStep} />
        
        <div className="flex-1 flex items-start justify-center">
          <AnimatePresence mode="wait">
            {currentStep === 'user-type' && (
              <motion.div
                key="user-type"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <UserTypeSelector onSelect={handleUserTypeSelection} />
              </motion.div>
            )}
            
            {currentStep === 'face-capture' && (
              <motion.div
                key="face-capture"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <FaceRegistration onComplete={handleFaceCapture} />
              </motion.div>
            )}
            
            {currentStep === 'form' && userType && faceImage && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <RegistrationForm 
                  userType={userType} 
                  faceImage={faceImage} 
                  onComplete={handleFormSubmit} 
                />
              </motion.div>
            )}
            
            {currentStep === 'success' && (
              <RegistrationSuccess 
                userType={userType} 
                handleReturnHome={handleReturnHome} 
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Register;


import React from 'react';

interface FormHeaderProps {
  userType: 'guest' | 'employee';
}

const FormHeader: React.FC<FormHeaderProps> = ({ userType }) => {
  return (
    <h3 className="text-xl font-medium mb-4">
      {userType === 'guest' ? 'تسجيل الزائر' : 'تسجيل الموظف'}
    </h3>
  );
};

export default FormHeader;

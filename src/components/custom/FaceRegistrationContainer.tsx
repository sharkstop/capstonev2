import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, Card, Steps, Result, Alert, message } from 'antd';
import { UserOutlined, IdcardOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';
import moment from 'moment';
import FaceCapture from './FaceCapture';
import { registerUser, registerEmployee, registerGuest } from '../services/databaseService';

const { Option } = Select;
const { Step } = Steps;

interface FaceRegistrationContainerProps {
  userType?: 'guest' | 'employee' | 'vip';
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
}

const FaceRegistrationContainer: React.FC<FaceRegistrationContainerProps> = ({
  userType = 'guest',
  onSuccess,
  onError
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [faceData, setFaceData] = useState<any>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // تحديد الحقول المطلوبة حسب نوع المستخدم
  const getFormFields = () => {
    const commonFields = (
      <>
        <Form.Item
          name="name"
          label="الاسم الكامل"
          rules={[{ required: true, message: 'الرجاء إدخال الاسم الكامل' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="الاسم الكامل" />
        </Form.Item>
        
        <Form.Item
          name="email"
          label="البريد الإلكتروني"
          rules={[
            { required: true, message: 'الرجاء إدخال البريد الإلكتروني' },
            { type: 'email', message: 'البريد الإلكتروني غير صالح' }
          ]}
        >
          <Input type="email" placeholder="البريد الإلكتروني" />
        </Form.Item>
      </>
    );

    if (userType === 'employee') {
      return (
        <>
          {commonFields}
          
          <Form.Item
            name="department"
            label="القسم"
            rules={[{ required: true, message: 'الرجاء اختيار القسم' }]}
          >
            <Select placeholder="اختر القسم">
              <Option value="reception">الاستقبال</Option>
              <Option value="housekeeping">التدبير المنزلي</Option>
              <Option value="restaurant">المطعم</Option>
              <Option value="security">الأمن</Option>
              <Option value="management">الإدارة</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="position"
            label="المنصب"
            rules={[{ required: true, message: 'الرجاء إدخال المنصب' }]}
          >
            <Input placeholder="المنصب" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="كلمة المرور"
            rules={[{ required: true, message: 'الرجاء إدخال كلمة المرور' }]}
          >
            <Input.Password placeholder="كلمة المرور" />
          </Form.Item>
        </>
      );
    } else {
      // ضيف أو VIP
      return (
        <>
          {commonFields}
          
          <Form.Item
            name="room_number"
            label="رقم الغرفة"
            rules={[{ required: true, message: 'الرجاء إدخال رقم الغرفة' }]}
          >
            <Input prefix={<HomeOutlined />} placeholder="رقم الغرفة" />
          </Form.Item>
          
          <Form.Item
            name="check_in_date"
            label="تاريخ الوصول"
            rules={[{ required: true, message: 'الرجاء اختيار تاريخ الوصول' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="تاريخ الوصول" />
          </Form.Item>
          
          <Form.Item
            name="check_out_date"
            label="تاريخ المغادرة"
            rules={[{ required: true, message: 'الرجاء اختيار تاريخ المغادرة' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="تاريخ المغادرة" />
          </Form.Item>
        </>
      );
    }
  };

  // التعامل مع اكتشاف الوجه
  const handleFaceDetected = (data: any) => {
    if (data && data.face_descriptor) {
      setFaceData(data);
      message.success('تم التقاط صورة الوجه بنجاح');
      // الانتقال تلقائيًا إلى الخطوة التالية
      setCurrentStep(1);
    } else {
      message.error('فشل في التقاط صورة الوجه. الرجاء المحاولة مرة أخرى.');
    }
  };

  // التعامل مع إرسال النموذج
  const handleSubmit = async (values: any) => {
    if (!faceData) {
      message.error('الرجاء التقاط صورة الوجه أولاً');
      setCurrentStep(0);
      return;
    }

    setLoading(true);
    setRegistrationError(null);

    try {
      // تحويل التواريخ إلى تنسيق ISO
      if (values.check_in_date) {
        values.check_in_date = values.check_in_date.toISOString();
      }
      if (values.check_out_date) {
        values.check_out_date = values.check_out_date.toISOString();
      }

      // إضافة بيانات الوجه
      const userData = {
        ...values,
        face_descriptor: faceData.face_descriptor,
        user_type: userType
      };

      // تسجيل المستخدم حسب النوع
      let response;
      if (userType === 'employee') {
        response = await registerEmployee(userData);
      } else if (userType === 'vip') {
        response = await registerGuest({ ...userData, user_type: 'vip' });
      } else {
        response = await registerGuest(userData);
      }

      setUserData(response);
      setRegistrationComplete(true);
      
      if (onSuccess) {
        onSuccess(response);
      }
      
      message.success('تم تسجيل المستخدم بنجاح');
    } catch (error) {
      console.error('Error registering user:', error);
      setRegistrationError('حدث خطأ أثناء تسجيل المستخدم. الرجاء المحاولة مرة أخرى.');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // التعامل مع تغيير الخطوة
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  // إعادة تعيين النموذج
  const handleReset = () => {
    form.resetFields();
    setFaceData(null);
    setCurrentStep(0);
    setRegistrationComplete(false);
    setRegistrationError(null);
    setUserData(null);
  };

  // عرض محتوى الخطوة الحالية
  const renderStepContent = () => {
    if (registrationComplete) {
      return (
        <Result
          status="success"
          title="تم تسجيل المستخدم بنجاح!"
          subTitle={`تم تسجيل ${userData?.name} في النظام.`}
          extra={[
            <Button type="primary" key="done" onClick={handleReset}>
              تسجيل مستخدم جديد
            </Button>
          ]}
        />
      );
    }

    if (registrationError) {
      return (
        <Result
          status="error"
          title="فشل في تسجيل المستخدم"
          subTitle={registrationError}
          extra={[
            <Button type="primary" key="retry" onClick={handleReset}>
              المحاولة مرة أخرى
            </Button>
          ]}
        />
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <div className="face-capture-step">
            <Alert
              message="التقاط صورة الوجه"
              description="الرجاء النظر إلى الكاميرا والضغط على زر 'التقاط صورة'"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <FaceCapture
              mode="register"
              onFaceDetected={handleFaceDetected}
            />
          </div>
        );
      case 1:
        return (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="user-info-form"
          >
            {getFormFields()}
            
            <Form.Item>
              <div className="form-actions">
                <Button onClick={() => setCurrentStep(0)}>
                  السابق
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  تسجيل
                </Button>
              </div>
            </Form.Item>
          </Form>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      title={`تسجيل ${userType === 'employee' ? 'موظف' : userType === 'vip' ? 'ضيف VIP' : 'ضيف'} جديد`}
      className="face-registration-container"
    >
      <Steps current={currentStep} onChange={handleStepChange} className="registration-steps">
        <Step title="التقاط الوجه" icon={<UserOutlined />} />
        <Step title="معلومات المستخدم" icon={<IdcardOutlined />} />
      </Steps>
      
      <div className="step-content">
        {renderStepContent()}
      </div>
      
      <style jsx>{`
        .face-registration-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .registration-steps {
          margin-bottom: 24px;
        }
        
        .step-content {
          margin-top: 24px;
          min-height: 300px;
        }
        
        .face-capture-step {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .user-info-form {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .form-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
        }
      `}</style>
    </Card>
  );
};

export default FaceRegistrationContainer;

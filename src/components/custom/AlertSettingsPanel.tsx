import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, Switch, Slider, Select, Upload, message } from 'antd';
import { SoundOutlined, UploadOutlined, SettingOutlined, BellOutlined } from '@ant-design/icons';
import { getAlertSettings, updateAlertSetting } from '../services/databaseService';

const { TabPane } = Tabs;
const { Option } = Select;

const AlertSettingsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  // تحميل إعدادات التنبيهات عند تحميل المكون
  useEffect(() => {
    fetchAlertSettings();
  }, []);

  // جلب إعدادات التنبيهات من الخادم
  const fetchAlertSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const alertSettings = await getAlertSettings();
      setSettings(alertSettings);
    } catch (err) {
      console.error('Error fetching alert settings:', err);
      setError('حدث خطأ أثناء جلب إعدادات التنبيهات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // تحديث إعدادات التنبيه
  const updateSettings = async (alertType, values) => {
    setLoading(true);
    setError(null);

    try {
      const response = await updateAlertSetting(alertType, values);
      
      // تحديث الإعدادات المحلية
      setSettings(prevSettings => ({
        ...prevSettings,
        [alertType]: {
          ...prevSettings[alertType],
          ...values
        }
      }));
      
      message.success(`تم تحديث إعدادات التنبيه "${response.alert_type}" بنجاح`);
    } catch (err) {
      console.error('Error updating alert settings:', err);
      setError('حدث خطأ أثناء تحديث إعدادات التنبيه. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // معالجة تغيير التفعيل
  const handleEnabledChange = (alertType, enabled) => {
    updateSettings(alertType, { enabled });
  };

  // معالجة تغيير مستوى الصوت
  const handleVolumeChange = (alertType, volume) => {
    updateSettings(alertType, { volume });
  };

  // معالجة تغيير ملف الصوت
  const handleSoundChange = (alertType, sound) => {
    updateSettings(alertType, { sound });
  };

  // معالجة تحميل ملف صوت جديد
  const handleSoundUpload = (alertType, info) => {
    if (info.file.status === 'done') {
      const soundFileName = info.file.response.filename;
      updateSettings(alertType, { sound: soundFileName });
      message.success(`تم تحميل الملف ${info.file.name} بنجاح`);
    } else if (info.file.status === 'error') {
      message.error(`فشل تحميل الملف ${info.file.name}`);
    }
  };

  // تشغيل الصوت للاختبار
  const playSound = (soundFile) => {
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.play().catch(err => console.error('Error playing sound:', err));
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  };

  // عرض إعدادات التنبيه
  const renderAlertSetting = (alertType) => {
    const setting = settings[alertType];
    if (!setting) return null;

    return (
      <Card 
        title={setting.description} 
        className="alert-setting-card"
        extra={
          <Switch 
            checked={setting.enabled} 
            onChange={(checked) => handleEnabledChange(alertType, checked)} 
            loading={loading}
          />
        }
      >
        <Form layout="vertical">
          <Form.Item label="ملف الصوت">
            <div className="sound-selector">
              <Select
                value={setting.sound}
                onChange={(value) => handleSoundChange(alertType, value)}
                style={{ width: '70%' }}
                disabled={!setting.enabled || loading}
              >
                <Option value="access_granted.mp3">صوت الوصول المسموح</Option>
                <Option value="access_denied.mp3">صوت الوصول المرفوض</Option>
                <Option value="vip_alert.mp3">صوت تنبيه VIP</Option>
                <Option value="multiple_faces.mp3">صوت الوجوه المتعددة</Option>
                <Option value="low_confidence.mp3">صوت الثقة المنخفضة</Option>
                <Option value="system_error.mp3">صوت خطأ النظام</Option>
              </Select>
              <Button
                icon={<SoundOutlined />}
                onClick={() => playSound(setting.sound)}
                disabled={!setting.enabled || loading}
                style={{ marginLeft: 8 }}
              >
                اختبار
              </Button>
            </div>
          </Form.Item>

          <Form.Item label="تحميل صوت مخصص">
            <Upload
              name="sound"
              action="/api/admin/alerts/upload-sound"
              onChange={(info) => handleSoundUpload(alertType, info)}
              disabled={!setting.enabled || loading}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />} disabled={!setting.enabled || loading}>
                تحميل ملف صوت
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item label={`مستوى الصوت: ${Math.round(setting.volume * 100)}%`}>
            <Slider
              value={setting.volume}
              onChange={(value) => handleVolumeChange(alertType, value)}
              min={0}
              max={1}
              step={0.1}
              disabled={!setting.enabled || loading}
            />
          </Form.Item>
        </Form>
      </Card>
    );
  };

  return (
    <div className="alert-settings-panel">
      <Card title="إعدادات التنبيهات الصوتية" className="main-card">
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <BellOutlined />
                تنبيهات الوصول
              </span>
            }
            key="1"
          >
            <div className="settings-grid">
              {renderAlertSetting('access_granted')}
              {renderAlertSetting('access_denied')}
              {renderAlertSetting('vip_detected')}
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                تنبيهات متقدمة
              </span>
            }
            key="2"
          >
            <div className="settings-grid">
              {renderAlertSetting('multiple_faces')}
              {renderAlertSetting('low_confidence')}
              {renderAlertSetting('system_error')}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <style jsx>{`
        .alert-settings-panel {
          padding: 24px;
        }
        
        .main-card {
          margin-bottom: 24px;
        }
        
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        
        .alert-setting-card {
          height: 100%;
        }
        
        .sound-selector {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default AlertSettingsPanel;

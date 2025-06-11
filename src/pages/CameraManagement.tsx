
import React from 'react';
import { Helmet } from 'react-helmet-async';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import CameraGrid from '@/components/cameras/CameraGrid';
import AddCameraDialog from '@/components/cameras/AddCameraDialog';

const CameraManagement = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar />
      
      <div className="flex-1 ml-64 p-6">
        <Helmet>
          <title>{t('cameras.management')} | IFDD</title>
        </Helmet>
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('cameras.management')}</h1>
          <AddCameraDialog />
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t('cameras.allCameras')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CameraGrid />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CameraManagement;


import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cameraService } from '@/services/cameraService';
import CameraCard from './CameraCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

const CameraGrid = () => {
  const { t } = useLanguage();
  
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: cameraService.getCameras
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="border rounded-lg p-4 bg-card">
            <Skeleton className="h-40 w-full mb-4" />
            <Skeleton className="h-6 w-2/3 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <div className="flex justify-between mt-4">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (cameras.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-card">
        <p className="text-xl font-medium mb-4">{t('cameras.noCameras')}</p>
        <p className="text-muted-foreground">{t('cameras.addCamerasMessage')}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cameras.map((camera: any) => (
        <CameraCard key={camera.id} camera={camera} />
      ))}
    </div>
  );
};

export default CameraGrid;

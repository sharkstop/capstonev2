
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Edit, Play, Settings, Star, Square, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cameraService } from '@/services/cameraService';
import { useQueryClient } from '@tanstack/react-query';
import EditCameraDialog from './EditCameraDialog';
import DeleteCameraDialog from './DeleteCameraDialog';

interface CameraCardProps {
  camera: {
    id: number;
    name: string;
    url: string;
    location: string;
    description: string;
    is_active: boolean;
    is_primary: boolean;
    alert_on_disconnect: boolean;
    start_time: string | null;
    end_time: string | null;
  };
}

const CameraCard: React.FC<CameraCardProps> = ({ camera }) => {
  const { t } = useLanguage();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    return () => {
      // Cleanup video stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);
  
  const handleStreamToggle = () => {
    if (isStreaming) {
      // Stop streaming
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
    } else {
      // Start streaming - in a real app you would use the camera URL with a streaming library
      // This is a placeholder that simulates streaming by accessing the user's camera
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsStreaming(true);
          }
        })
        .catch((err) => {
          console.error("Error accessing camera stream:", err);
          alert(t('cameras.streamError'));
        });
    }
  };
  
  const handleSetPrimary = async () => {
    try {
      await cameraService.setPrimaryCamera(camera.id);
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    } catch (error) {
      console.error("Error setting primary camera:", error);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Camera size={18} className="text-primary" />
            {camera.name}
          </CardTitle>
          <div className="flex gap-1">
            {camera.is_primary && (
              <Badge variant="default" className="bg-yellow-500 text-white">
                {t('cameras.primary')}
              </Badge>
            )}
            <Badge variant={camera.is_active ? "default" : "outline"}>
              {camera.is_active ? t('cameras.active') : t('cameras.inactive')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black mb-3 rounded overflow-hidden">
          {isStreaming ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Camera size={48} className="text-gray-500" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 text-sm rounded">
            {camera.name}
          </div>
        </div>
        
        {camera.location && (
          <p className="text-sm text-muted-foreground mb-3">
            {t('cameras.location')}: {camera.location}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isStreaming ? "destructive" : "default"}
                onClick={handleStreamToggle}
              >
                {isStreaming ? <Square size={16} /> : <Play size={16} />}
                {isStreaming ? t('cameras.stop') : t('cameras.stream')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isStreaming ? t('cameras.stopStream') : t('cameras.startStream')}
            </TooltipContent>
          </Tooltip>
          
          {!camera.is_primary && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSetPrimary}
                >
                  <Star size={16} />
                  {t('cameras.setPrimary')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('cameras.makePrimary')}
              </TooltipContent>
            </Tooltip>
          )}
          
          <div className="grow"></div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('cameras.edit')}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('cameras.delete')}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
      
      <EditCameraDialog
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        camera={camera}
      />
      
      <DeleteCameraDialog
        cameraId={camera.id}
        cameraName={camera.name}
      />
    </Card>
  );
};

export default CameraCard;

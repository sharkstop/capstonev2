
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cameraService } from '@/services/cameraService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DeleteCameraDialogProps {
  cameraId: number; // Changed from string to number to match API expectations
  cameraName: string;
  children?: React.ReactNode;
}

const DeleteCameraDialog: React.FC<DeleteCameraDialogProps> = ({
  cameraId,
  cameraName,
  children,
}) => {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      await cameraService.deleteCamera(cameraId);
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast.success(t('cameras.cameraDeleted'));
      setOpen(false);
    } catch (error) {
      console.error('Failed to delete camera:', error);
      toast.error(t('cameras.deleteError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
            <Trash2 size={16} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('cameras.deleteCamera')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            {t('cameras.deleteConfirmation', { name: cameraName })}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            {t('delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCameraDialog;

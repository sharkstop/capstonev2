
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { cameraService } from '@/services/cameraService';
import { useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimePickerInput } from '@/components/ui/time-picker-input';

interface Camera {
  id: number;
  name: string;
  url: string;
  location?: string;
  description?: string;
  is_active: boolean;
  is_primary: boolean;
  alert_on_disconnect: boolean;
  start_time: string | null;
  end_time: string | null;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Camera name must be at least 2 characters.",
  }),
  url: z.string().min(5, {
    message: "Please enter a valid URL or IP address.",
  }),
  location: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  alert_on_disconnect: z.boolean().default(false),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
});

interface EditCameraDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  camera: Camera;
}

const EditCameraDialog: React.FC<EditCameraDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  camera
}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: camera.name,
      url: camera.url,
      location: camera.location || "",
      description: camera.description || "",
      is_active: camera.is_active,
      alert_on_disconnect: camera.alert_on_disconnect,
      start_time: camera.start_time,
      end_time: camera.end_time,
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await cameraService.updateCamera(camera.id, values);
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update camera:', error);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('cameras.editCamera')}: {camera.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">{t('cameras.basicInfo')}</TabsTrigger>
                <TabsTrigger value="settings">{t('cameras.settings')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('cameras.cameraName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('cameras.streamingUrl')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('cameras.location')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('cameras.description')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('cameras.cameraActive')}
                        </FormLabel>
                        <FormDescription>
                          {t('cameras.activeDescription')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="alert_on_disconnect"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('cameras.alertOnDisconnect')}
                        </FormLabel>
                        <FormDescription>
                          {t('cameras.alertDescription')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('cameras.startTime')}</FormLabel>
                        <FormControl>
                          <TimePickerInput
                            value={field.value || undefined}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('cameras.operationalHoursStart')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('cameras.endTime')}</FormLabel>
                        <FormControl>
                          <TimePickerInput
                            value={field.value || undefined}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('cameras.operationalHoursEnd')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit">
                {t('save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCameraDialog;


import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cameraService } from '@/services/cameraService';
import { useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Camera name must be at least 2 characters.",
  }),
  url: z.string().min(5, {
    message: "Please enter a valid URL or IP address.",
  }),
  location: z.string().optional(),
  description: z.string().optional(),
});

interface AddCameraDialogProps {
  children?: React.ReactNode;
}

const AddCameraDialog: React.FC<AddCameraDialogProps> = ({ children }) => {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      location: "",
      description: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Make sure name and url are treated as required even though TypeScript thinks they might be undefined
      // This is safe because the form validation ensures they're present
      await cameraService.createCamera({
        name: values.name,
        url: values.url,
        location: values.location,
        description: values.description
      });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Failed to create camera:', error);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2" size={16} />
            {t('cameras.addCamera')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('cameras.addNewCamera')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cameras.cameraName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('cameras.enterCameraName')} {...field} />
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
                    <Input 
                      placeholder="rtsp://example.com:554/stream or 192.168.1.100" 
                      {...field} 
                    />
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
                    <Input 
                      placeholder={t('cameras.enterLocation')} 
                      {...field}
                    />
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
                    <Textarea 
                      placeholder={t('cameras.enterDescription')} 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit">
                {t('add')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCameraDialog;

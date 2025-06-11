
/**
 * Camera Service to interact with camera-related API endpoints
 */
import { toast } from 'sonner';

// Helper to handle response errors (reusing from apiService)
const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('API Error:', error);
  
  let message = defaultMessage;
  if (error.response) {
    try {
      message = error.response.data.detail || defaultMessage;
    } catch (e) {
      // Default message if response parsing fails
    }
  }
  
  toast.error(message);
  throw new Error(message);
};

// Camera API service
export const cameraService = {
  // Get all cameras
  getCameras: async () => {
    try {
      const backendUrl = localStorage.getItem('backendUrl') || '';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/cameras`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل جلب الكاميرات');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting cameras:', error);
      toast.error('فشل جلب الكاميرات');
      return [];
    }
  },
  
  // Get a specific camera
  getCamera: async (id: number) => {
    try {
      const backendUrl = localStorage.getItem('backendUrl') || '';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/cameras/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل جلب الكاميرا');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting camera:', error);
      toast.error('فشل جلب الكاميرا');
      return null;
    }
  },
  
  // Create a new camera
  createCamera: async (cameraData: {
    name: string;
    url: string;
    location?: string;
    description?: string;
  }) => {
    try {
      const backendUrl = localStorage.getItem('backendUrl') || '';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/cameras`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cameraData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      toast.success('تم إضافة الكاميرا بنجاح');
      return data;
    } catch (error) {
      return handleApiError(error, 'فشل إضافة الكاميرا');
    }
  },
  
  // Update a camera
  updateCamera: async (
    id: number,
    cameraData: {
      name?: string;
      url?: string;
      location?: string;
      description?: string;
      is_active?: boolean;
      is_primary?: boolean;
      alert_on_disconnect?: boolean;
      start_time?: string;
      end_time?: string;
    }
  ) => {
    try {
      const backendUrl = localStorage.getItem('backendUrl') || '';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/cameras/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cameraData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      toast.success('تم تحديث الكاميرا بنجاح');
      return data;
    } catch (error) {
      return handleApiError(error, 'فشل تحديث الكاميرا');
    }
  },
  
  // Delete a camera
  deleteCamera: async (id: number) => {
    try {
      const backendUrl = localStorage.getItem('backendUrl') || '';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/cameras/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      toast.success('تم حذف الكاميرا بنجاح');
      return true;
    } catch (error) {
      return handleApiError(error, 'فشل حذف الكاميرا');
    }
  },
  
  // Set camera as primary
  setPrimaryCamera: async (id: number) => {
    try {
      const backendUrl = localStorage.getItem('backendUrl') || '';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/cameras/${id}/primary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      toast.success('تم تعيين الكاميرا كأساسية بنجاح');
      return true;
    } catch (error) {
      return handleApiError(error, 'فشل تعيين الكاميرا كأساسية');
    }
  }
};

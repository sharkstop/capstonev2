
/**
 * API Service to interact with the FastAPI backend
 */
import { toast } from 'sonner';

// Base API configuration
const getApiConfig = () => {
  const backendUrl = localStorage.getItem('backendUrl') || '';
  const apiKey = localStorage.getItem('faceApiKey') || '';
  
  if (!backendUrl) {
    throw new Error('لم يتم تكوين عنوان الخادم الخلفي. يرجى الانتقال إلى الإعدادات وتكوينه.');
  }
  
  return { backendUrl, apiKey };
};

// Helper to handle response errors
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

// Authentication Service
export const authService = {
  // Login with email and password (for employees)
  loginWithCredentials: async (email: string, password: string) => {
    try {
      const { backendUrl } = getApiConfig();
      
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await fetch(`${backendUrl}/api/token`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('authType', 'bearer');
      
      return data;
    } catch (error) {
      return handleApiError(error, 'فشل تسجيل الدخول. تحقق من بيانات الاعتماد الخاصة بك.');
    }
  },
  
  // Login with face recognition
  loginWithFace: async (faceImageBlob: Blob) => {
    try {
      const { backendUrl } = getApiConfig();
      
      const formData = new FormData();
      formData.append('face_image', faceImageBlob, 'face.jpg');
      
      const response = await fetch(`${backendUrl}/api/login/face`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('authType', 'bearer');
      
      return data;
    } catch (error) {
      return handleApiError(error, 'فشل تسجيل الدخول بالوجه. لم يتم التعرف على الوجه.');
    }
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authType');
  },
  
  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
  
  // Get current user info
  getCurrentUser: async () => {
    try {
      const { backendUrl } = getApiConfig();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل جلب معلومات المستخدم');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
};

// User Service
export const userService = {
  // Register a guest with face
  registerGuest: async (
    name: string,
    email: string,
    roomNumber: string,
    reservationNumber: string,
    faceImageBlob: Blob
  ) => {
    try {
      const { backendUrl } = getApiConfig();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('room_number', roomNumber);
      formData.append('reservation_number', reservationNumber);
      formData.append('face_image', faceImageBlob, 'face.jpg');
      
      const response = await fetch(`${backendUrl}/api/register/guest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      toast.success('تم تسجيل الضيف بنجاح');
      return data;
    } catch (error) {
      return handleApiError(error, 'فشل تسجيل الضيف');
    }
  },
  
  // Register an employee with face
  registerEmployee: async (
    name: string,
    email: string,
    password: string,
    department: string,
    position: string,
    faceImageBlob: Blob
  ) => {
    try {
      const { backendUrl } = getApiConfig();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('department', department);
      formData.append('position', position);
      formData.append('face_image', faceImageBlob, 'face.jpg');
      
      const response = await fetch(`${backendUrl}/api/register/employee`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      toast.success('تم تسجيل الموظف بنجاح');
      return data;
    } catch (error) {
      return handleApiError(error, 'فشل تسجيل الموظف');
    }
  },
  
  // Get all users
  getUsers: async (userType?: string) => {
    try {
      const { backendUrl } = getApiConfig();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      let url = `${backendUrl}/api/users`;
      if (userType) {
        url += `?user_type=${userType}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل جلب المستخدمين');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting users:', error);
      toast.error('فشل جلب المستخدمين');
      return [];
    }
  }
};

// Access Control Service
export const accessService = {
  // Verify a face
  verifyFace: async (faceImageBlob: Blob, location?: string, unlock: boolean = false) => {
    try {
      const { backendUrl } = getApiConfig();
      
      const formData = new FormData();
      formData.append('face_image', faceImageBlob, 'face.jpg');
      if (location) {
        formData.append('location', location);
      }
      formData.append('unlock', unlock ? 'true' : 'false');
      
      const response = await fetch(`${backendUrl}/api/verify`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return handleApiError(error, 'فشل التحقق من الوجه');
    }
  },
  
  // Get access logs
  getAccessLogs: async (filters?: {
    userId?: number;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    location?: string;
  }) => {
    try {
      const { backendUrl } = getApiConfig();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      let url = `${backendUrl}/api/access-logs`;
      
      // Add filters if provided
      if (filters) {
        const params = new URLSearchParams();
        if (filters.userId !== undefined) params.append('user_id', filters.userId.toString());
        if (filters.success !== undefined) params.append('success', filters.success.toString());
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.location) params.append('location', filters.location);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل جلب سجلات الوصول');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting access logs:', error);
      toast.error('فشل جلب سجلات الوصول');
      return [];
    }
  }
};

// Admin Service
export const adminService = {
  // Get system statistics
  getStats: async () => {
    try {
      const { backendUrl } = getApiConfig();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل جلب إحصائيات النظام');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting system stats:', error);
      toast.error('فشل جلب إحصائيات النظام');
      return null;
    }
  },
  
  // Register a smart lock
  registerSmartLock: async (
    deviceId: string,
    name: string,
    location: string,
    ipAddress: string,
    apiKey: string
  ) => {
    try {
      const { backendUrl } = getApiConfig();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const formData = new FormData();
      formData.append('device_id', deviceId);
      formData.append('name', name);
      formData.append('location', location);
      formData.append('ip_address', ipAddress);
      formData.append('api_key', apiKey);
      
      const response = await fetch(`${backendUrl}/api/smart-locks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      toast.success('تم تسجيل القفل الذكي بنجاح');
      return data;
    } catch (error) {
      return handleApiError(error, 'فشل تسجيل القفل الذكي');
    }
  },
  
  // Get all smart locks
  getSmartLocks: async () => {
    try {
      const { backendUrl } = getApiConfig();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('غير مصرح');
      }
      
      const response = await fetch(`${backendUrl}/api/smart-locks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل جلب الأقفال الذكية');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting smart locks:', error);
      toast.error('فشل جلب الأقفال الذكية');
      return [];
    }
  }
};

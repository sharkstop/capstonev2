
import axios from "axios";
import { toast } from "sonner";

export interface UserData {
  name: string;
  email: string;
  userType: "guest" | "employee";
  roomNumber?: string;
  reservationNumber?: string;
  department?: string;
  position?: string;
}

const API_BASE = "http://localhost:8000/api";

class DatabaseService {
  async registerUser(data: UserData, faceDescriptor: Float32Array): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE}/users/register`, {
        ...data,
        face_descriptor: Array.from(faceDescriptor)
      });

      toast.success("تم تسجيل المستخدم بنجاح");
      return response.data.id;
    } catch (error) {
      console.error("فشل في تسجيل المستخدم:", error);
      toast.error("فشل في تسجيل المستخدم. تأكد من الاتصال بالخادم.");
      throw error;
    }
  }

  async logAccess(userId: string, confidence: number, location: string): Promise<void> {
    try {
      await axios.post(`${API_BASE}/access/log`, {
        user_id: userId,
        confidence,
        location
      });

      toast.success("تم تسجيل محاولة الدخول");
    } catch (error) {
      console.error("فشل في تسجيل محاولة الدخول:", error);
      toast.error("لم يتم تسجيل محاولة الدخول في الخادم.");
    }
  }

  async fetchUsers(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/users`);
      return response.data;
    } catch (error) {
      console.error("فشل في جلب المستخدمين:", error);
      toast.error("لم يتم جلب بيانات المستخدمين من الخادم.");
      return [];
    }
  }
}

export const databaseService = new DatabaseService();

export interface UserData {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  user_type: 'guest' | 'employee' | 'vip';
  room_number?: string;
  check_in_date?: string;
  check_out_date?: string;
  face_descriptor?: string;
  created_at: string;
  last_access?: string;
  is_active: boolean;
}

export interface AccessLog {
  id: number;
  user_id?: number;
  access_time: string;
  success: boolean;
  confidence?: number;
  location?: string;
  image_path?: string;
  user?: UserData;
}

export interface AlertSetting {
  sound: string;
  volume: number;
  enabled: boolean;
  description: string;
}
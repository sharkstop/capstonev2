
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface GuestFieldsProps {
  formData: {
    roomNumber: string;
    bookingId: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const GuestFields: React.FC<GuestFieldsProps> = ({ formData, handleChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="roomNumber">رقم الغرفة</Label>
          <Input
            id="roomNumber"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            placeholder="أدخل رقم الغرفة"
          />
        </div>
        
        <div>
          <Label htmlFor="bookingId">رقم الحجز</Label>
          <Input
            id="bookingId"
            name="bookingId"
            value={formData.bookingId}
            onChange={handleChange}
            placeholder="أدخل رقم الحجز"
          />
        </div>
      </div>
    </div>
  );
};

export default GuestFields;

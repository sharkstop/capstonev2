
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeFieldsProps {
  formData: {
    employeeId: string;
    department: string;
    position: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
}

const EmployeeFields: React.FC<EmployeeFieldsProps> = ({ 
  formData, 
  handleChange, 
  handleSelectChange 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="employeeId">رقم الموظف</Label>
        <Input
          id="employeeId"
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          placeholder="أدخل رقم الموظف"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">القسم</Label>
          <Select 
            onValueChange={(value) => handleSelectChange('department', value)}
            value={formData.department}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="اختر القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reception">الاستقبال</SelectItem>
              <SelectItem value="security">الأمن</SelectItem>
              <SelectItem value="housekeeping">خدمة الغرف</SelectItem>
              <SelectItem value="food_service">خدمة الطعام</SelectItem>
              <SelectItem value="management">الإدارة</SelectItem>
              <SelectItem value="maintenance">الصيانة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="position">المنصب</Label>
          <Input
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="أدخل المنصب"
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeFields;


import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { User, Briefcase } from 'lucide-react';

interface UserTypeSelectorProps {
  onSelect: (type: 'guest' | 'employee') => void;
}

const UserTypeSelector = ({ onSelect }: UserTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.03 }}
        onClick={() => onSelect('guest')}
      >
        <Card className="h-full glass-card cursor-pointer hover:border-primary/30 transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800">
              <User className="h-10 w-10 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="text-2xl font-medium text-center">Hotel Guest</h3>
            <p className="text-muted-foreground text-center">
              Register as a hotel guest to access your room and hotel amenities
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ scale: 1.03 }}
        onClick={() => onSelect('employee')}
      >
        <Card className="h-full glass-card cursor-pointer hover:border-primary/30 transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full p-4 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900 dark:to-amber-800">
              <Briefcase className="h-10 w-10 text-amber-600 dark:text-amber-300" />
            </div>
            <h3 className="text-2xl font-medium text-center">Hotel Staff</h3>
            <p className="text-muted-foreground text-center">
              Staff login for system access and guest management
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserTypeSelector;

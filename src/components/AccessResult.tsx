
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertTriangle, DoorOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface AccessResultProps {
  success: boolean;
  userData?: {
    name: string;
    roomNumber?: string;
    employeeId?: string;
    department?: string;
  };
  onClose: () => void;
}

const AccessResult = ({ success, userData, onClose }: AccessResultProps) => {
  useEffect(() => {
    if (success) {
      // Trigger confetti effect for successful access
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [success]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-md mx-auto"
    >
      <Card className={`glass-card border-2 ${success ? 'border-green-500/50' : 'border-red-500/50'}`}>
        <CardContent className="p-6">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <Check className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Access Granted</h2>
              
              {userData && (
                <div className="mb-4">
                  <p className="text-lg font-medium mb-1">Welcome, {userData.name}</p>
                  {userData.roomNumber && (
                    <p className="text-muted-foreground">Room: {userData.roomNumber}</p>
                  )}
                  {userData.employeeId && (
                    <p className="text-muted-foreground">ID: {userData.employeeId}</p>
                  )}
                  {userData.department && (
                    <p className="text-muted-foreground">Department: {userData.department}</p>
                  )}
                </div>
              )}
              
              <div className="flex justify-center mb-4">
                <DoorOpen className="h-10 w-10 text-green-600 dark:text-green-400 animate-pulse" />
              </div>
              
              <p className="text-muted-foreground mb-6">Door has been unlocked</p>
              
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
                  <X className="h-16 w-16 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Your identity could not be verified.
              </p>
              
              <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Security personnel have been notified. Please contact the reception desk for assistance.
                  </p>
                </div>
              </div>
              
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AccessResult;

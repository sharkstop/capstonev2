
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardSidebar from '@/components/DashboardSidebar';
import AccessLogTable from '@/components/AccessLogTable';
import { Bell } from 'lucide-react';

const DashboardLogs = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Access Logs</h1>
            <p className="text-muted-foreground">
              Track and monitor all access attempts
            </p>
          </div>
          
          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-red-200 dark:border-red-900/30">
              <CardHeader className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-red-800 dark:text-red-300">
                    <Bell className="h-4 w-4 mr-2" />
                    Recent Security Alerts
                  </CardTitle>
                  
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium px-2 py-1 rounded-full">
                    2 New Alerts
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-900/20">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-red-800 dark:text-red-300">Unauthorized Access Attempt</div>
                        <div className="text-xs text-red-600 dark:text-red-400">10:23 AM</div>
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-200 mt-1">
                        Unknown person attempted to access Room 304. Security notified.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-900/20">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-red-800 dark:text-red-300">Unauthorized Access Attempt</div>
                        <div className="text-xs text-red-600 dark:text-red-400">Yesterday, 4:15 PM</div>
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-200 mt-1">
                        Unknown person attempted to access Staff Entrance. Security notified.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Access Logs Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <AccessLogTable />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLogs;

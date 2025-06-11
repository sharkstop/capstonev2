
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Check, X, Search, User, Clock } from 'lucide-react';

// Sample access log data
const dummyLogs = [
  {
    id: '1',
    userName: 'John Doe',
    userId: '1',
    location: 'Main Entrance',
    timestamp: '2023-10-18T08:23:45Z',
    success: true,
    deviceId: 'CAM-001'
  },
  {
    id: '2',
    userName: 'Alice Smith',
    userId: '2',
    location: 'Room 512',
    timestamp: '2023-10-18T09:45:12Z',
    success: true,
    deviceId: 'DOOR-512'
  },
  {
    id: '3',
    userName: 'Unknown Person',
    userId: null,
    location: 'Staff Entrance',
    timestamp: '2023-10-18T10:12:33Z',
    success: false,
    deviceId: 'CAM-003'
  },
  {
    id: '4',
    userName: 'Robert Johnson',
    userId: '3',
    location: 'Security Office',
    timestamp: '2023-10-18T11:05:27Z',
    success: true,
    deviceId: 'DOOR-SEC1'
  },
  {
    id: '5',
    userName: 'Sarah Williams',
    userId: '4',
    location: 'Reception Desk',
    timestamp: '2023-10-18T12:30:44Z',
    success: true,
    deviceId: 'CAM-002'
  },
  {
    id: '6',
    userName: 'Unknown Person',
    userId: null,
    location: 'Room 304',
    timestamp: '2023-10-18T14:22:18Z',
    success: false,
    deviceId: 'DOOR-304'
  },
  {
    id: '7',
    userName: 'Michael Brown',
    userId: '5',
    location: 'Room 201',
    timestamp: '2023-10-18T15:47:59Z',
    success: true,
    deviceId: 'DOOR-201'
  }
];

const AccessLogTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [logs] = useState(dummyLogs);
  
  // Filter logs based on search term and status filter
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'success' && log.success) || 
      (statusFilter === 'failed' && !log.success);
      
    return matchesSearch && matchesStatus;
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold">Access Logs</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Attempts</SelectItem>
              <SelectItem value="success">Successful</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Device ID</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {log.success ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mr-2">
                            <Check className="h-4 w-4" />
                          </div>
                          <span>Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-1 mr-2">
                            <X className="h-4 w-4" />
                          </div>
                          <span>Failed</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                        log.userId 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        <User size={16} />
                      </div>
                      <div>
                        <div className="font-medium">{log.userName}</div>
                        {log.userId && (
                          <div className="text-xs text-muted-foreground">ID: {log.userId}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>{log.location}</TableCell>
                  
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {log.deviceId}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No access logs found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AccessLogTable;

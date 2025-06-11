
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  MoreHorizontal, 
  Search, 
  Trash, 
  Edit, 
  Eye 
} from 'lucide-react';

// Sample user data (would normally come from API)
const dummyUsers = [
  {
    id: '1',
    name: 'John Doe',
    type: 'guest',
    roomNumber: '304',
    bookingId: 'B78901234',
    email: 'john.doe@example.com',
    registeredAt: '2023-10-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'Alice Smith',
    type: 'guest',
    roomNumber: '512',
    bookingId: 'B78901235',
    email: 'alice.smith@example.com',
    registeredAt: '2023-10-16T09:45:00Z'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    type: 'employee',
    department: 'Security',
    position: 'Security Officer',
    employeeId: 'EMP001',
    email: 'robert.j@example.com',
    registeredAt: '2023-09-20T08:15:00Z'
  },
  {
    id: '4',
    name: 'Sarah Williams',
    type: 'employee',
    department: 'Reception',
    position: 'Front Desk Manager',
    employeeId: 'EMP002',
    email: 'sarah.w@example.com',
    registeredAt: '2023-09-05T10:30:00Z'
  },
  {
    id: '5',
    name: 'Michael Brown',
    type: 'guest',
    roomNumber: '201',
    bookingId: 'B78901239',
    email: 'michael.b@example.com',
    registeredAt: '2023-10-17T16:20:00Z'
  }
];

const UsersTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users] = useState(dummyUsers);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.type === 'guest' && user.roomNumber?.includes(searchTerm)) ||
    (user.type === 'employee' && user.employeeId?.includes(searchTerm))
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Registered Users</h2>
        
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="w-14"></TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-primary">
                        <User size={16} />
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.type === 'guest' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {user.type === 'guest' ? 'Guest' : 'Employee'}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    {user.type === 'guest' ? (
                      <div className="text-sm">
                        <div>Room: {user.roomNumber}</div>
                        <div className="text-muted-foreground">Booking: {user.bookingId}</div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div>{user.position}</div>
                        <div className="text-muted-foreground">{user.department}</div>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>{user.email}</TableCell>
                  
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.registeredAt)}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No users found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersTable;

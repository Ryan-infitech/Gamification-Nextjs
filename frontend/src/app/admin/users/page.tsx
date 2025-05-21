'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { DataTable } from '@/components/ui/DataTable';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/Dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/DropdownMenu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Eye, 
  Slash, 
  Download, 
  Upload 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import useUsers from '@/hooks/useUsers';
import Loading from '@/components/ui/Loading';

// Define column types for DataTable
const columns = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user.avatar_url} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary font-pixel-heading">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium font-pixel-body">{user.username}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role');
      return (
        <Badge variant={
          role === 'admin' ? 'default' : 
          role === 'teacher' ? 'secondary' : 'outline'
        }>
          {role}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const verified = row.original.verified;
      return (
        <Badge variant={verified ? 'success' : 'warning'}>
          {verified ? 'Verified' : 'Unverified'}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'));
      return (
        <div className="text-sm font-pixel-body">
          {date.toLocaleDateString()}
        </div>
      );
    }
  },
  {
    accessorKey: 'last_login',
    header: 'Last Login',
    cell: ({ row }) => {
      const lastLogin = row.getValue('last_login');
      return (
        <div className="text-sm font-pixel-body">
          {lastLogin ? new Date(lastLogin).toLocaleDateString() : 'Never'}
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-warning">
              {row.original.verified ? (
                <>
                  <Slash className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-danger">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

export default function UserManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { users, isLoading, error, totalUsers, pagination, setPagination, filters, setFilters } = useUsers();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Protect admin route
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };

  // Handle role filter change
  const handleRoleChange = (value: string) => {
    setFilters({
      ...filters,
      role: value !== 'all' ? value : undefined
    });
  };

  // Handle verification filter change
  const handleVerificationChange = (value: string) => {
    setFilters({
      ...filters,
      verified: value === 'verified' ? true : 
               value === 'unverified' ? false : 
               undefined
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination({
      ...pagination,
      page
    });
  };

  // Handle row selection
  const handleRowSelectionChange = (selection: Record<string, boolean>) => {
    const selectedIds = Object.keys(selection).filter(id => selection[id]);
    setSelectedUsers(selectedIds);
  };

  // Bulk operations
  const handleBulkOperation = (operation: 'delete' | 'verify' | 'deactivate' | 'email') => {
    // Implement bulk operations here
    console.log(`Bulk operation: ${operation} on users:`, selectedUsers);
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-pixel-heading text-gradient">User Management</h1>
            <p className="text-muted-foreground font-pixel-body">
              Manage users, roles, and permissions
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="font-pixel-body"
              onClick={() => {/* Download users */}}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              className="font-pixel-body"
              onClick={() => {/* Upload users */}}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogTrigger asChild>
                <Button className="font-pixel-body">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-pixel-heading">Add New User</DialogTitle>
                  <DialogDescription className="font-pixel-body">
                    Create a new user account. The user will receive an email invitation.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium font-pixel-body">Username</label>
                    <Input placeholder="johndoe" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium font-pixel-body">Email</label>
                    <Input placeholder="john@example.com" type="email" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium font-pixel-body">Role</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="send-invitation" />
                    <label 
                      htmlFor="send-invitation" 
                      className="text-sm font-medium font-pixel-body leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send invitation email
                    </label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateUserOpen(false)} className="font-pixel-body">
                    Cancel
                  </Button>
                  <Button className="font-pixel-body">
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="border-2 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-10 font-pixel-body" 
                  value={filters.search}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="flex gap-2">
                <Select 
                  value={filters.role || 'all'} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="w-32 font-pixel-body">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filters.verified === undefined ? 'all' : 
                          filters.verified ? 'verified' : 'unverified'} 
                  onValueChange={handleVerificationChange}
                >
                  <SelectTrigger className="w-36 font-pixel-body">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="font-pixel-body">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="all" className="mb-6">
          <div className="flex justify-between items-center">
            <TabsList className="font-pixel-body">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="new">New Users</TabsTrigger>
            </TabsList>
            
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-pixel-body text-muted-foreground">
                  {selectedUsers.length} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="font-pixel-body"
                  onClick={() => handleBulkOperation('email')}
                >
                  <Mail className="mr-1 h-4 w-4" />
                  Email
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="font-pixel-body"
                  onClick={() => handleBulkOperation('verify')}
                >
                  <Shield className="mr-1 h-4 w-4" />
                  Verify
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="font-pixel-body text-danger hover:text-danger"
                  onClick={() => handleBulkOperation('delete')}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
          
          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <>
                <DataTable 
                  columns={columns} 
                  data={users}
                  enableRowSelection
                  onRowSelectionChange={handleRowSelectionChange}
                  pagination={{
                    pageCount: Math.ceil(totalUsers / pagination.perPage),
                    pageIndex: pagination.page - 1,
                    onPageChange: (pageIndex) => handlePageChange(pageIndex + 1)
                  }}
                  noDataText="No users found"
                />
                
                <div className="flex justify-between items-center mt-4 text-sm font-pixel-body text-muted-foreground">
                  <div>
                    Showing {users.length} of {totalUsers} users
                  </div>
                  <div>
                    Page {pagination.page} of {Math.ceil(totalUsers / pagination.perPage)}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <div className="flex justify-center items-center h-32 text-muted-foreground font-pixel-body">
              Switch to "All Users" tab to view users with active filter
            </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-6">
            <div className="flex justify-center items-center h-32 text-muted-foreground font-pixel-body">
              Switch to "All Users" tab to view users with inactive filter
            </div>
          </TabsContent>
          
          <TabsContent value="new" className="mt-6">
            <div className="flex justify-center items-center h-32 text-muted-foreground font-pixel-body">
              Switch to "All Users" tab to view recently joined users
            </div>
          </TabsContent>
        </Tabs>
        
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg font-pixel-heading">User Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md text-center">
                <div className="text-2xl font-pixel-heading">{totalUsers}</div>
                <div className="text-sm text-muted-foreground font-pixel-body">Total Users</div>
              </div>
              <div className="p-4 border rounded-md text-center">
                <div className="text-2xl font-pixel-heading">{isLoading ? '...' : '85%'}</div>
                <div className="text-sm text-muted-foreground font-pixel-body">Verification Rate</div>
              </div>
              <div className="p-4 border rounded-md text-center">
                <div className="text-2xl font-pixel-heading">{isLoading ? '...' : '24'}</div>
                <div className="text-sm text-muted-foreground font-pixel-body">New this week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

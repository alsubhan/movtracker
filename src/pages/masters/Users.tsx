import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserIcon, PlusCircle, Pencil, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Permission, PermissionKey, PartialFormData } from '@/types/index';
import { PERMISSIONS, getPermissionsForRole, hasPermission, permissionsList as allPermissions } from '@/utils/permissions';
import { supabase } from '@/lib/supabase';

// Helper to format date as dd/mm/yyyy
const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const ROLES = ['admin', 'user', 'operator'] as const;
type UserRole = typeof ROLES[number];
const roles = ROLES;

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<PartialFormData>(initializeFormData());
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // Initialize permissionsList with all permissions
  const [permissionsList, setPermissionsList] = useState<Permission[]>(allPermissions);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [canCreateUsers, setCanCreateUsers] = useState(false);
  // Active tab: can be main tabs or dialog tabs
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'details' | 'permissions'>('users');

  const getAllPermissions = () => Object.keys(PERMISSIONS) as PermissionKey[];

  const loadPermissions = (role: UserRole): Permission[] => {
    return role === 'admin' ? permissionsList : getPermissionsForRole(role);
  };

  function initializeFormData(user?: User): PartialFormData {
    const role = user?.role || 'user';
    const permissions = user?.permissions || [];
    return {
      id: user?.id || '',
      full_name: user?.full_name || '',
      username: user?.username || '',
      role: role as UserRole,
      status: user?.status || 'active',
      createdAt: user?.createdAt || new Date().toISOString(),
      permissions: permissions,
      password: '',
      customer_location_id: user?.customer_location_id || ''
    };
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'role') {
      const typedRole = value as UserRole;
      setFormData((prev) => ({
        ...prev,
        [name]: typedRole,
        permissions: loadPermissions(typedRole)
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePermissionChange = (permissionName: PermissionKey, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permissionsList.find(p => p.name === permissionName)!]
        : (prev.permissions || []).filter(p => p.name !== permissionName)
    }));
  };

  const resetForm = () => {
    setFormData(initializeFormData());
    setIsEditing(false);
    setActiveTab('users');
  };

  const handleEditUser = (user: User) => {
    // For editing, load full permissions based on role
    setFormData({
      ...user,
      permissions: loadPermissions(user.role as UserRole),
      password: ''
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      toast({
        title: 'Error',
        description: 'You cannot delete your own account',
        variant: 'destructive',
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', id);
      if (error) throw error;
      await fetchUsers();
      toast({
        title: 'User Status Updated',
        description: 'User has been marked as inactive',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating user',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditing) {
        // update and return rows to verify success
        const { data: updated, error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            status: formData.status,
            customer_location_id: formData.customer_location_id
          })
          .eq('id', formData.id)
          .select();
        console.log('Profile update result:', updated, error);
        if (error) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
          throw error;
        }
        if (!updated || updated.length === 0) {
          toast({
            title: 'Warning',
            description: 'No record updated. Check your RLS policy or ID field.',
            variant: 'destructive',
          });
        }
      } else {
        // use built-in crypto for UUIDs
        const newId = crypto.randomUUID();
        const { data: created, error } = await supabase
          .from('profiles')
          .insert([{ id: newId, full_name: formData.full_name, username: formData.username, password: formData.password,
                     role: formData.role, status: formData.status, customer_location_id: formData.customer_location_id }])
          .select();
        console.log('Profile insert result:', created, error);
        if (error) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
          throw error;
        }
        if (!created || created.length === 0) {
          toast({ title: 'Warning', description: 'No record created.', variant: 'destructive' });
        }
      }
      toast({
        title: isEditing ? 'User Updated' : 'User Created',
        description: isEditing ? 'User details have been updated' : 'New user has been created',
      });
      resetForm();
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('customer_locations')
          .select('id, location_name')
          .order('location_name');

        if (error) throw error;
        
        setLocations(data?.map(loc => ({
          id: loc.id,
          name: loc.location_name
        })) || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({
          title: "Error",
          description: "Failed to load locations",
          variant: "destructive"
        });
      }
    };

    loadLocations();
  }, [toast]);

  useEffect(() => {
    const checkUserPermissions = async () => {
      if (currentUser?.role === 'admin') {
        // Admin users automatically have all permissions
        setCanCreateUsers(true);
      } else if (currentUser?.permissions) {
        const hasManageUsersPermission = hasPermission(currentUser.role, PERMISSIONS.MANAGE_USERS);
        setCanCreateUsers(hasManageUsersPermission);
      }
    };
    
    checkUserPermissions();
  }, [currentUser]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedSession = localStorage.getItem('session');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          const now = new Date().getTime();
          if (now <= sessionData.expiresAt) {
            setCurrentUser(sessionData.user);
            // Check permissions immediately after setting current user
            const hasManageUsersPermission = hasPermission(sessionData.user.role, PERMISSIONS.MANAGE_USERS);
            setCanCreateUsers(hasManageUsersPermission);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Removed redundant effect: permissionsList is initialized above

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load users",
          variant: "destructive"
        });
        throw error;
      }

      if (data) {
        const usersWithPermissions = data.map(user => ({
          ...user,
          // Map Supabase 'created_at' to 'createdAt' for display
          createdAt: user.created_at,
          permissions: loadPermissions(user.role as UserRole)
        }));
        setUsers(usersWithPermissions);
      } else {
        console.warn("No users found in profiles table");
      }
    } finally {
      setLoading(false);
    }
  };

  const hasManageUsersPermission = () => {
    return hasPermission(currentUser?.role || '', PERMISSIONS.MANAGE_USERS);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Users
          </CardTitle>
          <CardDescription>
            Manage user accounts and their permissions
          </CardDescription>
          <Button variant="default" onClick={() => { resetForm(); setActiveTab('details'); setIsDialogOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          {user.full_name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === "admin"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : user.role === "operator"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.status === "active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 flex items-center text-xs"
                          onClick={() => {
                            handleEditUser(user);
                            setActiveTab("permissions");
                          }}
                          disabled={!canCreateUsers}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1" />
                          {user.permissions?.length || 0} permissions
                        </Button>
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {canCreateUsers && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                handleEditUser(user);
                                setActiveTab("details");
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.id === currentUser?.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit User" : "New User"}</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" value={formData.full_name || ""} onChange={handleInputChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" value={formData.username || ""} onChange={handleInputChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role!} onValueChange={v => handleSelectChange("role", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status!} onValueChange={v => handleSelectChange("status", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer_location_id">Customer Location</Label>
                  <Select value={formData.customer_location_id || ""} onValueChange={v => handleSelectChange("customer_location_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="permissions">
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                {permissionsList.map(p => (
                  <Label key={p.id} className="flex items-center space-x-2">
                    <Checkbox checked={!!formData.permissions?.find(x => x.name === p.name)} onCheckedChange={checked => handlePermissionChange(p.name, checked as boolean)} />
                    <span>{p.description}</span>
                  </Label>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{isEditing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;

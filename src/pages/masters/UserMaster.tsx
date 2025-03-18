
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
import { User } from "@/types";
import { getPermissionsForRole, permissionsList } from "@/utils/permissions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const UserMaster = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<User & { password?: string, username?: string }>({
    id: "",
    name: "",
    email: "",
    role: "user",
    status: "active",
    createdAt: new Date(),
    permissions: [],
    password: "",
    username: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedUsers: User[] = data.map(profile => ({
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || 'No email',
          role: profile.role as 'admin' | 'user' | 'operator',
          status: profile.status as 'active' | 'inactive',
          createdAt: new Date(profile.created_at),
          permissions: getPermissionsForRole(profile.role as 'admin' | 'user' | 'operator')
        }));
        
        setUsers(formattedUsers);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'role') {
      // Ensure role is of the correct type
      const typedRole = value as 'admin' | 'user' | 'operator';
      // When role changes, update permissions based on role
      setFormData((prev) => ({
        ...prev,
        [name]: typedRole,
        permissions: getPermissionsForRole(typedRole)
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => {
      const currentPermissions = [...(prev.permissions || [])];
      
      if (checked && !currentPermissions.includes(permission)) {
        return { ...prev, permissions: [...currentPermissions, permission] };
      } else if (!checked && currentPermissions.includes(permission)) {
        return { 
          ...prev, 
          permissions: currentPermissions.filter(p => p !== permission) 
        };
      }
      
      return prev;
    });
  };

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      role: "user",
      status: "active",
      createdAt: new Date(),
      permissions: getPermissionsForRole("user"),
      password: "",
    });
    setIsEditing(false);
    setActiveTab("details");
  };

  const handleEditUser = (user: User) => {
    // Extract username from email (email format is username@example.com)
    const username = user.email.split('@')[0];
    
    setFormData({...user, password: "", username});
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    // Don't allow deleting yourself
    if (id === currentUser?.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(id);
      
      if (error) throw error;
      
      await fetchUsers();
      
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // Update existing user
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: formData.status,
          })
          .eq('id', formData.id);
        
        if (profileError) throw profileError;
        
        // If password is provided, update it
        if (formData.password) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            formData.id,
            { password: formData.password }
          );
          
          if (passwordError) throw passwordError;
        }
        
        toast({
          title: "User Updated",
          description: "User has been updated successfully",
        });
      } else {
        // Create a new user
        if (!formData.username || !formData.password) {
          toast({
            title: "Error",
            description: "Username and password are required for new users",
            variant: "destructive",
          });
          return;
        }
        
        // Create user in auth with username@example.com format for the email
        const email = `${formData.username}@example.com`;
        
        // Create user in auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            name: formData.name,
          }
        });
        
        if (authError) throw authError;
        
        // Update the profile with the correct role
        if (authData?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              role: formData.role,
              status: formData.status,
            })
            .eq('id', authData.user.id);
          
          if (profileError) throw profileError;
        }
        
        toast({
          title: "User Added",
          description: "New user has been added successfully",
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Only admins can create users
  const canCreateUsers = currentUser?.role === 'admin';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">User Master</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts and access permissions
            </CardDescription>
          </div>
          {canCreateUsers && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? "Edit User" : "Add New User"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditing
                        ? "Update user details and permissions"
                        : "Create a new user account"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">User Details</TabsTrigger>
                      <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="py-4">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter full name"
                            required
                          />
                        </div>
                        {!isEditing && (
                          <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              name="username"
                              value={formData.username || ""}
                              onChange={handleInputChange}
                              placeholder="Enter username"
                              required
                            />
                          </div>
                        )}
                        {isEditing && (
                          <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              name="username"
                              value={formData.username || ""}
                              onChange={handleInputChange}
                              placeholder="Username"
                              disabled
                            />
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="password">
                            {isEditing ? "Password (leave blank to keep current)" : "Password"}
                          </Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password || ""}
                            onChange={handleInputChange}
                            placeholder={isEditing ? "Leave blank to keep current password" : "Create a password"}
                            required={!isEditing}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                              value={formData.role}
                              onValueChange={(value) =>
                                handleSelectChange("role", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="operator">Operator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value) =>
                                handleSelectChange("status", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="permissions" className="py-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-medium">Role-Based Permissions</h3>
                            <p className="text-xs text-muted-foreground">
                              The selected role ({formData.role}) has default permissions.
                              You can customize them below.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Reset permissions to default for the role
                              setFormData(prev => ({
                                ...prev,
                                permissions: getPermissionsForRole(prev.role)
                              }));
                            }}
                          >
                            Reset to Defaults
                          </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {permissionsList.map((permission) => (
                            <div key={permission.id} className="flex items-start space-x-2 p-2 rounded border">
                              <Checkbox 
                                id={`permission-${permission.id}`}
                                checked={formData.permissions?.includes(permission.name)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.name, checked === true)
                                }
                              />
                              <div className="grid gap-1.5">
                                <Label 
                                  htmlFor={`permission-${permission.id}`}
                                  className="font-medium"
                                >
                                  {permission.description}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Modules: {permission.modules.join(', ')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter className="mt-4">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isEditing ? "Update User" : "Add User"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
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
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.email.split('@')[0]}</TableCell>
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
                        {user.createdAt.toLocaleDateString()}
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
    </div>
  );
};

export default UserMaster;


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

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<User & { password?: string }>({
    id: "",
    full_name: "",
    username: "",
    role: "user",
    status: "active",
    createdAt: new Date(),
    permissions: [],
    password: "",
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
      console.log("Fetching users from profiles table...");
      
      // Use simpler query without RLS checks that might cause issues
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      
      console.log("Fetched data:", data);
      
      if (data) {
        const formattedUsers: User[] = data.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || 'Unknown',
          username: profile.username,
          role: profile.role as 'admin' | 'user' | 'operator',
          status: profile.status as 'active' | 'inactive',
          createdAt: new Date(profile.created_at),
          permissions: getPermissionsForRole(profile.role as 'admin' | 'user' | 'operator')
        }));
        
        setUsers(formattedUsers);
      }
    } catch (error: any) {
      console.error("Error in fetchUsers:", error);
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
      full_name: "",
      username: "",
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
    setFormData({...user, password: ""});
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
      // Instead of deleting from auth, just update the profile status
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchUsers();
      
      toast({
        title: "User Status Updated",
        description: "User has been marked as inactive",
      });
    } catch (error: any) {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // Update existing user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            status: formData.status,
          })
          .eq('id', formData.id);
        
        if (profileError) throw profileError;
        
        toast({
          title: "User Updated",
          description: "User has been updated successfully",
        });
      } else {
        // For new users in demo mode, create directly in profiles table with a UUID
        const newUserId = crypto.randomUUID();
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            full_name: formData.full_name,
            username: formData.username,
            password: "demopassword", // Demo password
            role: formData.role,
            status: formData.status,
            created_at: new Date().toISOString()
          });
        
        if (profileError) throw profileError;
        
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

  // Set a default admin if no users exist
  useEffect(() => {
    const checkAndCreateDefaultAdmin = async () => {
      // Only run if users array is empty and we're not currently loading
      if (users.length === 0 && !loading) {
        try {
          console.log("No users found, creating default admin user...");
          const adminId = crypto.randomUUID();
          
          const { data: existingAdmin, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', 'admin')
            .maybeSingle();
            
          if (checkError) {
            console.error("Error checking for existing admin:", checkError);
            throw checkError;
          }
          
          if (existingAdmin) {
            console.log("Admin already exists, skipping creation");
            return;
          }
          
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: adminId,
              full_name: 'Admin User',
              username: 'admin',
              password: 'adminpassword', // Demo password
              role: 'admin',
              status: 'active',
              created_at: new Date().toISOString()
            });
          
          if (error) {
            console.error("Error creating default admin:", error);
            throw error;
          }
          
          console.log("Default admin created successfully with ID:", adminId);
          
          toast({
            title: "Default Admin Created",
            description: "A default admin user has been added",
          });
          
          fetchUsers();
        } catch (error: any) {
          console.error("Error creating default admin:", error);
          toast({
            title: "Error",
            description: "Could not create default admin: " + error.message,
            variant: "destructive",
          });
        }
      }
    };
    
    checkAndCreateDefaultAdmin();
  }, [users, loading]);

  // Only admins can create users
  const canCreateUsers = currentUser?.role === 'admin';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
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
                          <Label htmlFor="full_name">Name</Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name || ""}
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
                        {isEditing && (
                          <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              name="password"
                              type="password"
                              value={formData.password || ""}
                              onChange={handleInputChange}
                              placeholder="Not editable in demo mode"
                              disabled
                            />
                            <p className="text-xs text-muted-foreground">
                              Password cannot be changed in demo mode
                            </p>
                          </div>
                        )}
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

export default Users;

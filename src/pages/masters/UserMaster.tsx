
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
import { User as UserIcon, PlusCircle, Pencil, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/types";
import { getPermissionsForRole, permissionsList } from "@/utils/permissions";

// Mock data
const initialUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date("2023-01-15"),
    permissions: getPermissionsForRole("admin"),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "user",
    status: "active",
    createdAt: new Date("2023-02-20"),
    permissions: getPermissionsForRole("user"),
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "operator",
    status: "inactive",
    createdAt: new Date("2023-03-10"),
    permissions: getPermissionsForRole("operator"),
  },
];

const UserMaster = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<User>({
    id: "",
    name: "",
    email: "",
    role: "user",
    status: "active",
    createdAt: new Date(),
    permissions: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'role') {
      // When role changes, update permissions based on role
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        permissions: getPermissionsForRole(value as 'admin' | 'user' | 'operator')
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
    });
    setIsEditing(false);
    setActiveTab("details");
  };

  const handleEditUser = (user: User) => {
    setFormData(user);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((user) => user.id !== id));
    toast({
      title: "User Deleted",
      description: "User has been deleted successfully",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      setUsers(users.map((user) => (user.id === formData.id ? { ...formData, createdAt: user.createdAt } : user)));
      toast({
        title: "User Updated",
        description: "User has been updated successfully",
      });
    } else {
      const newUser = {
        ...formData,
        id: String(users.length + 1),
        createdAt: new Date(),
      };
      setUsers([...users, newUser]);
      toast({
        title: "User Added",
        description: "New user has been added successfully",
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

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
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="email@example.com"
                          required
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
                              permissions: getPermissionsForRole(prev.role as 'admin' | 'user' | 'operator')
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
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
                    >
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      {user.permissions?.length || 0} permissions
                    </Button>
                  </TableCell>
                  <TableCell>
                    {user.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserMaster;

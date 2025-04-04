
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InventoryType } from "@/types";

// Mock data for inventory types
const initialInventoryTypes: InventoryType[] = [
  { 
    id: "1", 
    code: "PLT", 
    name: "Pallet", 
    description: "Standard wooden pallet", 
    status: "active" 
  },
  { 
    id: "2", 
    code: "BIN", 
    name: "Bin", 
    description: "Storage bin container", 
    status: "active" 
  },
  { 
    id: "3", 
    code: "BOX", 
    name: "Box", 
    description: "Cardboard box container", 
    status: "active" 
  },
];

const InventoryTypes = () => {
  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>(initialInventoryTypes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<InventoryType>({
    id: "",
    code: "",
    name: "",
    description: "",
    status: "active",
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: "",
      code: "",
      name: "",
      description: "",
      status: "active",
    });
    setIsEditing(false);
  };

  const handleEditInventoryType = (inventoryType: InventoryType) => {
    setFormData(inventoryType);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteInventoryType = (id: string) => {
    setInventoryTypes(inventoryTypes.filter((type) => type.id !== id));
    toast({
      title: "Inventory Type Deleted",
      description: "Inventory type has been deleted successfully",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.code.length !== 3) {
      toast({
        title: "Invalid Code",
        description: "Type code must be exactly 3 characters",
        variant: "destructive",
      });
      return;
    }

    // Check if code already exists (when adding new or editing with different code)
    const codeExists = inventoryTypes.some(
      type => type.code === formData.code && (!isEditing || type.id !== formData.id)
    );

    if (codeExists) {
      toast({
        title: "Code Already Exists",
        description: "Please use a unique type code",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditing) {
      setInventoryTypes(
        inventoryTypes.map((type) =>
          type.id === formData.id ? { ...formData } : type
        )
      );
      toast({
        title: "Inventory Type Updated",
        description: "Inventory type has been updated successfully",
      });
    } else {
      const newInventoryType: InventoryType = {
        ...formData,
        id: `${inventoryTypes.length + 1}`,
      };
      
      setInventoryTypes([...inventoryTypes, newInventoryType]);
      toast({
        title: "Inventory Type Added",
        description: `New inventory type ${formData.name} has been added successfully`,
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const filteredInventoryTypes = inventoryTypes.filter((type) => {
    const searchableValues = [
      type.code,
      type.name,
      type.description,
    ].join(" ").toLowerCase();
    
    return searchableValues.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Types</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventory Types</CardTitle>
            <CardDescription>
              Manage inventory types and their tracking information
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search types..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                  Add Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? "Edit Inventory Type" : "Add New Inventory Type"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditing
                        ? "Update inventory type details"
                        : "Create a new inventory type"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="code">Type Code (3)</Label>
                        <Input
                          id="code"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          placeholder="e.g. PLT"
                          maxLength={3}
                          pattern="[A-Za-z0-9]{3}"
                          title="3 characters (letters and numbers only)"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="name">Type Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Pallet"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter description"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="status">Status: </Label>
                      <Switch
                        id="status"
                        checked={formData.status === "active"}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: checked ? "active" : "inactive",
                          }))
                        }
                      />
                      <span>{formData.status === "active" ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isEditing ? "Update" : "Add"} Inventory Type
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventoryTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No inventory types found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventoryTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.code}</TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          type.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {type.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditInventoryType(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInventoryType(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryTypes;

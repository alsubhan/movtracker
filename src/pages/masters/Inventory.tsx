
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Box, PlusCircle, Pencil, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Customer, Location } from "@/types";

// Mock data
const initialInventory = [
  {
    id: "1",
    customer: "TOY",
    project: "1001",
    partition: "08",
    serialNumber: "001",
    status: "in-stock",
    location: "warehouse",
    lastScanTime: new Date("2023-06-15T10:30:00"),
    lastScanGate: "Gate 1",
    createdAt: new Date("2023-01-10"),
  },
  {
    id: "2",
    customer: "HON",
    project: "2001",
    partition: "04",
    serialNumber: "002",
    status: "in-wip",
    location: "wip",
    lastScanTime: new Date("2023-06-16T11:45:00"),
    lastScanGate: "Gate 3",
    createdAt: new Date("2023-01-12"),
  },
  {
    id: "3",
    customer: "NIS",
    project: "3001",
    partition: "02",
    serialNumber: "003",
    status: "dispatched",
    location: "customer",
    lastScanTime: new Date("2023-06-17T09:15:00"),
    lastScanGate: "Gate 2",
    createdAt: new Date("2023-01-15"),
  },
];

// Mock locations for demo
const mockLocations: Location[] = [
  { id: "1", name: "Main Warehouse", description: "Main storage facility", status: "active" },
  { id: "2", name: "Production Line A", description: "Assembly line A", status: "active" },
  { id: "3", name: "Customer Site", description: "Client location", status: "active" },
];

// Mock customer data
const mockCustomers: Customer[] = [
  { id: "1", code: "TOY", name: "Toyota", contact_person: "John Smith", phone: "555-1234", email: "john@toyota.com", status: "Active" },
  { id: "2", code: "HON", name: "Honda", contact_person: "Jane Doe", phone: "555-2345", email: "jane@honda.com", status: "Active" },
  { id: "3", code: "NIS", name: "Nissan", contact_person: "Bob Johnson", phone: "555-3456", email: "bob@nissan.com", status: "Active" },
  { id: "4", code: "FOR", name: "Ford", contact_person: "Alice Williams", phone: "555-4567", email: "alice@ford.com", status: "Inactive" },
  { id: "5", code: "TES", name: "Tesla", contact_person: "Mark Davis", phone: "555-5678", email: "mark@tesla.com", status: "Active" },
];

const Inventory = () => {
  const [inventory, setInventory] = useState(initialInventory);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    customer: "",
    project: "",
    partition: "",
    serialNumber: "",
    status: "in-stock",
    location: "warehouse",
    lastScanGate: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const { toast } = useToast();

  // Filter out inactive customers and locations
  const activeCustomers = customers.filter(customer => customer.status === "Active");
  const activeLocations = locations.filter(location => location.status === "active");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: "",
      customer: "",
      project: "",
      partition: "",
      serialNumber: "",
      status: "in-stock",
      location: "warehouse",
      lastScanGate: "",
    });
    setIsEditing(false);
  };

  const handleEditProduct = (product: any) => {
    setFormData(product);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setInventory(inventory.filter((product) => product.id !== id));
    toast({
      title: "Product Deleted",
      description: "Product has been deleted successfully",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate product ID based on customer, project, partition, and serial number
    const productId = `${formData.customer}${formData.project}${formData.partition}${formData.serialNumber}`;
    
    if (isEditing) {
      setInventory(
        inventory.map((product) =>
          product.id === formData.id
            ? {
                ...formData,
                lastScanTime: product.lastScanTime,
                createdAt: product.createdAt,
              }
            : product
        )
      );
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully",
      });
    } else {
      const newProduct = {
        ...formData,
        id: productId, // Using the generated productId instead of a sequential number
        lastScanTime: new Date(),
        createdAt: new Date(),
      };
      setInventory([...inventory, newProduct]);
      toast({
        title: "Product Added",
        description: `New product ${productId} has been added successfully`,
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const filteredInventory = inventory.filter((product) => {
    const productId = `${product.customer}${product.project}${product.partition}${product.serialNumber}`;
    const searchableValues = [
      product.customer,
      product.project,
      productId,
    ].join(" ").toLowerCase();
    
    return searchableValues.includes(searchTerm.toLowerCase());
  });

  // Get customer name from code
  const getCustomerName = (code: string) => {
    const customer = customers.find(c => c.code === code);
    return customer ? customer.name : code;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>
              Manage inventory and their tracking information
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search inventory..."
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
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditing
                        ? "Update product details and tracking information"
                        : "Create a new product with tracking information"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="customer">Customer</Label>
                      <Select
                        value={formData.customer}
                        onValueChange={(value) => handleSelectChange("customer", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.code}>
                              {customer.name} ({customer.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="project">Project (4)</Label>
                        <Input
                          id="project"
                          name="project"
                          value={formData.project}
                          onChange={handleInputChange}
                          placeholder="e.g. 1001"
                          maxLength={4}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="partition">Partition (2)</Label>
                        <Input
                          id="partition"
                          name="partition"
                          value={formData.partition}
                          onChange={handleInputChange}
                          placeholder="e.g. 08"
                          maxLength={2}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="serialNumber">Serial Number (3)</Label>
                        <Input
                          id="serialNumber"
                          name="serialNumber"
                          value={formData.serialNumber}
                          onChange={handleInputChange}
                          placeholder="e.g. 001"
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="in-stock">In Stock</SelectItem>
                            <SelectItem value="in-wip">In WIP</SelectItem>
                            <SelectItem value="dispatched">Dispatched</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Select
                          value={formData.location}
                          onValueChange={(value) =>
                            handleSelectChange("location", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeLocations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="grid gap-2">
                        <Label htmlFor="lastScanGate">Last Scan Gate</Label>
                        <Input
                          id="lastScanGate"
                          name="lastScanGate"
                          value={formData.lastScanGate}
                          onChange={handleInputChange}
                          placeholder="Gate number"
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isEditing ? "Update Product" : "Add Product"}
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
                <TableHead>Product ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Scan</TableHead>
                <TableHead>Gate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((product) => {
                const productId = `${product.customer}${product.project}${product.partition}${product.serialNumber}`;
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-muted-foreground" />
                        {productId}
                      </div>
                    </TableCell>
                    <TableCell>{getCustomerName(product.customer)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          product.status === "in-stock"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : product.status === "in-wip"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : product.status === "dispatched"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {product.status === "in-stock"
                          ? "In Stock"
                          : product.status === "in-wip"
                          ? "In WIP"
                          : product.status === "dispatched"
                          ? "Dispatched"
                          : "Damaged"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.location === "warehouse"
                          ? "Warehouse"
                          : product.location === "wip"
                          ? "WIP"
                          : "Customer"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.lastScanTime.toLocaleString()}
                    </TableCell>
                    <TableCell>{product.lastScanGate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;

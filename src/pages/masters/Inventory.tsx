
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    inventoryType: "PLT",
    companyCode: "ABC",
    rentalCost: 50.00,
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
    inventoryType: "BIN",
    companyCode: "ABC",
    rentalCost: 75.00,
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
    inventoryType: "BOX",
    companyCode: "ABC",
    rentalCost: 25.00,
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

// Mock inventory types
const mockInventoryTypes = [
  { id: "1", code: "PLT", name: "Pallet", status: "active" },
  { id: "2", code: "BIN", name: "Bin", status: "active" },
  { id: "3", code: "BOX", name: "Box", status: "active" },
];

// Mock company codes
const mockCompanyCodes = [
  { code: "ABC", name: "ACME Corporation" },
  { code: "XYZ", name: "XYZ Industries" },
  { code: "DEF", name: "DEF Enterprises" },
];

const Inventory = () => {
  const [inventory, setInventory] = useState(initialInventory);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("inventory");
  const [codeType, setCodeType] = useState<"customer" | "type" | "company">("customer");
  const [formData, setFormData] = useState({
    id: "",
    customer: "",
    project: "",
    partition: "",
    serialNumber: "",
    status: "in-stock",
    location: "warehouse",
    inventoryType: "",
    companyCode: "ABC",
    rentalCost: 50,
    lastScanGate: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [inventoryTypes, setInventoryTypes] = useState(mockInventoryTypes);
  const [companyCodes, setCompanyCodes] = useState(mockCompanyCodes);
  const { toast } = useToast();

  // Filter out inactive customers and locations
  const activeCustomers = customers.filter(customer => customer.status === "Active");
  const activeLocations = locations.filter(location => location.status === "active");
  const activeInventoryTypes = inventoryTypes.filter(type => type.status === "active");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For rental cost, convert to number
    if (name === "rentalCost") {
      const numValue = parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
      inventoryType: "",
      companyCode: "ABC",
      rentalCost: 50,
      lastScanGate: "",
    });
    setCodeType("customer");
    setIsEditing(false);
  };

  const handleEditInventory = (inventory: any) => {
    setFormData(inventory);
    // Set code type based on which code is being used
    if (inventory.customer) {
      setCodeType("customer");
    } else if (inventory.inventoryType) {
      setCodeType("type");
    } else if (inventory.companyCode) {
      setCodeType("company");
    }
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteInventory = (id: string) => {
    setInventory(inventory.filter((inventory) => inventory.id !== id));
    toast({
      title: "Inventory Deleted",
      description: "Inventory has been deleted successfully",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine which code to use based on the selected code type
    let codePrefix;
    switch (codeType) {
      case "customer":
        codePrefix = formData.customer;
        break;
      case "type":
        codePrefix = formData.inventoryType;
        break;
      case "company":
        codePrefix = formData.companyCode;
        break;
    }
    
    // Generate inventory ID based on code prefix, project, partition, and serial number
    const inventoryId = `${codePrefix}${formData.project}${formData.partition}${formData.serialNumber}`;
    
    if (isEditing) {
      setInventory(
        inventory.map((inventory) =>
          inventory.id === formData.id
            ? {
                ...formData,
                id: inventoryId,
                lastScanTime: inventory.lastScanTime,
                createdAt: inventory.createdAt,
              }
            : inventory
        )
      );
      toast({
        title: "Inventory Updated",
        description: "Inventory has been updated successfully",
      });
    } else {
      const newInventory = {
        ...formData,
        id: inventoryId, // Using the generated inventoryId
        lastScanTime: new Date(),
        createdAt: new Date(),
      };
      setInventory([...inventory, newInventory]);
      toast({
        title: "Inventory Added",
        description: `New inventory ${inventoryId} has been added successfully`,
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const filteredInventory = inventory.filter((inventory) => {
    const inventoryId = `${inventory.customer || inventory.inventoryType || inventory.companyCode}${inventory.project}${inventory.partition}${inventory.serialNumber}`;
    const searchableValues = [
      inventory.customer,
      inventory.inventoryType,
      inventory.companyCode,
      inventory.project,
      inventoryId,
    ].join(" ").toLowerCase();
    
    return searchableValues.includes(searchTerm.toLowerCase());
  });

  // Get customer name from code
  const getCustomerName = (code: string) => {
    const customer = customers.find(c => c.code === code);
    return customer ? customer.name : code;
  };

  // Get inventory type name from code
  const getTypeName = (code: string) => {
    const type = inventoryTypes.find(t => t.code === code);
    return type ? type.name : code;
  };

  // Get company name from code
  const getCompanyName = (code: string) => {
    const company = companyCodes.find(c => c.code === code);
    return company ? company.name : code;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="types">Inventory Types</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
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
                      Add Inventory
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle>
                          {isEditing ? "Edit Inventory" : "Add New Inventory"}
                        </DialogTitle>
                        <DialogDescription>
                          {isEditing
                            ? "Update inventory details and tracking information"
                            : "Create a new inventory with tracking information"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {/* Code Type Selection */}
                        <div className="grid gap-2">
                          <Label>Code Type</Label>
                          <RadioGroup 
                            value={codeType} 
                            onValueChange={(value) => setCodeType(value as "customer" | "type" | "company")}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="customer" id="customer" />
                              <label htmlFor="customer" className="cursor-pointer">Customer Code</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="type" id="type" />
                              <label htmlFor="type" className="cursor-pointer">Type Code</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="company" id="company" />
                              <label htmlFor="company" className="cursor-pointer">Company Code</label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Code Selection based on type */}
                        {codeType === "customer" && (
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
                        )}

                        {codeType === "type" && (
                          <div className="grid gap-2">
                            <Label htmlFor="inventoryType">Inventory Type</Label>
                            <Select
                              value={formData.inventoryType}
                              onValueChange={(value) => handleSelectChange("inventoryType", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select inventory type" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeInventoryTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.code}>
                                    {type.name} ({type.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {codeType === "company" && (
                          <div className="grid gap-2">
                            <Label htmlFor="companyCode">Company</Label>
                            <Select
                              value={formData.companyCode}
                              onValueChange={(value) => handleSelectChange("companyCode", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                              <SelectContent>
                                {companyCodes.map((company, index) => (
                                  <SelectItem key={index} value={company.code}>
                                    {company.name} ({company.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

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
                        <div className="grid grid-cols-3 gap-4">
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
                          <div className="grid gap-2">
                            <Label htmlFor="rentalCost">Rental Cost/Month</Label>
                            <Input
                              id="rentalCost"
                              name="rentalCost"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.rentalCost}
                              onChange={handleInputChange}
                              placeholder="e.g. 50.00"
                            />
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
                          {isEditing ? "Update Inventory" : "Add Inventory"}
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
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Code Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rental/Month</TableHead>
                    <TableHead>Last Scan</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((inventory) => {
                    let codeType = '';
                    let codeName = '';
                    if (inventory.customer) {
                      codeType = 'Customer';
                      codeName = getCustomerName(inventory.customer);
                    } else if (inventory.inventoryType) {
                      codeType = 'Type';
                      codeName = getTypeName(inventory.inventoryType);
                    } else if (inventory.companyCode) {
                      codeType = 'Company';
                      codeName = getCompanyName(inventory.companyCode);
                    }
                    
                    const inventoryId = `${inventory.customer || inventory.inventoryType || inventory.companyCode}${inventory.project}${inventory.partition}${inventory.serialNumber}`;
                    
                    return (
                      <TableRow key={inventory.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            {inventoryId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">{codeType}</span>
                            <span>{codeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              inventory.status === "in-stock"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : inventory.status === "in-wip"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : inventory.status === "dispatched"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {inventory.status === "in-stock"
                              ? "In Stock"
                              : inventory.status === "in-wip"
                              ? "In WIP"
                              : inventory.status === "dispatched"
                              ? "Dispatched"
                              : "Damaged"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {inventory.location === "warehouse"
                              ? "Warehouse"
                              : inventory.location === "wip"
                              ? "WIP"
                              : "Customer"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${inventory.rentalCost ? inventory.rentalCost.toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell>
                          {inventory.lastScanTime.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditInventory(inventory)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteInventory(inventory.id)}
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
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Types</CardTitle>
              <CardDescription>
                Manage inventory types used in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Inventory types are managed in the Inventory Types page.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/inventory-types";
                }}
              >
                Go to Inventory Types
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;

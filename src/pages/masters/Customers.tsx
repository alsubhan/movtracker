
import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SelectValue, SelectTrigger, Select, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Update customer type to include locations with rental rates
type CustomerLocation = {
  id: string;
  locationId: string;
  locationName: string;
  rentalRates: {
    [key: string]: number; // Key is inventory type code, value is hourly rate
  }
};

// Extended Customer type
type ExtendedCustomer = Customer & {
  locations: CustomerLocation[];
};

// Sample data for demonstration
const demoCustomers: ExtendedCustomer[] = [
  { 
    id: "1", 
    code: "TOY", 
    name: "Toyota", 
    contact_person: "John Smith", 
    phone: "555-1234", 
    email: "john@toyota.com", 
    status: "Active",
    locations: [
      {
        id: "1",
        locationId: "1",
        locationName: "Toyota Factory A",
        rentalRates: { "PLT": 15, "CTN": 8, "CRT": 12 }
      },
      {
        id: "2",
        locationId: "3",
        locationName: "Toyota Distribution Center",
        rentalRates: { "PLT": 20, "CTN": 10, "CRT": 15 }
      }
    ]
  },
  { 
    id: "2", 
    code: "HON", 
    name: "Honda", 
    contact_person: "Jane Doe", 
    phone: "555-2345", 
    email: "jane@honda.com", 
    status: "Active",
    locations: [
      {
        id: "3",
        locationId: "2",
        locationName: "Honda Warehouse",
        rentalRates: { "PLT": 18, "CTN": 9, "CRT": 14 }
      }
    ]
  },
  { 
    id: "3", 
    code: "NIS", 
    name: "Nissan", 
    contact_person: "Bob Johnson", 
    phone: "555-3456", 
    email: "bob@nissan.com", 
    status: "Active",
    locations: [
      {
        id: "4",
        locationId: "4",
        locationName: "Nissan Plant",
        rentalRates: { "PLT": 16, "CTN": 8, "CRT": 12 }
      }
    ]
  },
  { 
    id: "4", 
    code: "FOR", 
    name: "Ford", 
    contact_person: "Alice Williams", 
    phone: "555-4567", 
    email: "alice@ford.com", 
    status: "Inactive",
    locations: []
  },
  { 
    id: "5", 
    code: "TES", 
    name: "Tesla", 
    contact_person: "Mark Davis", 
    phone: "555-5678", 
    email: "mark@tesla.com", 
    status: "Active",
    locations: [
      {
        id: "5",
        locationId: "5",
        locationName: "Tesla Factory",
        rentalRates: { "PLT": 25, "CTN": 12, "CRT": 18 }
      }
    ]
  },
];

// Mock locations for selection
const mockLocations = [
  { id: "1", name: "Toyota Factory A" },
  { id: "2", name: "Honda Warehouse" },
  { id: "3", name: "Toyota Distribution Center" },
  { id: "4", name: "Nissan Plant" },
  { id: "5", name: "Tesla Factory" },
  { id: "6", name: "Warehouse A" },
  { id: "7", name: "Distribution Center B" },
  { id: "8", name: "Factory C" },
];

// Mock inventory types for rental rates
const mockInventoryTypes = [
  { id: "1", code: "PLT", name: "Pallet" },
  { id: "2", code: "CTN", name: "Carton" },
  { id: "3", code: "CRT", name: "Crate" },
];

const Customers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<ExtendedCustomer[]>(demoCustomers);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState<ExtendedCustomer | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  
  // Location management
  const [newLocation, setNewLocation] = useState<string>("");
  const [locationRates, setLocationRates] = useState<{[key: string]: number}>({
    "PLT": 0,
    "CTN": 0,
    "CRT": 0
  });
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = () => {
    setCurrentCustomer({
      id: "",
      code: "",
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      status: "Active",
      locations: []
    });
    setIsDialogOpen(true);
    setActiveTab("details");
  };

  const handleEditCustomer = (customer: ExtendedCustomer) => {
    setCurrentCustomer(customer);
    setIsDialogOpen(true);
    setActiveTab("details");
  };

  const handleDeleteCustomer = (customer: ExtendedCustomer) => {
    setCurrentCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const customerData: ExtendedCustomer = {
      id: currentCustomer?.id || `${customers.length + 1}`,
      code: (formData.get("code") as string).toUpperCase(),
      name: formData.get("name") as string,
      contact_person: formData.get("contact_person") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      status: formData.get("status") as string,
      locations: currentCustomer?.locations || []
    };

    // Check if code already exists (except for the current customer being edited)
    const codeExists = customers.some(c => 
      c.code === customerData.code && c.id !== customerData.id
    );

    if (codeExists) {
      toast({
        title: "Error",
        description: `Customer code ${customerData.code} already exists.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate code format (3 characters)
    if (customerData.code.length !== 3) {
      toast({
        title: "Error",
        description: "Customer code must be exactly 3 characters.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      if (currentCustomer?.id) {
        // Update existing customer
        setCustomers(
          customers.map((c) => (c.id === currentCustomer.id ? customerData : c))
        );
        toast({
          title: "Customer Updated",
          description: `${customerData.name} has been updated successfully.`,
        });
      } else {
        // Add new customer
        setCustomers([...customers, customerData]);
        toast({
          title: "Customer Added",
          description: `${customerData.name} has been added successfully.`,
        });
      }
      setIsLoading(false);
      setIsDialogOpen(false);
    }, 500);
  };

  const handleConfirmDelete = () => {
    if (!currentCustomer) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setCustomers(customers.filter((c) => c.id !== currentCustomer.id));
      toast({
        title: "Customer Deleted",
        description: `${currentCustomer.name} has been deleted successfully.`,
      });
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }, 500);
  };

  const handleAddLocation = () => {
    if (!newLocation) {
      toast({
        title: "Error",
        description: "Please select a location.",
        variant: "destructive",
      });
      return;
    }

    if (!currentCustomer) return;

    // Check if location already exists for this customer
    const locationExists = currentCustomer.locations.some(
      loc => loc.locationId === newLocation
    );

    if (locationExists) {
      toast({
        title: "Error",
        description: "This location is already assigned to the customer.",
        variant: "destructive",
      });
      return;
    }

    const selectedLocation = mockLocations.find(loc => loc.id === newLocation);
    if (!selectedLocation) return;

    const newCustomerLocation: CustomerLocation = {
      id: `${Date.now()}`,
      locationId: newLocation,
      locationName: selectedLocation.name,
      rentalRates: { ...locationRates }
    };

    const updatedCustomer = {
      ...currentCustomer,
      locations: [...currentCustomer.locations, newCustomerLocation]
    };

    setCurrentCustomer(updatedCustomer);
    
    // If we're editing a customer that already exists in the list
    if (currentCustomer.id) {
      setCustomers(
        customers.map(c => c.id === currentCustomer.id ? updatedCustomer : c)
      );
    }

    // Reset form
    setNewLocation("");
    setLocationRates({
      "PLT": 0,
      "CTN": 0,
      "CRT": 0
    });

    toast({
      title: "Location Added",
      description: `${selectedLocation.name} has been added to ${currentCustomer.name}.`,
    });
  };

  const handleEditLocation = (locationId: string) => {
    if (!currentCustomer) return;
    
    const location = currentCustomer.locations.find(loc => loc.id === locationId);
    if (!location) return;
    
    setEditingLocationId(locationId);
    setNewLocation(location.locationId);
    setLocationRates(location.rentalRates);
    setIsLocationDialogOpen(true);
  };

  const handleUpdateLocation = () => {
    if (!currentCustomer || !editingLocationId) return;
    
    const selectedLocation = mockLocations.find(loc => loc.id === newLocation);
    if (!selectedLocation) return;
    
    const updatedLocations = currentCustomer.locations.map(loc => 
      loc.id === editingLocationId 
        ? {
            ...loc,
            locationId: newLocation,
            locationName: selectedLocation.name,
            rentalRates: { ...locationRates }
          }
        : loc
    );
    
    const updatedCustomer = {
      ...currentCustomer,
      locations: updatedLocations
    };
    
    setCurrentCustomer(updatedCustomer);
    
    // If we're editing a customer that already exists in the list
    if (currentCustomer.id) {
      setCustomers(
        customers.map(c => c.id === currentCustomer.id ? updatedCustomer : c)
      );
    }
    
    // Reset form and close dialog
    setNewLocation("");
    setLocationRates({
      "PLT": 0,
      "CTN": 0,
      "CRT": 0
    });
    setEditingLocationId(null);
    setIsLocationDialogOpen(false);
    
    toast({
      title: "Location Updated",
      description: `Location has been updated successfully.`,
    });
  };

  const handleDeleteLocation = (locationId: string) => {
    if (!currentCustomer) return;
    
    const updatedLocations = currentCustomer.locations.filter(
      loc => loc.id !== locationId
    );
    
    const updatedCustomer = {
      ...currentCustomer,
      locations: updatedLocations
    };
    
    setCurrentCustomer(updatedCustomer);
    
    // If we're editing a customer that already exists in the list
    if (currentCustomer.id) {
      setCustomers(
        customers.map(c => c.id === currentCustomer.id ? updatedCustomer : c)
      );
    }
    
    toast({
      title: "Location Removed",
      description: `Location has been removed from ${currentCustomer.name}.`,
    });
  };

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            Manage customer information in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="max-w-sm">
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[300px]"
              />
            </div>
            <Button onClick={handleAddCustomer}>
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.code}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.contact_person}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {customer.locations.length > 0 ? (
                            customer.locations.map((loc, idx) => (
                              <Badge key={idx} variant="outline" className="bg-muted">
                                <MapPin className="h-3 w-3 mr-1" /> {loc.locationName}
                              </Badge>
                            )).slice(0, 2)
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                          {customer.locations.length > 2 && (
                            <Badge variant="outline" className="bg-muted">
                              +{customer.locations.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            customer.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {currentCustomer?.id ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
            <DialogDescription>
              {currentCustomer?.id
                ? "Update customer details"
                : "Add a new customer to the system"}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Customer Details</TabsTrigger>
              <TabsTrigger value="locations">Locations & Rates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <form id="customerForm" onSubmit={handleSaveCustomer}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right">
                      Code (3)
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      defaultValue={currentCustomer?.code}
                      className="col-span-3"
                      maxLength={3}
                      required
                      placeholder="e.g. TOY"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={currentCustomer?.name}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact_person" className="text-right">
                      Contact Person
                    </Label>
                    <Input
                      id="contact_person"
                      name="contact_person"
                      defaultValue={currentCustomer?.contact_person}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={currentCustomer?.phone}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={currentCustomer?.email}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <select
                      id="status"
                      name="status"
                      defaultValue={currentCustomer?.status || "Active"}
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="locations">
              <div className="space-y-4 py-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="location">Location</Label>
                    <Select value={newLocation} onValueChange={setNewLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockLocations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddLocation}>Add Location</Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Rental Rates</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {mockInventoryTypes.map((type) => (
                      <div key={type.id} className="space-y-1">
                        <Label htmlFor={`rate-${type.code}`} className="text-xs">
                          {type.name} (₹/hour)
                        </Label>
                        <Input
                          id={`rate-${type.code}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={locationRates[type.code] || 0}
                          onChange={(e) => setLocationRates({
                            ...locationRates,
                            [type.code]: parseFloat(e.target.value) || 0
                          })}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  {currentCustomer?.locations && currentCustomer.locations.length > 0 ? (
                    <div className="space-y-2">
                      {currentCustomer.locations.map((loc) => (
                        <div key={loc.id} className="flex justify-between items-center p-2 rounded-md border">
                          <div>
                            <div className="font-medium flex items-center">
                              <MapPin className="h-4 w-4 mr-1" /> {loc.locationName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Rates: {Object.entries(loc.rentalRates).map(([type, rate]) => (
                                <span key={type} className="inline-flex items-center mr-2">
                                  <Tag className="h-3 w-3 mr-1" /> {type}: ₹{rate}/hour
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditLocation(loc.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => handleDeleteLocation(loc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No locations added</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add locations to set up rental rates for this customer
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            {activeTab === "details" ? (
              <Button type="submit" form="customerForm" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            ) : (
              <Button onClick={() => setActiveTab("details")}>
                Back to Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location details and rental rates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Select value={newLocation} onValueChange={setNewLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {mockLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rental Rates</h4>
              <div className="grid grid-cols-3 gap-2">
                {mockInventoryTypes.map((type) => (
                  <div key={type.id} className="space-y-1">
                    <Label htmlFor={`edit-rate-${type.code}`} className="text-xs">
                      {type.name} (₹/hour)
                    </Label>
                    <Input
                      id={`edit-rate-${type.code}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={locationRates[type.code] || 0}
                      onChange={(e) => setLocationRates({
                        ...locationRates,
                        [type.code]: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLocation}>
              Update Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentCustomer?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;

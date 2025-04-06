
import { useState, useEffect } from "react";
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
import { Customer, CustomerLocation, InventoryType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SelectValue, SelectTrigger, Select, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

// Mock inventory types for rental rates
const mockInventoryTypes: InventoryType[] = [
  { id: "1", code: "PLT", name: "Pallet", description: "Standard pallet", status: "active" },
  { id: "2", code: "CTN", name: "Carton", description: "Standard carton", status: "active" },
  { id: "3", code: "CRT", name: "Crate", description: "Standard crate", status: "active" },
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

const Customers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  
  // Location management
  const [newLocation, setNewLocation] = useState<string>("");
  const [selectedInventoryType, setSelectedInventoryType] = useState<string>("");
  const [rentalRate, setRentalRate] = useState<number>(0);
  const [locationRates, setLocationRates] = useState<{[key: string]: number}>({});
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);

  // Load customers from Supabase on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsInitialLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Convert Supabase data to Customer type
        const customersWithLocations = await Promise.all(data.map(async (customer) => {
          const { data: locationData, error: locationError } = await supabase
            .from('customer_locations')
            .select('*')
            .eq('customer_id', customer.id);
          
          if (locationError) {
            console.error('Error fetching customer locations:', locationError);
            return {
              ...customer,
              locations: []
            };
          }
          
          return {
            ...customer,
            locations: locationData || []
          };
        }));
        
        setCustomers(customersWithLocations);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = () => {
    setCurrentCustomer({
      id: "",
      code: "",
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      status: "active",
      locations: []
    });
    setIsDialogOpen(true);
    setActiveTab("details");
  };

  const handleEditCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsDialogOpen(true);
    setActiveTab("details");
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const customerData: Customer = {
      id: currentCustomer?.id || undefined,
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

    try {
      let result;
      
      if (customerData.id) {
        // Update existing customer
        result = await supabase
          .from('customers')
          .update({
            code: customerData.code,
            name: customerData.name,
            contact_person: customerData.contact_person,
            phone: customerData.phone,
            email: customerData.email,
            status: customerData.status
          })
          .eq('id', customerData.id)
          .select();
      } else {
        // Add new customer
        result = await supabase
          .from('customers')
          .insert({
            code: customerData.code,
            name: customerData.name,
            contact_person: customerData.contact_person,
            phone: customerData.phone,
            email: customerData.email,
            status: customerData.status
          })
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Refresh customers list
      await fetchCustomers();
      
      toast({
        title: customerData.id ? "Customer Updated" : "Customer Added",
        description: `${customerData.name} has been ${customerData.id ? 'updated' : 'added'} successfully.`,
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentCustomer) return;
    
    setIsLoading(true);
    try {
      // First delete all customer locations
      await supabase
        .from('customer_locations')
        .delete()
        .eq('customer_id', currentCustomer.id);
        
      // Then delete the customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', currentCustomer.id);
        
      if (error) {
        throw error;
      }
      
      // Remove from local state
      setCustomers(customers.filter(c => c.id !== currentCustomer.id));
      
      toast({
        title: "Customer Deleted",
        description: `${currentCustomer.name} has been deleted successfully.`,
      });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocationRate = () => {
    if (!selectedInventoryType || !rentalRate) {
      toast({
        title: "Error",
        description: "Please select an inventory type and enter a rental rate.",
        variant: "destructive",
      });
      return;
    }

    setLocationRates({
      ...locationRates,
      [selectedInventoryType]: rentalRate
    });

    setSelectedInventoryType("");
    setRentalRate(0);
  };

  const handleAddLocation = async () => {
    if (!newLocation) {
      toast({
        title: "Error",
        description: "Please select a location.",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(locationRates).length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one rental rate.",
        variant: "destructive",
      });
      return;
    }

    if (!currentCustomer) return;

    // Check if location already exists for this customer
    const locationExists = currentCustomer.locations?.some(
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

    try {
      const newCustomerLocation: CustomerLocation = {
        id: `${Date.now()}`,
        locationId: newLocation,
        locationName: selectedLocation.name,
        rentalRates: { ...locationRates }
      };

      // Save to Supabase if the customer already exists
      if (currentCustomer.id) {
        const { error } = await supabase
          .from('customer_locations')
          .insert({
            customer_id: currentCustomer.id,
            location_id: newLocation,
            location_name: selectedLocation.name,
            rental_rates: locationRates
          });
          
        if (error) {
          throw error;
        }
      }

      const updatedCustomer = {
        ...currentCustomer,
        locations: [...(currentCustomer.locations || []), newCustomerLocation]
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
      setLocationRates({});

      toast({
        title: "Location Added",
        description: `${selectedLocation.name} has been added to ${currentCustomer.name}.`,
      });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditLocation = (locationId: string) => {
    if (!currentCustomer) return;
    
    const location = currentCustomer.locations?.find(loc => loc.id === locationId);
    if (!location) return;
    
    setEditingLocationId(locationId);
    setNewLocation(location.locationId);
    setLocationRates(location.rentalRates);
    setIsLocationDialogOpen(true);
  };

  const handleUpdateLocation = async () => {
    if (!currentCustomer || !editingLocationId) return;
    
    const selectedLocation = mockLocations.find(loc => loc.id === newLocation);
    if (!selectedLocation) return;
    
    try {
      const updatedLocations = currentCustomer.locations?.map(loc => 
        loc.id === editingLocationId 
          ? {
              ...loc,
              locationId: newLocation,
              locationName: selectedLocation.name,
              rentalRates: { ...locationRates }
            }
          : loc
      ) || [];
      
      const updatedCustomer = {
        ...currentCustomer,
        locations: updatedLocations
      };
      
      setCurrentCustomer(updatedCustomer);
      
      // If we're editing a customer that already exists in the list
      if (currentCustomer.id) {
        // Update in Supabase
        const locationToUpdate = currentCustomer.locations?.find(loc => loc.id === editingLocationId);
        if (locationToUpdate && locationToUpdate.id) {
          const { error } = await supabase
            .from('customer_locations')
            .update({
              location_id: newLocation,
              location_name: selectedLocation.name,
              rental_rates: locationRates
            })
            .eq('id', locationToUpdate.id);
            
          if (error) {
            throw error;
          }
        }
        
        setCustomers(
          customers.map(c => c.id === currentCustomer.id ? updatedCustomer : c)
        );
      }
      
      // Reset form and close dialog
      setNewLocation("");
      setLocationRates({});
      setEditingLocationId(null);
      setIsLocationDialogOpen(false);
      
      toast({
        title: "Location Updated",
        description: `Location has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!currentCustomer) return;
    
    try {
      // Find the location to delete
      const locationToDelete = currentCustomer.locations?.find(loc => loc.id === locationId);
      
      // Delete from Supabase if the customer and location exist in the database
      if (currentCustomer.id && locationToDelete && locationToDelete.id) {
        const { error } = await supabase
          .from('customer_locations')
          .delete()
          .eq('id', locationToDelete.id);
          
        if (error) {
          throw error;
        }
      }
      
      const updatedLocations = currentCustomer.locations?.filter(
        loc => loc.id !== locationId
      ) || [];
      
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
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveInventoryRate = (inventoryTypeCode: string) => {
    const updatedRates = { ...locationRates };
    delete updatedRates[inventoryTypeCode];
    setLocationRates(updatedRates);
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

          {isInitialLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading customers...</p>
            </div>
          ) : (
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
                            {customer.locations && customer.locations.length > 0 ? (
                              customer.locations.map((loc, idx) => (
                                <Badge key={idx} variant="outline" className="bg-muted">
                                  <MapPin className="h-3 w-3 mr-1" /> {loc.locationName}
                                </Badge>
                              )).slice(0, 2)
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                            {customer.locations && customer.locations.length > 2 && (
                              <Badge variant="outline" className="bg-muted">
                                +{customer.locations.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              customer.status === "active"
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
          )}
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
                      defaultValue={currentCustomer?.status || "active"}
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
                  <Button onClick={handleAddLocation} disabled={Object.keys(locationRates).length === 0}>
                    Add Location
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Rental Rates</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor="inventoryType">Inventory Type</Label>
                        <Select value={selectedInventoryType} onValueChange={setSelectedInventoryType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select inventory type" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockInventoryTypes.map((type) => (
                              <SelectItem key={type.id} value={type.code}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="rentalRate">Rental Rate (₹/hour)</Label>
                        <Input
                          id="rentalRate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={rentalRate}
                          onChange={(e) => setRentalRate(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <Button onClick={handleAddLocationRate}>Add Rate</Button>
                    </div>
                    
                    {/* Display current rates */}
                    {Object.keys(locationRates).length > 0 && (
                      <div className="border rounded-md p-3">
                        <h5 className="text-sm font-medium mb-2">Current Rates:</h5>
                        <div className="space-y-2">
                          {Object.entries(locationRates).map(([typeCode, rate]) => {
                            const inventoryType = mockInventoryTypes.find(t => t.code === typeCode);
                            return (
                              <div key={typeCode} className="flex items-center justify-between">
                                <span>{inventoryType?.name || typeCode}: ₹{rate}/hour</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-destructive" 
                                  onClick={() => handleRemoveInventoryRate(typeCode)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                              Rates: {Object.entries(loc.rentalRates).map(([type, rate]) => {
                                const inventoryType = mockInventoryTypes.find(t => t.code === type);
                                return (
                                  <span key={type} className="inline-flex items-center mr-2">
                                    <Tag className="h-3 w-3 mr-1" /> {inventoryType?.name || type}: ₹{rate}/hour
                                  </span>
                                );
                              })}
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
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Rental Rates</h4>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="editInventoryType">Inventory Type</Label>
                    <Select value={selectedInventoryType} onValueChange={setSelectedInventoryType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inventory type" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockInventoryTypes.map((type) => (
                          <SelectItem key={type.id} value={type.code}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="editRentalRate">Rental Rate (₹/hour)</Label>
                    <Input
                      id="editRentalRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={rentalRate}
                      onChange={(e) => setRentalRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button onClick={handleAddLocationRate}>Add Rate</Button>
                </div>
                
                {/* Display current rates */}
                {Object.keys(locationRates).length > 0 && (
                  <div className="border rounded-md p-3">
                    <h5 className="text-sm font-medium mb-2">Current Rates:</h5>
                    <div className="space-y-2">
                      {Object.entries(locationRates).map(([typeCode, rate]) => {
                        const inventoryType = mockInventoryTypes.find(t => t.code === typeCode);
                        return (
                          <div key={typeCode} className="flex items-center justify-between">
                            <span>{inventoryType?.name || typeCode}: ₹{rate}/hour</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive" 
                              onClick={() => handleRemoveInventoryRate(typeCode)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

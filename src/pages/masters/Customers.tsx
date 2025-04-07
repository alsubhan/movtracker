import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Customer, CustomerLocation, Location } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Customers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [currentLocation, setCurrentLocation] = useState<CustomerLocation | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationFormData, setLocationFormData] = useState<CustomerLocation>({
    id: "",
    customer_id: "",
    location_id: "",
    location_name: "",
    rental_rates: {},
  });

  // Fetch customers from Supabase
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .order('name');
        
        if (customersError) {
          throw customersError;
        }
        
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('status', 'active');
        
        if (locationsError) {
          throw locationsError;
        }
        
        if (customersData) {
          setCustomers(customersData as Customer[]);
        }
        
        if (locationsData) {
          setLocations(locationsData as Location[]);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, [toast]);

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.contact_person && customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCustomer = () => {
    setCurrentCustomer(null); // Reset current customer for adding new
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const customerData = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      contact_person: formData.get("contact_person") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      status: formData.get("status") as string,
    };
    
    try {
      if (currentCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', currentCustomer.id);
        
        if (error) throw error;
        
        setCustomers(
          customers.map((c) => (c.id === currentCustomer.id ? { ...c, ...customerData } : c))
        );
        
        toast({
          title: "Customer Updated",
          description: `${customerData.name} has been updated successfully.`,
        });
      } else {
        // Add new customer
        const { data, error } = await supabase
          .from('customers')
          .insert(customerData)
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setCustomers([...customers, data[0] as Customer]);
          
          toast({
            title: "Customer Added",
            description: `${customerData.name} has been added successfully.`,
          });
        }
      }
      
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
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', currentCustomer.id);
      
      if (error) throw error;
      
      setCustomers(customers.filter((c) => c.id !== currentCustomer.id));
      
      toast({
        title: "Customer Deleted",
        description: `${currentCustomer.name} has been deleted successfully.`,
      });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. It may be in use by other records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update locationId to location_id
  const handleAddLocation = (customerId: string) => {
    setCurrentCustomer(customers.find(c => c.id === customerId) || null);
    setLocationFormData({
      id: "",
      customer_id: customerId,
      location_id: "",
      location_name: "",
      rental_rates: {},
    });
    setIsLocationDialogOpen(true);
  };

  // Update other instances of locationId to location_id
  const handleEditLocation = (customerLocation: CustomerLocation) => {
    setCurrentLocation(customerLocation);
    setLocationFormData({
      id: customerLocation.id,
      customer_id: customerLocation.customer_id,
      location_id: customerLocation.location_id,
      location_name: customerLocation.location_name,
      rental_rates: customerLocation.rental_rates || {},
    });
    setIsLocationDialogOpen(true);
  };

  // Update other property names to match schema
  const handleSaveLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const locationData = {
        customer_id: locationFormData.customer_id,
        location_id: locationFormData.location_id,
        location_name: locationFormData.location_name,
        rental_rates: locationFormData.rental_rates,
      };
      
      if (currentLocation) {
        // Update existing location
        const { error } = await supabase
          .from('customer_locations')
          .update(locationData)
          .eq('id', currentLocation.id);
        
        if (error) throw error;
        
        // Update customers state
        setCustomers(customers.map(customer => {
          if (customer.id === locationFormData.customer_id) {
            const updatedLocations = customer.locations?.map(loc => 
              loc.id === currentLocation.id ? { ...loc, ...locationData } : loc
            ) || [];
            
            return {
              ...customer,
              locations: updatedLocations
            };
          }
          return customer;
        }));
        
        toast({
          title: "Location Updated",
          description: "Customer location has been updated successfully.",
        });
      } else {
        // Add new location
        const { data, error } = await supabase
          .from('customer_locations')
          .insert([locationData])
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const newLocation = data[0] as CustomerLocation;
          
          // Update customers state
          setCustomers(customers.map(customer => {
            if (customer.id === locationFormData.customer_id) {
              const updatedLocations = [...(customer.locations || []), newLocation];
              
              return {
                ...customer,
                locations: updatedLocations
              };
            }
            return customer;
          }));
          
          toast({
            title: "Location Added",
            description: "Customer location has been added successfully.",
          });
        }
      }
      
      setIsLocationDialogOpen(false);
    } catch (error) {
      console.error('Error saving customer location:', error);
      toast({
        title: "Error",
        description: "Failed to save customer location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLocation = async (location: CustomerLocation) => {
    setCurrentLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteLocation = async () => {
    if (!currentLocation) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('customer_locations')
        .delete()
        .eq('id', currentLocation.id);
      
      if (error) throw error;
      
      setCustomers(customers.map(customer => {
        if (customer.id === currentLocation.customer_id) {
          const updatedLocations = customer.locations?.filter(loc => loc.id !== currentLocation.id) || [];
          
          return {
            ...customer,
            locations: updatedLocations
          };
        }
        return customer;
      }));
      
      toast({
        title: "Location Deleted",
        description: `${currentLocation.location_name} has been deleted successfully.`,
      });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location. It may be in use by other records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelectChange = (name: string, value: string) => {
    setLocationFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Update JSX to use the correct property names
  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            Manage customers in the system
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
                  <TableHead>Customer Code</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
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
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            customer.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {customer.status === "active" ? "Active" : "Inactive"}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAddLocation(customer.id)}
                        >
                          <Plus className="h-4 w-4" />
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentCustomer ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
            <DialogDescription>
              {currentCustomer
                ? "Update customer details"
                : "Add a new customer to the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code
                </Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={currentCustomer?.code}
                  className="col-span-3"
                  required
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
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
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

      {/* Add/Edit Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentLocation ? "Edit Location" : "Add Location"}
            </DialogTitle>
            <DialogDescription>
              {currentLocation
                ? "Update customer location details"
                : "Add a new location to the customer"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLocation}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_id" className="text-right">
                  Location
                </Label>
                <Select
                  value={locationFormData.location_id}
                  onValueChange={(value) => handleLocationSelectChange("location_id", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_name" className="text-right">
                  Location Name
                </Label>
                <Input
                  id="location_name"
                  name="location_name"
                  value={locationFormData.location_name}
                  onChange={handleLocationInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              {/* Add rental rates configuration here */}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentLocation?.location_name}? This action cannot be undone.
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
              onClick={handleConfirmDeleteLocation}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Customer Locations</CardTitle>
          <CardDescription>Manage locations for each customer</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.map((customer) => (
            <div key={customer.id} className="mb-4 p-4 border rounded-md">
              <h3 className="text-xl font-semibold mb-2">{customer.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => handleAddLocation(customer.id)}>
                <Plus className="h-4 w-4" />
              </Button>
              {customer.locations?.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">{location.location_name}</span>
                    <div className="text-sm text-muted-foreground">
                      Rates: {Object.keys(location.rental_rates || {}).length > 0 
                        ? Object.entries(location.rental_rates || {}).map(([type, rate]) => (
                            <span key={type} className="mr-2">
                              {type}: ₹{rate}
                            </span>
                          ))
                        : "No rates defined"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditLocation(location)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteLocation(location)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;

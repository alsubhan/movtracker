import { useState } from "react";
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
import { Customer } from "@/types";

// Sample data for demonstration
const demoCustomers: Customer[] = [
  { id: "1", code: "TOY", name: "Toyota", contact_person: "John Smith", phone: "555-1234", email: "john@toyota.com", status: "Active" },
  { id: "2", code: "HON", name: "Honda", contact_person: "Jane Doe", phone: "555-2345", email: "jane@honda.com", status: "Active" },
  { id: "3", code: "NIS", name: "Nissan", contact_person: "Bob Johnson", phone: "555-3456", email: "bob@nissan.com", status: "Active" },
  { id: "4", code: "FOR", name: "Ford", contact_person: "Alice Williams", phone: "555-4567", email: "alice@ford.com", status: "Inactive" },
  { id: "5", code: "TES", name: "Tesla", contact_person: "Mark Davis", phone: "555-5678", email: "mark@tesla.com", status: "Active" },
];

const Customers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const customerData: Customer = {
      id: currentCustomer?.id || `${customers.length + 1}`,
      code: (formData.get("code") as string).toUpperCase(),
      name: formData.get("name") as string,
      contact_person: formData.get("contact_person") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      status: formData.get("status") as string,
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
      if (currentCustomer) {
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
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
    </div>
  );
};

export default Customers;

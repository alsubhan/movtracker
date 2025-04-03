
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
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
import { ProductLocation } from "@/types";

// Sample data for demonstration
const demoLocations: ProductLocation[] = [
  { id: "1", name: "Main Warehouse", description: "Main storage facility", status: "active" },
  { id: "2", name: "Production Line A", description: "Assembly line A", status: "active" },
  { id: "3", name: "Customer Site", description: "Client location", status: "active" },
  { id: "4", name: "Repair Center", description: "Maintenance and repairs", status: "inactive" },
];

const ProductLocations = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<ProductLocation[]>(demoLocations);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLocation, setCurrentLocation] = useState<ProductLocation | null>(null);

  // Filter locations based on search term
  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddLocation = () => {
    setCurrentLocation(null); // Reset current location for adding new
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location: ProductLocation) => {
    setCurrentLocation(location);
    setIsDialogOpen(true);
  };

  const handleDeleteLocation = (location: ProductLocation) => {
    setCurrentLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const locationData: ProductLocation = {
      id: currentLocation?.id || `${locations.length + 1}`,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as "active" | "inactive",
    };

    // Simulate API call
    setTimeout(() => {
      if (currentLocation) {
        // Update existing location
        setLocations(
          locations.map((l) => (l.id === currentLocation.id ? locationData : l))
        );
        toast({
          title: "Location Updated",
          description: `${locationData.name} has been updated successfully.`,
        });
      } else {
        // Add new location
        setLocations([...locations, locationData]);
        toast({
          title: "Location Added",
          description: `${locationData.name} has been added successfully.`,
        });
      }
      setIsLoading(false);
      setIsDialogOpen(false);
    }, 500);
  };

  const handleConfirmDelete = () => {
    if (!currentLocation) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLocations(locations.filter((l) => l.id !== currentLocation.id));
      toast({
        title: "Location Deleted",
        description: `${currentLocation.name} has been deleted successfully.`,
      });
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }, 500);
  };

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Product Locations</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Location Management</CardTitle>
            <CardDescription>
              Manage product locations in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="max-w-sm">
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[300px]"
                />
              </div>
              <Button onClick={handleAddLocation}>
                <Plus className="mr-2 h-4 w-4" /> Add Location
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No locations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>{location.description}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              location.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {location.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditLocation(location)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteLocation(location)}
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
      </div>

      {/* Add/Edit Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentLocation ? "Edit Location" : "Add Location"}
            </DialogTitle>
            <DialogDescription>
              {currentLocation
                ? "Update location details"
                : "Add a new product location to the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLocation}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={currentLocation?.name}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={currentLocation?.description}
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
                  defaultValue={currentLocation?.status || "active"}
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
              Are you sure you want to delete {currentLocation?.name}? This action cannot be undone.
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
    </Layout>
  );
};

export default ProductLocations;

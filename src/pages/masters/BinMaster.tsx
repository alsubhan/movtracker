
import { useState } from "react";
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
import { Box, PlusCircle, Pencil, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialBins = [
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

const BinMaster = () => {
  const [bins, setBins] = useState(initialBins);
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
  const { toast } = useToast();

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

  const handleEditBin = (bin: any) => {
    setFormData(bin);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteBin = (id: string) => {
    setBins(bins.filter((bin) => bin.id !== id));
    toast({
      title: "Bin Deleted",
      description: "Bin has been deleted successfully",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate bin ID based on customer, project, partition, and serial number
    const binId = `${formData.customer}${formData.project}${formData.partition}${formData.serialNumber}`;
    
    if (isEditing) {
      setBins(
        bins.map((bin) =>
          bin.id === formData.id
            ? {
                ...formData,
                lastScanTime: bin.lastScanTime,
                createdAt: bin.createdAt,
              }
            : bin
        )
      );
      toast({
        title: "Bin Updated",
        description: "Bin has been updated successfully",
      });
    } else {
      const newBin = {
        ...formData,
        id: binId, // Using the generated binId instead of a sequential number
        lastScanTime: new Date(),
        createdAt: new Date(),
      };
      setBins([...bins, newBin]);
      toast({
        title: "Bin Added",
        description: `New bin ${binId} has been added successfully`,
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const filteredBins = bins.filter((bin) => {
    const binId = `${bin.customer}${bin.project}${bin.partition}${bin.serialNumber}`;
    const searchableValues = [
      bin.customer,
      bin.project,
      binId,
    ].join(" ").toLowerCase();
    
    return searchableValues.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Bin Master</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bins</CardTitle>
            <CardDescription>
              Manage bins and their tracking information
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search bins..."
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
                  Add Bin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? "Edit Bin" : "Add New Bin"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditing
                        ? "Update bin details and tracking information"
                        : "Create a new bin with tracking information"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="customer">Customer Code (3)</Label>
                        <Input
                          id="customer"
                          name="customer"
                          value={formData.customer}
                          onChange={handleInputChange}
                          placeholder="e.g. TOY"
                          maxLength={3}
                          required
                        />
                      </div>
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
                            <SelectItem value="warehouse">Warehouse</SelectItem>
                            <SelectItem value="wip">WIP</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
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
                      {isEditing ? "Update Bin" : "Add Bin"}
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
                <TableHead>Bin ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Scan</TableHead>
                <TableHead>Gate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBins.map((bin) => {
                const binId = `${bin.customer}${bin.project}${bin.partition}${bin.serialNumber}`;
                return (
                  <TableRow key={bin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-muted-foreground" />
                        {binId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          bin.status === "in-stock"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : bin.status === "in-wip"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : bin.status === "dispatched"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {bin.status === "in-stock"
                          ? "In Stock"
                          : bin.status === "in-wip"
                          ? "In WIP"
                          : bin.status === "dispatched"
                          ? "Dispatched"
                          : "Damaged"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {bin.location === "warehouse"
                          ? "Warehouse"
                          : bin.location === "wip"
                          ? "WIP"
                          : "Customer"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bin.lastScanTime.toLocaleString()}
                    </TableCell>
                    <TableCell>{bin.lastScanGate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditBin(bin)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBin(bin.id)}
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

export default BinMaster;


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
import { DoorOpen, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialGates = [
  {
    id: "1",
    name: "Gate 1",
    gateLocation: "Finished Goods Warehouse",
    type: "warehouse",
    status: "active",
  },
  {
    id: "2",
    name: "Gate 2",
    gateLocation: "Production Line Exit",
    type: "production",
    status: "active",
  },
  {
    id: "3",
    name: "Gate 3",
    gateLocation: "Customer Dispatch Area",
    type: "dispatch",
    status: "inactive",
  },
];

const GatesMaster = () => {
  const [gates, setGates] = useState(initialGates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    gateLocation: "",
    type: "warehouse",
    status: "active",
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
      name: "",
      gateLocation: "",
      type: "warehouse",
      status: "active",
    });
    setIsEditing(false);
  };

  const handleEditGate = (gate: any) => {
    setFormData(gate);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteGate = (id: string) => {
    setGates(gates.filter((gate) => gate.id !== id));
    toast({
      title: "Gate Deleted",
      description: "Gate has been deleted successfully",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      setGates(gates.map((gate) => (gate.id === formData.id ? formData : gate)));
      toast({
        title: "Gate Updated",
        description: "Gate has been updated successfully",
      });
    } else {
      const newGate = {
        ...formData,
        id: String(gates.length + 1),
      };
      setGates([...gates, newGate]);
      toast({
        title: "Gate Added",
        description: "New gate has been added successfully",
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gates</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gates</CardTitle>
            <CardDescription>
              Manage gate locations and configurations
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
                Add Gate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "Edit Gate" : "Add New Gate"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update gate configuration and status"
                      : "Create a new gate for product tracking"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Gate Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Gate 1"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gateLocation">Gate Location</Label>
                    <Input
                      id="gateLocation"
                      name="gateLocation"
                      value={formData.gateLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. Warehouse Entrance"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Gate Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          handleSelectChange("type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="dispatch">Dispatch</SelectItem>
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
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditing ? "Update Gate" : "Add Gate"}
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
                <TableHead>Gate Name</TableHead>
                <TableHead>Gate Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gates.map((gate) => (
                <TableRow key={gate.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      {gate.name}
                    </div>
                  </TableCell>
                  <TableCell>{gate.gateLocation}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        gate.type === "warehouse"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : gate.type === "production"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {gate.type === "warehouse"
                        ? "Warehouse"
                        : gate.type === "production"
                        ? "Production"
                        : "Dispatch"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        gate.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {gate.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditGate(gate)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGate(gate.id)}
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

export default GatesMaster;

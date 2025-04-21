import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DoorOpen, PlusCircle, Pencil, Trash2, Settings, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, getCustomTable, safelyParseCustomData, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

// Interface for database Gate
interface DbGate {
  id: string;
  name: string;
  status: string;
  location_id: string;
  gate_type_id: string;
  created_at: string;
}

// Interface for the form
interface GateForm {
  name: string;
  status: string;
  location_id: string;
  gate_type_id: string;
}

// Interface for the form state
interface FormState {
  name: string;
  status: string;
  location_id: string;
  gate_type_id: string;
}

export const Gates = () => {
  const { toast } = useToast();
  const [gates, setGates] = useState<DbGate[]>([]);
  const [gateTypes, setGateTypes] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGate, setSelectedGate] = useState<DbGate | null>(null);
  const [formState, setFormState] = useState<FormState>({
    name: "",
    status: "active",
    location_id: "",
    gate_type_id: ""
  });

  const fetchData = async () => {
    try {
      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('status', 'active');

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);

      // Fetch gate types
      const { data: gateTypesData, error: gateTypesError } = await supabase
        .from('gate_types')
        .select('id, name')
        .eq('status', 'active');

      if (gateTypesError) throw gateTypesError;
      setGateTypes(gateTypesData || []);

      // Fetch gates
      const { data: gatesData, error: gatesError } = await supabase
        .from('gates')
        .select('id, name, status, location_id, gate_type_id, created_at')
        .eq('status', 'active');

      if (gatesError) throw gatesError;
      setGates(gatesData as DbGate[] || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (data: GateForm) => {
    try {
      const { error } = await supabase
        .from('gates')
        .insert([{
          name: data.name,
          status: data.status,
          location_id: data.location_id,
          gate_type_id: data.gate_type_id
        }])
        .select('id, name, status, location_id, gate_type_id, created_at');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gate created successfully"
      });

      // Refresh the data
      const { data: gatesData, error: fetchError } = await supabase
        .from('gates')
        .select('id, name, status, location_id, gate_type_id, created_at')
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      setGates(gatesData as DbGate[] || []);
      setSelectedGate(null);
      setFormState({
        name: "",
        status: "active",
        location_id: "",
        gate_type_id: ""
      });
    } catch (error: any) {
      console.error('Error creating gate:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create gate",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async (data: GateForm) => {
    try {
      const { error } = await supabase
        .from('gates')
        .update({
          name: data.name,
          status: data.status,
          location_id: data.location_id,
          gate_type_id: data.gate_type_id
        })
        .eq('id', selectedGate?.id)
        .select('id, name, status, location_id, gate_type_id, created_at');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gate updated successfully"
      });

      // Refresh the data
      const { data: gatesData, error: fetchError } = await supabase
        .from('gates')
        .select('id, name, status, location_id, gate_type_id, created_at')
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      setGates(gatesData as DbGate[] || []);
      setSelectedGate(null);
      setFormState({
        name: "",
        status: "active",
        location_id: "",
        gate_type_id: ""
      });
    } catch (error: any) {
      console.error('Error updating gate:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update gate",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (gateId: string) => {
    try {
      const { error } = await supabase
        .from('gates')
        .update({ status: 'deleted' })
        .eq('id', gateId)
        .select('id, name, status, location_id, gate_type_id, created_at');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gate deleted successfully"
      });

      // Refresh the data
      const { data: gatesData, error: fetchError } = await supabase
        .from('gates')
        .select('id, name, status, location_id, gate_type_id, created_at')
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      setGates(gatesData as DbGate[] || []);
    } catch (error: any) {
      console.error('Error deleting gate:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete gate",
        variant: "destructive"
      });
    }
  };

  const handleGateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gates Management</h2>
      </div>

      <Tabs value="gates" onValueChange={() => {}} className="space-y-4">
        <TabsList>
          <TabsTrigger value="gates">Gates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gates</CardTitle>
                <CardDescription>
                  Manage gate locations and configurations
                </CardDescription>
              </div>
              <Dialog open={!!selectedGate} onOpenChange={() => setSelectedGate(null)}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setSelectedGate(null);
                      setFormState({
                        name: "",
                        status: "active",
                        location_id: "",
                        gate_type_id: ""
                      });
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Gate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedGate) {
                      handleUpdate(formState);
                    } else {
                      handleCreate(formState);
                    }
                  }}>
                    <DialogHeader>
                      <DialogTitle>
                        {selectedGate ? "Edit Gate" : "Add New Gate"}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedGate
                          ? "Update gate configuration and status"
                          : "Create a new gate for inventory tracking"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Gate Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formState.name}
                          onChange={handleGateInputChange}
                          placeholder="e.g. Gate 1"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formState.status}
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
                      <div className="grid gap-2">
                        <Label htmlFor="location_id">Location</Label>
                        <Select
                          value={formState.location_id}
                          onValueChange={(value) =>
                            handleSelectChange("location_id", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map(location => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="gate_type_id">Gate Type</Label>
                        <Select
                          value={formState.gate_type_id}
                          onValueChange={(value) =>
                            handleSelectChange("gate_type_id", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {gateTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setSelectedGate(null)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {selectedGate ? "Update Gate" : "Add Gate"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gate Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Gate Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gates.length > 0 ? (
                      gates.map((gate) => (
                        <TableRow key={gate.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <DoorOpen className="h-4 w-4 text-muted-foreground" />
                              {gate.name}
                            </div>
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
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {locations.find(location => location.id === gate.location_id)?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {gateTypes.find(type => type.id === gate.gate_type_id)?.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedGate(gate);
                                  setFormState({
                                    name: gate.name,
                                    status: gate.status,
                                    location_id: gate.location_id,
                                    gate_type_id: gate.gate_type_id,
                                  });
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(gate.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No gates found. Add your first gate to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Gates;

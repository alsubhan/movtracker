import { useState, useEffect } from "react";
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
import { DoorOpen, PlusCircle, Pencil, Trash2, Settings, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, getCustomTable, safelyParseCustomData } from "@/integrations/supabase/client";

// Interface for Gates
interface Gate {
  id: string;
  name: string;
  gateLocation: string;
  type: string;
  status: string;
}

// Interface for Gate Types
interface GateType {
  id: string;
  name: string;
  description: string;
  status: string;
}

const Gates = () => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [gateTypes, setGateTypes] = useState<GateType[]>([]);
  const [isGateDialogOpen, setIsGateDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("gates");
  const [gateFormData, setGateFormData] = useState({
    id: "",
    name: "",
    gateLocation: "",
    type: "warehouse",
    status: "active",
  });
  const [typeFormData, setTypeFormData] = useState({
    id: "",
    name: "",
    description: "",
    status: "active",
  });
  const [isEditingGate, setIsEditingGate] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch gates and gate types from Supabase
  useEffect(() => {
    const fetchGatesAndTypes = async () => {
      setIsLoading(true);
      
      try {
        // Fetch gates
        const { data: gatesData, error: gatesError } = await supabase
          .from('gates')
          .select('*');
        
        if (gatesError) throw gatesError;
        
        // Fetch gate types
        const { data: gateTypesData, error: typesError } = await getCustomTable('gate_types')
          .select('*');
        
        if (typesError) throw typesError;
        
        // Map Supabase data to our interfaces
        if (gatesData) {
          const formattedGates = gatesData.map(gate => ({
            id: gate.id,
            name: gate.name,
            gateLocation: gate.gate_location,
            type: gate.type,
            status: gate.status || 'active'
          }));
          setGates(formattedGates);
        }
        
        if (gateTypesData) {
          // Use the safe parser to avoid type errors
          const typesArray = safelyParseCustomData<any>(gateTypesData);
          const formattedTypes = typesArray.map(type => ({
            id: type.id,
            name: type.name,
            description: type.description || '',
            status: type.status || 'active'
          }));
          setGateTypes(formattedTypes);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error Loading Data",
          description: "There was an error loading gates and gate types.",
          variant: "destructive",
        });
        
        // Set empty arrays instead of fallback data
        setGates([]);
        setGateTypes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGatesAndTypes();
  }, [toast]);

  const handleGateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGateFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTypeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string, formType: 'gate' | 'type') => {
    if (formType === 'gate') {
      setGateFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setTypeFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetGateForm = () => {
    setGateFormData({
      id: "",
      name: "",
      gateLocation: "",
      type: "warehouse",
      status: "active",
    });
    setIsEditingGate(false);
  };

  const resetTypeForm = () => {
    setTypeFormData({
      id: "",
      name: "",
      description: "",
      status: "active",
    });
    setIsEditingType(false);
  };

  const handleEditGate = (gate: Gate) => {
    setGateFormData(gate);
    setIsEditingGate(true);
    setIsGateDialogOpen(true);
  };

  const handleEditType = (type: GateType) => {
    setTypeFormData(type);
    setIsEditingType(true);
    setIsTypeDialogOpen(true);
  };

  const handleDeleteGate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gates')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setGates(gates.filter((gate) => gate.id !== id));
      
      toast({
        title: "Gate Deleted",
        description: "Gate has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting gate:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the gate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteType = async (id: string) => {
    // Check if any gate is using this type
    const typeToDelete = gateTypes.find(type => type.id === id);
    if (!typeToDelete) return;
    
    const gatesUsingType = gates.filter(gate => gate.type === typeToDelete.name);
    
    if (gatesUsingType.length > 0) {
      toast({
        title: "Cannot Delete Gate Type",
        description: `This type is being used by ${gatesUsingType.length} gates. Update those gates first.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await getCustomTable('gate_types')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setGateTypes(gateTypes.filter((type) => type.id !== id));
      
      toast({
        title: "Gate Type Deleted",
        description: "Gate type has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting gate type:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the gate type. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditingGate) {
        // Update existing gate
        const { error } = await supabase
          .from('gates')
          .update({
            name: gateFormData.name,
            gate_location: gateFormData.gateLocation,
            type: gateFormData.type,
            status: gateFormData.status
          })
          .eq('id', gateFormData.id);
          
        if (error) throw error;
        
        setGates(gates.map((gate) => (gate.id === gateFormData.id ? gateFormData : gate)));
        
        toast({
          title: "Gate Updated",
          description: "Gate has been updated successfully",
        });
      } else {
        // Create new gate
        const { data, error } = await supabase
          .from('gates')
          .insert({
            name: gateFormData.name,
            gate_location: gateFormData.gateLocation,
            type: gateFormData.type,
            status: gateFormData.status
          })
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const newGate = {
            id: data[0].id,
            name: data[0].name,
            gateLocation: data[0].gate_location,
            type: data[0].type,
            status: data[0].status || 'active'
          };
          
          setGates([...gates, newGate]);
          
          toast({
            title: "Gate Added",
            description: "New gate has been added successfully",
          });
        }
      }
    } catch (error) {
      console.error('Error saving gate:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the gate. Please try again.",
        variant: "destructive",
      });
    } finally {
      resetGateForm();
      setIsGateDialogOpen(false);
    }
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate type name is unique
    if (!isEditingType && gateTypes.some(type => type.name === typeFormData.name)) {
      toast({
        title: "Validation Error",
        description: "Gate type name must be unique",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (isEditingType) {
        const oldType = gateTypes.find(type => type.id === typeFormData.id);
        
        // Update gate type
        const { error } = await getCustomTable('gate_types')
          .update({
            name: typeFormData.name,
            description: typeFormData.description,
            status: typeFormData.status
          })
          .eq('id', typeFormData.id);
          
        if (error) throw error;
        
        // Update all gates using this type if name changed
        if (oldType && oldType.name !== typeFormData.name) {
          // Update gate records in database 
          const { error: updateError } = await supabase
            .from('gates')
            .update({ type: typeFormData.name })
            .eq('type', oldType.name);
            
          if (updateError) throw updateError;
          
          // Update local state
          setGates(gates.map(gate => {
            if (gate.type === oldType.name) {
              return { ...gate, type: typeFormData.name };
            }
            return gate;
          }));
        }
        
        setGateTypes(gateTypes.map((type) => (type.id === typeFormData.id ? typeFormData : type)));
        
        toast({
          title: "Gate Type Updated",
          description: "Gate type has been updated successfully",
        });
      } else {
        // Create new gate type
        const { data, error } = await getCustomTable('gate_types')
          .insert({
            name: typeFormData.name,
            description: typeFormData.description,
            status: typeFormData.status
          })
          .select();
          
        if (error) throw error;
        
        // Use the safe parser to avoid type errors
        const newTypeData = safelyParseCustomData<any>(data);
        
        if (newTypeData && newTypeData.length > 0) {
          const newType = {
            id: newTypeData[0].id,
            name: newTypeData[0].name,
            description: newTypeData[0].description || '',
            status: newTypeData[0].status || 'active'
          };
          
          setGateTypes([...gateTypes, newType]);
          
          toast({
            title: "Gate Type Added",
            description: "New gate type has been added successfully",
          });
        }
      }
    } catch (error) {
      console.error('Error saving gate type:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the gate type. Please try again.",
        variant: "destructive",
      });
    } finally {
      resetTypeForm();
      setIsTypeDialogOpen(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gates Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="gates">Gates</TabsTrigger>
          <TabsTrigger value="types">Gate Types</TabsTrigger>
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
              <Dialog open={isGateDialogOpen} onOpenChange={setIsGateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetGateForm();
                      setIsGateDialogOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Gate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleGateSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {isEditingGate ? "Edit Gate" : "Add New Gate"}
                      </DialogTitle>
                      <DialogDescription>
                        {isEditingGate
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
                          value={gateFormData.name}
                          onChange={handleGateInputChange}
                          placeholder="e.g. Gate 1"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="gateLocation">Gate Location</Label>
                        <Input
                          id="gateLocation"
                          name="gateLocation"
                          value={gateFormData.gateLocation}
                          onChange={handleGateInputChange}
                          placeholder="e.g. Warehouse Entrance"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="type">Gate Type</Label>
                          <Select
                            value={gateFormData.type}
                            onValueChange={(value) =>
                              handleSelectChange("type", value, 'gate')
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {gateTypes
                                .filter(type => type.status === 'active')
                                .map(type => (
                                  <SelectItem key={type.id} value={type.name}>
                                    {type.name}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={gateFormData.status}
                            onValueChange={(value) =>
                              handleSelectChange("status", value, 'gate')
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
                      <Button variant="outline" type="button" onClick={() => setIsGateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {isEditingGate ? "Update Gate" : "Add Gate"}
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
                      <TableHead>Gate Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
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
                          <TableCell>{gate.gateLocation}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {gate.type}
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
        
        <TabsContent value="types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gate Types</CardTitle>
                <CardDescription>
                  Manage gate types for different locations
                </CardDescription>
              </div>
              <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetTypeForm();
                      setIsTypeDialogOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Gate Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleTypeSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {isEditingType ? "Edit Gate Type" : "Add New Gate Type"}
                      </DialogTitle>
                      <DialogDescription>
                        {isEditingType
                          ? "Update gate type configuration"
                          : "Create a new gate type for categorizing gates"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="typeName">Type Name</Label>
                        <Input
                          id="typeName"
                          name="name"
                          value={typeFormData.name}
                          onChange={handleTypeInputChange}
                          placeholder="e.g. warehouse"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          name="description"
                          value={typeFormData.description}
                          onChange={handleTypeInputChange}
                          placeholder="e.g. Gates in the warehouse area"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="typeStatus">Status</Label>
                        <Select
                          value={typeFormData.status}
                          onValueChange={(value) =>
                            handleSelectChange("status", value, 'type')
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
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsTypeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {isEditingType ? "Update Type" : "Add Type"}
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
                      <TableHead>Type Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gateTypes.length > 0 ? (
                      gateTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4 text-muted-foreground" />
                              {type.name}
                            </div>
                          </TableCell>
                          <TableCell>{type.description}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                type.status === "active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {type.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditType(type)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteType(type.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          No gate types found. Add your first gate type to get started.
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

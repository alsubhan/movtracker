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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Box, IndianRupee, Search } from "lucide-react";
import { Location, InventoryType } from "@/types";
import { PERMISSIONS } from "@/utils/permissions";

// TODO: Replace `any` with generated Supabase types once available
type DatabaseInventory = any;

// Type for transformed inventory items with Date objects
type TransformedInventoryItem = {
  id: string;
  rfid_tag: string;
  code: string;
  project: string;
  partition: string;
  serial_number: string;
  status: string;
  last_scan_time: Date | null;
  last_scan_gate: string;
  created_at: Date;
  created_by: string;
  type_id: string;
  location_id: string;
  type: string;
  location: string;
};

// Type for transformed inventory items with Date objects
type FormData = {
  id: string;
  project: string;
  partition: string;
  serial_number: string;
  status: string;
  location_id: string;
  last_scan_gate: string;
  rfid_tag: string;
  created_by: string;
  code: string;
  type_id: string;
};

// Helper function to convert dates
const convertDates = (item: DatabaseInventory): TransformedInventoryItem => ({
  ...item,
  last_scan_time: item.last_scan_time ? new Date(item.last_scan_time) : null,
  created_at: new Date(item.created_at),
  type: '',
  location: ''
});

// Helper function to convert back to database format
const convertToDatabaseFormat = (item: TransformedInventoryItem): DatabaseInventory => ({
  ...item,
  last_scan_time: item.last_scan_time?.toISOString(),
  created_at: item.created_at.toISOString(),
});

// Helper function to format date only as dd/mm/yyyy
const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Helper function to format dates as dd/mm/yyyy hh:mm
const formatDateTime = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export default function Inventory() {
  const [loading, setLoading] = useState(true);

  // Determine edit permission from session (avoid network call)
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const canEditPermission: boolean = session.user?.permissions?.includes(PERMISSIONS.MANAGE_INVENTORY) ?? false;

  // Inventory state
  const [inventory, setInventory] = useState<TransformedInventoryItem[]>([]);
  const [inventoryTypes, setInventoryTypes] = useState<InventoryType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // UI state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeSearchTerm, setTypeSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("inventory");
  
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [isTypesLoading, setIsTypesLoading] = useState(true);

  // Form state for Add mode
  const [addFormData, setAddFormData] = useState<FormData>(() => ({
    id: uuidv4(),
    project: "",
    partition: "",
    serial_number: "",
    // Default status must match DB check constraint
    status: "In-Stock",
    location_id: "",
    last_scan_gate: "",
    rfid_tag: "",
    created_by: "",
    code: "",
    type_id: ""
  }));

  // Form state for Edit mode
  const [editFormData, setEditFormData] = useState<FormData>(() => ({
    id: "",
    project: "",
    partition: "",
    serial_number: "",
    // Default edit status
    status: "In-Stock",
    location_id: "",
    last_scan_gate: "",
    rfid_tag: "",
    created_by: "",
    code: "",
    type_id: ""
  }));

  // Type form state
  const [typeFormData, setTypeFormData] = useState<InventoryType>({
    id: "",
    code: "",
    name: "",
    description: "",
    // Default to active status
    status: "active",
  });

  // State to store user profile
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // Pagination for inventory list
  const PAGE_SIZE = 500;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Initialize user from session and set created_by field
  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem('session') || '{}');
    const u = sessionData.user;
    if (u?.id) {
      setUserProfile(u);
      setAddFormData(prev => ({ ...prev, created_by: u.id }));
      setEditFormData(prev => ({ ...prev, created_by: u.id }));
    }
    setIsProfileLoaded(true);
  }, []);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (isEditing) {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setAddFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (field: keyof FormData, value: string) => {
    if (field === 'location_id') {
      const selectedLocation = activeLocations.find(loc => loc.id === value);
      if (!selectedLocation) {
        toast({
          title: "Error",
          description: "Invalid location selected",
          variant: "destructive",
        });
        return;
      }

      // Update the form state with the validated location
      if (isEditing) {
        setEditFormData((prev) => ({ ...prev, [field]: selectedLocation.id }));
      } else {
        setAddFormData((prev) => ({ ...prev, [field]: selectedLocation.id }));
      }
    } else {
      // For other fields, just update the value
      if (isEditing) {
        setEditFormData((prev) => ({ ...prev, [field]: value }));
      } else {
        setAddFormData((prev) => ({ ...prev, [field]: value }));
      }
    }
  };

  // Type form handlers
  const handleTypeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTypeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeSelectChange = (name: string, value: string) => {
    setTypeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetAddForm = () => {
    setAddFormData({
      id: uuidv4(),
      project: "",
      partition: "",
      serial_number: "",
      status: "In-Stock",
      location_id: "",
      last_scan_gate: "",
      rfid_tag: "",
      created_by: "",
      code: "",
      type_id: ""
    });
    setIsEditing(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      id: "",
      project: "",
      partition: "",
      serial_number: "",
      status: "In-Stock",
      location_id: "",
      last_scan_gate: "",
      rfid_tag: "",
      created_by: "",
      code: "",
      type_id: ""
    });
    setIsEditing(false);
  };

  const resetTypeForm = () => {
    setTypeFormData({
      id: "",
      code: "",
      name: "",
      description: "",
      status: "active"
    });
    setIsTypeEditing(false);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isTypeEditing, setIsTypeEditing] = useState(false);
  
  // Auth
  const { toast } = useToast();

  // Fetch a page of inventory, optionally appending
  const fetchInventoryPage = async (append = false) => {
    setIsInventoryLoading(true);
    try {
      const from = append ? (page + 1) * PAGE_SIZE : 0;
      const to = from + PAGE_SIZE - 1;
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .order('rfid_tag', { ascending: true })
        .range(from, to);
      if (invError) throw invError;

      // Fetch lookup tables
      const { data: locs } = await supabase.from('locations').select('id, name');
      const { data: types } = await supabase.from('inventory_types').select('id, name');

      const transformed = (invData || []).map(item => ({
        ...convertDates(item),
        location: locs?.find(l => l.id === item.location_id)?.name || '',
        type: types?.find(t => t.id === item.type_id)?.name || ''
      }));

      setInventory(prev => append ? [...prev, ...transformed] : transformed);
      setHasMore((invData?.length || 0) === PAGE_SIZE);
      if (append) setPage(p => p + 1);
      else setPage(0);
    } catch (e) {
      console.error('Error fetching inventory page:', e);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  // Initial load
  useEffect(() => { fetchInventoryPage(false); }, []);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchCompleteData = async () => {
      try {
        // Set all loading states to true at the start
        setIsLoading(true);
        setIsTypesLoading(true);

        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*');

        if (locationsError) throw locationsError;
        
        if (locationsData) {
          console.log('Raw locations data:', locationsData);
          // Type assertion to ensure the status field is properly typed
          const typedLocationsData = locationsData.map(loc => ({
            ...loc,
            status: loc.status as 'active' | 'inactive'
          }));
          setLocations(typedLocationsData);
          console.log('Active locations:', typedLocationsData.filter(loc => loc.status === 'active'));
        }

        // Fetch inventory types
        const { data: typesData, error: typesError } = await supabase
          .from('inventory_types')
          .select('*');

        if (typesError) throw typesError;
        
        if (typesData) {
          console.log('Raw types data:', typesData);
          // Type assertion to ensure the status field is properly typed
          const typedTypesData = typesData.map(item => ({
            ...item,
            status: item.status as 'active' | 'inactive'
          }));
          setInventoryTypes(typedTypesData);
          console.log('Active types:', typedTypesData.filter(t => t.status === 'active'));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch data. Please try again.",
          variant: "destructive",
        });
      } finally {
        // Set all loading states to false
        setIsLoading(false);
        setIsTypesLoading(false);
      }
    };
    fetchCompleteData();
  }, [toast]);

  // Fetch inventory when activeTab changes
  useEffect(() => {
    if (activeTab === "inventory") {
      setIsInventoryLoading(true);
      fetchInventoryPage(false);
    } else if (activeTab === "types") {
      setIsTypesLoading(true);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    if (!isEditing) {
      // Fetch company code from settings table
      const fetchCompanyCode = async () => {
        const { data, error } = await supabase
          .from('settings')
          .select('company_code')
          .single();
        if (error) {
          console.error('Error fetching company_code:', error);
          return;
        }
        const companyCode = data?.company_code || '';
        setAddFormData(prev => ({
          ...prev,
          code: companyCode
        }));
      };
      fetchCompanyCode();
    }
  }, [isEditing]);

  const activeLocations = locations.filter(location => location.status === "active");
  const activeInventoryTypes = inventoryTypes.filter(type => type.status === "active");

  const handleEditInventory = (inventory: TransformedInventoryItem) => {
    if (!canEditPermission) {
      toast({
        title: "Error",
        description: "You do not have permission to edit inventory",
        variant: "destructive",
      });
      return;
    }

    setIsDialogOpen(true);
    
    // Find the matching location and inventory type
    const selectedLocation = activeLocations.find(loc => loc.id === inventory.location_id);
    const selectedType = activeInventoryTypes.find(type => type.id === inventory.type_id);
    
    // Get the exact values from the dropdown options
    const locationValue = selectedLocation ? selectedLocation.id : '';
    const typeValue = selectedType ? selectedType.id : '';
    
    console.log('Editing inventory:', {
      id: inventory.id,
      project: inventory.project,
      partition: inventory.partition,
      serial_number: inventory.serial_number,
      location: locationValue,
      type: selectedType?.name
    });

    setEditFormData({
      id: inventory.id,
      project: inventory.project,
      partition: inventory.partition,
      serial_number: inventory.serial_number,
      status: inventory.status,
      location_id: locationValue,
      last_scan_gate: inventory.last_scan_gate,
      rfid_tag: inventory.rfid_tag,
      created_by: inventory.created_by,
      code: inventory.code,
      type_id: typeValue
    });

    setIsEditing(true);
  };

  const handleAddInventory = () => {
    resetAddForm();
    setIsDialogOpen(true);
  };

  const handleDeleteInventory = async (id: string) => {
    if (!canEditPermission) {
      toast({
        title: "Error",
        description: "You do not have permission to delete inventory",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this inventory item? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message || 'Failed to delete inventory item');
      }

      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
        variant: "default"
      });

      fetchInventoryPage(false);
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete inventory",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInventoryType = async (id: string) => {
    if (!canEditPermission) {
      toast({
        title: "Error",
        description: "You do not have permission to delete inventory types",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('inventory_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setInventoryTypes(inventoryTypes.filter(type => type.id !== id));
      
      toast({
        title: "Inventory Type Deleted",
        description: "Inventory type has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting inventory type:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete inventory type. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to generate RFID tag
  const generateRFIDTag = () => {
    // Get values from form data
    const project = isEditing ? editFormData.project : addFormData.project;
    const partition = isEditing ? editFormData.partition : addFormData.partition;
    const serialNumber = isEditing ? editFormData.serial_number : addFormData.serial_number;

    // Validate required fields
    if (!project || !partition || !serialNumber) {
      throw new Error('Project, Partition, and Serial Number are required to generate RFID tag');
    }

    // Generate RFID tag in format: MOB + project + partition + serial_number
    return `${addFormData.code}${project}${partition}${serialNumber}`;
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!userProfile?.id) {
        throw new Error('User profile not found');
      }

      // Ensure we have a valid inventory type
      const selectedType = activeInventoryTypes.find(type => type.id === (isEditing ? editFormData.type_id : addFormData.type_id));
      if (!selectedType) {
        throw new Error('Invalid inventory type selected');
      }

      // Generate RFID tag if not provided
      let rfidTag;
      if (isEditing) {
        rfidTag = editFormData.rfid_tag;
      } else {
        rfidTag = generateRFIDTag();
      }

      // Check if inventory already exists (only for new items)
      if (!isEditing) {
        const { data: existingItem, error: fetchError } = await supabase
          .from('inventory')
          .select('id')
          .eq('rfid_tag', rfidTag)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking for existing inventory:', fetchError);
          throw new Error('Failed to check for existing inventory');
        }

        if (existingItem?.id) {
          throw new Error('Inventory item already exists');
        }
      }

      // Prepare the data for the database
      const inventoryData: DatabaseInventory = {
        id: (isEditing ? editFormData.id : addFormData.id) || undefined,
        rfid_tag: rfidTag,
        code: (isEditing ? editFormData.code : addFormData.code),
        project: (isEditing ? editFormData.project : addFormData.project),
        partition: (isEditing ? editFormData.partition : addFormData.partition),
        serial_number: (isEditing ? editFormData.serial_number : addFormData.serial_number),
        status: (isEditing ? editFormData.status : addFormData.status),
        last_scan_time: new Date().toISOString(),
        last_scan_gate: (isEditing ? editFormData.last_scan_gate : addFormData.last_scan_gate),
        created_at: new Date().toISOString(),
        created_by: userProfile.id,
        type_id: (isEditing ? editFormData.type_id : addFormData.type_id),
        location_id: (isEditing ? editFormData.location_id : addFormData.location_id)
      };

      // Save to database
      const { error } = await supabase
        .from('inventory')
        .upsert([inventoryData], {
          onConflict: 'rfid_tag',
          ignoreDuplicates: true
        });

      if (error) {
        throw new Error(error.message || 'Failed to save inventory');
      }

      toast({
        title: "Success",
        description: "Inventory item saved successfully",
        variant: "default"
      });

      // Reset form and close dialog
      setIsDialogOpen(false);
      fetchInventoryPage(false);
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save inventory",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveInventory(e);
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (typeFormData.code.length !== 3) {
      toast({
        title: "Invalid Code",
        description: "Type code must be exactly 3 characters",
        variant: "destructive",
      });
      return;
    }

    const codeExists = inventoryTypes.some(
      type => type.code === typeFormData.code && (!isTypeEditing || type.id !== typeFormData.id)
    );

    if (codeExists) {
      toast({
        title: "Code Already Exists",
        description: "Please use a unique type code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (isTypeEditing) {
        const { error } = await supabase
          .from('inventory_types')
          .update({
            code: typeFormData.code,
            name: typeFormData.name,
            description: typeFormData.description,
            status: typeFormData.status
          })
          .eq('id', typeFormData.id);
        
        if (error) throw error;
        
        setInventoryTypes(
          inventoryTypes.map((type) =>
            type.id === typeFormData.id ? { ...typeFormData } : type
          )
        );
        
        toast({
          title: "Inventory Type Updated",
          description: "Inventory type has been updated successfully",
        });
      } else {
        const { data, error } = await supabase
          .from('inventory_types')
          .insert({
            code: typeFormData.code,
            name: typeFormData.name,
            description: typeFormData.description,
            status: typeFormData.status
          })
          .select();
        
        if (error) throw error;
        
        if (data) {
          setInventoryTypes([...inventoryTypes, data[0] as InventoryType]);
          
          toast({
            title: "Inventory Type Added",
            description: `New inventory type ${typeFormData.name} has been added successfully`,
          });
        }
      }
      
      resetTypeForm();
      setIsTypeDialogOpen(false);
    } catch (error) {
      console.error('Error saving inventory type:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save inventory type. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditInventoryType = (type: InventoryType) => {
    if (!canEditPermission) {
      toast({
        title: "Error",
        description: "You do not have permission to edit inventory types",
        variant: "destructive",
      });
      return;
    }
    
    setTypeFormData(type);
    setIsTypeEditing(true);
    setIsTypeDialogOpen(true);
  };

  const filteredInventory = inventory.filter(item => {
    const term = searchTerm.toLowerCase();
    return [
      item.rfid_tag,
      item.code,
      item.project,
      item.partition,
      item.serial_number,
      item.type,
      item.location
    ].some(field => field.toLowerCase().includes(term));
  });

  const filteredInventoryTypes = inventoryTypes.filter((type) => {
    const searchableValues = [
      type.code,
      type.name,
      type.description,
    ].join(" ").toLowerCase();
    
    return searchableValues.includes(typeSearchTerm.toLowerCase());
  });

  const getTypeName = (code: string) => {
    console.log('Looking for type code:', code);
    const type = activeInventoryTypes.find(t => t.code === code);
    console.log('Found type:', type);
    return type ? type.name : code;
  };

  if (!isProfileLoaded) {
    return null;
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>
                  Manage your inventory items
                </CardDescription>
              </div>
              <Button
                variant="default"
                onClick={handleAddInventory}
                disabled={!canEditPermission}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Inventory
              </Button>
            </CardHeader>
            <CardContent>
              {isInventoryLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search inventory..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inventory ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Scan</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No inventory found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInventory.map((inventory) => (
                          <TableRow key={inventory.id}>
                            <TableCell className="font-medium">{`${addFormData.code}${inventory.project}${inventory.partition}${inventory.serial_number}`}</TableCell>
                            <TableCell>{
                              activeInventoryTypes.find(type => type.id === inventory.type_id)?.name || 'Unknown'
                            }</TableCell>
                            <TableCell>{inventory.status}</TableCell>
                            <TableCell>{inventory.location}</TableCell>
                            <TableCell>{formatDate(inventory.created_at)}</TableCell>
                            <TableCell>{inventory.last_scan_time ? formatDateTime(inventory.last_scan_time) : ''}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditInventory(inventory)}
                                  disabled={!canEditPermission}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteInventory(inventory.id)}
                                  disabled={!canEditPermission}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {hasMore && (
                    <div className="flex justify-center py-4">
                      <Button onClick={() => fetchInventoryPage(true)} disabled={isInventoryLoading}>
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="project">Project (4)</Label>
                          <Input
                            id="project"
                            name="project"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={isEditing ? editFormData.project : addFormData.project}
                            onChange={handleInputChange}
                            placeholder="e.g. 1001"
                            required
                            maxLength={4}
                            className="min-w-[100px]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="partition">Partition (2)</Label>
                          <Input
                            id="partition"
                            name="partition"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={isEditing ? editFormData.partition : addFormData.partition}
                            onChange={handleInputChange}
                            placeholder="e.g. 08"
                            required
                            maxLength={2}
                            className="min-w-[100px]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="serial_number">Serial Number (3)</Label>
                          <Input
                            id="serial_number"
                            name="serial_number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={isEditing ? editFormData.serial_number : addFormData.serial_number}
                            onChange={handleInputChange}
                            placeholder="e.g. 001"
                            required
                            maxLength={3}
                            className="min-w-[100px]"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="type">Inventory Type</Label>
                        <Select
                          value={isEditing ? editFormData.type_id : addFormData.type_id}
                          onValueChange={(value) => handleSelectChange("type_id", value)}
                          required
                        >
                          <SelectTrigger className="min-w-[100px]">
                            <SelectValue placeholder="Select inventory type" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeInventoryTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name} ({type.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Select
                          value={isEditing ? editFormData.location_id : addFormData.location_id}
                          onValueChange={(value) => handleSelectChange("location_id", value)}
                          required
                        >
                          <SelectTrigger className="min-w-[100px]">
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
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Types</CardTitle>
                <CardDescription>
                  Manage inventory types
                </CardDescription>
              </div>
              <Button
                variant="default"
                onClick={() => {
                  resetTypeForm();
                  setIsTypeDialogOpen(true);
                }}
                disabled={!canEditPermission}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Type
              </Button>
            </CardHeader>
            <CardContent>
              {isTypesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventoryTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No inventory types found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventoryTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.code}</TableCell>
                          <TableCell>{type.name}</TableCell>
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
                                onClick={() => handleEditInventoryType(type)}
                                disabled={!canEditPermission}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInventoryType(type.id)}
                                disabled={!canEditPermission}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                <DialogContent>
                  <form onSubmit={handleTypeSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {isTypeEditing ? "Edit Inventory Type" : "Add New Inventory Type"}
                      </DialogTitle>
                      <DialogDescription>
                        {isTypeEditing
                          ? "Update inventory type details"
                          : "Create a new inventory type"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="code">Type Code (3)</Label>
                          <Input
                            id="code"
                            name="code"
                            value={typeFormData.code}
                            onChange={handleTypeInputChange}
                            placeholder="e.g. PLT"
                            maxLength={3}
                            pattern="[A-Za-z0-9]{3}"
                            title="3 characters (letters and numbers only)"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="name">Type Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={typeFormData.name}
                            onChange={handleTypeInputChange}
                            placeholder="e.g. Pallet"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          name="description"
                          value={typeFormData.description}
                          onChange={handleTypeInputChange}
                          placeholder="Enter description"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={typeFormData.status}
                          onValueChange={(value) => {
                            const event = { target: { name: "status", value } } as React.ChangeEvent<HTMLInputElement>;
                            handleTypeInputChange(event);
                          }}
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
                        {isTypeEditing ? "Update Type" : "Add Type"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

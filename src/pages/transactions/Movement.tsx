import { useState, useEffect, useContext } from "react";
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
import { PlusCircle, Pencil, Trash2, Package, Loader2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { hasPermission as checkPermission } from "@/utils/permissions";
import { PERMISSIONS } from "@/utils/permissions";
import { User } from "@/types";

// Helper to format inventory movement timestamp as dd/mm/yyyy hh:mm:ss AM/PM
const formatTimestamp = (ts: string): string => {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hh = d.getHours();
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  const h = String(hh).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${h}:${min}:${sec} ${ampm}`;
};

const MOVEMENT_TYPES = {
  IN: 'in' as const,
  OUT: 'out' as const
} as const;

type MovementType = typeof MOVEMENT_TYPES[keyof typeof MOVEMENT_TYPES];

interface Movement {
  id: string;
  inventory_id: string;
  gate_id: string;
  movement_type: string;
  customer_location_id: string;
  previous_location_id: string;
  recorded_by: string;
  timestamp: string;
  inventory_code?: string;
  gate_name?: string;
  customer_name?: string;
  status?: string;
  remark?: string;
  reference_id?: string;
}

interface Gate {
  id: string;
  name: string;
  location_id: string;
  gate_type_id: string;
  gate_type_name: string;
}

interface Location {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  rfid_tag: string;
  code: string;
  project: string;
  partition: string;
  serial_number: string;
  status: string;
  last_scan_time: string;
  last_scan_gate: string;
  created_at: string;
  created_by: string;
  type_id: string;
  location_id: string;
}

interface GateType {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  default_location_id?: string;
}

interface CustomerLocation {
  id: string;
  name: string;
  customer_id: string;
}

interface MovementItem {
  id: string;
  rfid_tag: string;
  location_id: string;
}

interface MovementData {
  items: MovementItem[];
  movement_type: string;
  customer_id: string;
  customer_location_from_id: string;
  customer_location_to_id: string;
  gate_id: string;
  remark?: string;
}

export default function Movement() {
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [gateTypes, setGateTypes] = useState<GateType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLocations, setCustomerLocations] = useState<CustomerLocation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState<MovementData>({
    items: [],
    movement_type: MOVEMENT_TYPES.OUT,
    customer_id: '',
    customer_location_from_id: '',
    customer_location_to_id: '',
    gate_id: '',
    remark: ''
  });
  const [scannedItems, setScannedItems] = useState<MovementItem[]>([]);
  const [userHasPermission, setUserHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState<any>(null);
  // Map to store id -> location_name for all customer locations (including previous_location_id and customer_location_id)
  const [customerLocationsMap, setCustomerLocationsMap] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  // Pagination for movements list
  const PAGE_SIZE = 500;
  const [page, setPage] = useState(0);
  const [allMovements, setAllMovements] = useState<Movement[]>([]);
  const [displayedMovements, setDisplayedMovements] = useState<Movement[]>([]);
  const [hasMoreMovements, setHasMoreMovements] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const session = localStorage.getItem('session');
        if (!session) {
          setPermissionError(true);
          setUserHasPermission(false);
          setLoading(false);
          return;
        }

        const sessionData = JSON.parse(session);
        const now = new Date().getTime();
        if (now > sessionData.expiresAt) {
          setPermissionError(true);
          setUserHasPermission(false);
          setLoading(false);
          return;
        }

        // Get user data from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionData.user.id)
          .single();

        if (!profileData) {
          setPermissionError(true);
          setUserHasPermission(false);
          setLoading(false);
          return;
        }

        // Check if user has the permission
        const hasPerm = checkPermission(profileData.role, PERMISSIONS.INVENTORY_MOVEMENT);
        
        if (!hasPerm) {
          setPermissionError(true);
          setUserHasPermission(false);
          setLoading(false);
          return;
        }

        setUserHasPermission(true);

        // Fetch all data
        const [movementsData, inventoryData, locationsData, gatesData, gateTypesData, customersData, settingsData] = await Promise.all([
          fetchMovements(), // fetch full grouped latest movements
          fetchInventoryItems(),
          fetchLocations(),
          fetchGates(),
          fetchGateTypes(),
          fetchCustomers(),
          getBaseCustomerLocation()
        ]);

        // Update state
        // Paginate movements
        setAllMovements(movementsData);
        setDisplayedMovements(movementsData.slice(0, PAGE_SIZE));
        setHasMoreMovements(movementsData.length > PAGE_SIZE);
        setPage(0);
        // Build customerLocationsMap for id -> location_name using all customerLocations fetched in fetchMovements scope
        // This ensures all ids in movements (including previous_location_id) are mapped
        const customerLocationMap = new Map<string, string>();
        // Use customerLocations from fetchMovements (not the state)
        if (Array.isArray(movementsData)) {
          // Gather all unique customer location IDs from movements
          const allLocationIds = new Set();
          movementsData.forEach(mov => {
            if (mov.customer_location_id) allLocationIds.add(mov.customer_location_id);
            if (mov.previous_location_id) allLocationIds.add(mov.previous_location_id);
          });
          // Fetch all those customer locations from customerLocations table
          const { data: allCustomerLocations, error: allCustomerLocationsError } = await supabase
            .from('customer_locations')
            .select('id, location_name')
            .in('id', Array.from(allLocationIds));
          if (!allCustomerLocationsError && Array.isArray(allCustomerLocations)) {
            allCustomerLocations.forEach(loc => {
              customerLocationMap.set(loc.id, loc.location_name);
            });
          }
        }
        setCustomerLocationsMap(customerLocationMap);
        setInventoryItems(inventoryData);
        setLocations(locationsData);
        setGates(gatesData);
        setGateTypes(gateTypesData);
        setCustomers(customersData);
        setSettings(settingsData);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing:', error);
        setPermissionError(true);
        setUserHasPermission(false);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (permissionError) {
      toast({
        title: "Error",
        description: "You don't have permission to manage inventory movements",
        variant: "destructive",
      });
    }
  }, [permissionError]);

  const canManageMovements = () => {
    return userHasPermission;
  };

  const fetchMovements = async () => {
    try {
      const { data: movementsData, error: movementsError } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(0, 3000);  // fetch up to 3001 rows

      if (movementsError) throw movementsError;

      // Fetch related data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, rfid_tag')
        .in('id', movementsData.map(m => m.inventory_id));

      if (inventoryError) throw inventoryError;

      const { data: gatesData, error: gatesError } = await supabase
        .from('gates')
        .select('id, name')
        .in('id', movementsData.map(m => m.gate_id));

      if (gatesError) throw gatesError;

      const { data: customerLocationsData, error: customerLocationsError } = await supabase
        .from('customer_locations')
        .select('id, location_name')
        .in('id', movementsData.map(m => m.customer_location_id));

      if (customerLocationsError) throw customerLocationsError;

      // Group movements by inventory_id and select the latest by timestamp
      const latestMovementsMap = new Map();
      for (const movement of movementsData) {
        const existing = latestMovementsMap.get(movement.inventory_id);
        if (!existing || new Date(movement.timestamp) > new Date(existing.timestamp)) {
          latestMovementsMap.set(movement.inventory_id, movement);
        }
      }
      const latestMovements = Array.from(latestMovementsMap.values());

      // Format only the latest movements with human-readable names
      const formattedMovements = latestMovements.map(movement => ({
        ...movement,
        inventory_code: inventoryData.find(item => item.id === movement.inventory_id)?.rfid_tag || movement.inventory_id,
        gate_name: gatesData.find(gate => gate.id === movement.gate_id)?.name || movement.gate_id,
        customer_name: customerLocationsData.find(loc => loc.id === movement.customer_location_id)?.location_name || movement.customer_location_id,
        movement_type: movement.movement_type.toUpperCase()
      }));

      return formattedMovements;
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch movements",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, rfid_tag, code, project, partition, serial_number, status, last_scan_time, last_scan_gate, created_at, created_by, type_id, location_id')
        .order('rfid_tag');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory items",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchLocations = async () => {
    try {
      const { data: locationsData, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return locationsData || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchGates = async () => {
    try {
      const { data: gatesData, error } = await supabase
        .from('gates')
        .select('id, name, location_id, gate_type_id, gate_types(name)')
        .order('name');

      if (error) throw error;
      return gatesData?.map(gate => ({
        id: gate.id,
        name: gate.name,
        location_id: gate.location_id,
        gate_type_id: gate.gate_type_id,
        // gate_types returns an array of related records
        gate_type_name: Array.isArray(gate.gate_types)
          ? gate.gate_types[0]?.name || ''
          : ''
      })) || [];
    } catch (error) {
      console.error('Error fetching gates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch gates",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchGateTypes = async () => {
    try {
      const { data: gateTypesData, error } = await supabase
        .from('gate_types')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return gateTypesData || [];
    } catch (error) {
      console.error('Error fetching gate types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch gate types",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return customersData || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
      return [];
    }
  };

  const getBaseCustomerLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('base_location_id, base_customer_id')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting base customer:', error);
      return null;
    }
  };

  const getFilteredGates = () => {
    const selectedLocation = formData.customer_id;
    if (!selectedLocation || !gates) return [];
    
    return gates.filter(gate => gate.location_id === selectedLocation);
  };

  const isRentalMovement = (movement: Movement) => {
    if (!settings) return false;
    
    // Rental starts when moving from base location to customer location
    // Rental ends when moving from customer location to base location
    return movement.customer_location_id !== settings.base_location_id;
  };

  const deleteMovement = async (movementId: string) => {
    try {
      // Only delete by full UUID (no short ID lookup)
      const { error } = await supabase
        .from('inventory_movements')
        .delete()
        .eq('id', movementId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Movement deleted successfully",
      });
      // Refresh the movements list
      setMovements(await fetchMovements());
    } catch (error) {
      console.error('Error deleting movement:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? (error.message || String(error)) : "Failed to delete movement",
        variant: "destructive",
      });
    }
  };

  const handleInventoryScan = async (rfidTag: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, location_id, status')
        .eq('rfid_tag', rfidTag)
        .single();

      if (error) throw error;
      
      if (data) {
        // Check if the item is in In-Stock status (only for OUT movements)
        if (formData.movement_type === 'out' && data.status !== 'In-Stock') {
          toast({
            title: "Error",
            description: "This item is not In-Stock.",
            variant: "destructive"
          });
          return;
        }
        // Additional checks for IN movements during scan
        if (formData.movement_type === 'in') {
          if (data.status === 'In-Stock') {
            toast({
              title: "Error",
              description: `Item ${rfidTag} is already In-Stock. IN movement not allowed.`,
              variant: "destructive"
            });
            return;
          }
          if (data.status === 'Received' || data.status === 'In-Transit') {
            toast({
              title: "Warning",
              description: `Item ${rfidTag} is ${data.status}. Only items with status 'Returned' should be moved IN, but this will be allowed.`,
              variant: "destructive"
            });
          }
        }
        const existingItem = scannedItems.find(item => item.id === data.id);
        if (!existingItem) {
          setScannedItems(prev => [...prev, {
            id: data.id,
            rfid_tag: rfidTag,
            location_id: data.location_id
          }]);
          toast({
            title: "Success",
            description: `Item ${rfidTag} scanned successfully`
          });
        } else {
          toast({
            title: "Warning",
            description: "Item already scanned",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Not Found",
          description: "No item found with this Inventory ID",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error scanning inventory:', error);
      toast({
        title: "Error",
        description: "Failed to scan inventory",
        variant: "destructive"
      });
    }
  };

  const handleCreateMovement = async () => {
    if (!scannedItems.length) {
      toast({
        title: "Error",
        description: "Please scan at least one item",
        variant: "destructive"
      });
      return;
    }

    if (!formData.customer_id) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      });
      return;
    }

    if (!formData.customer_location_from_id) {
      toast({
        title: "Error",
        description: "Please select a customer location (From)",
        variant: "destructive"
      });
      return;
    }

    if (!formData.customer_location_to_id) {
      toast({
        title: "Error",
        description: "Please select a customer location (To)",
        variant: "destructive"
      });
      return;
    }

    if (formData.customer_location_from_id === formData.customer_location_to_id) {
      toast({
        title: "Error",
        description: "From and To locations cannot be the same",
        variant: "destructive"
      });
      return;
    }

    if (!formData.gate_id) {
      toast({
        title: "Error",
        description: "Please select a gate",
        variant: "destructive"
      });
      return;
    }

    if (formData.movement_type === 'in') {
      // Fetch statuses for all scanned items
      const { data: inventoryStatusCheck, error: statusCheckError } = await supabase
        .from('inventory')
        .select('id, status, rfid_tag')
        .in('id', scannedItems.map(item => item.id));
      if (statusCheckError) {
        toast({
          title: "Error",
          description: "Failed to check item statuses",
          variant: "destructive"
        });
        return;
      }
      // Disallow IN movement for items already in 'In-Stock' status
      for (const item of inventoryStatusCheck) {
        if (item.status === 'In-Stock') {
          toast({
            title: "Error",
            description: `Item ${item.rfid_tag} is already In-Stock. IN movement is not allowed for this item.`,
            variant: "destructive"
          });
          return;
        }
        if (item.status === 'Received' || item.status === 'In-Transit') {
          toast({
            title: "Warning",
            description: `Item ${item.rfid_tag} is ${item.status}. Only items with status 'Returned' should be moved IN, but this will be allowed.`,
            variant: "destructive"
          });
        }
      }
    }

    let referenceId: string;
    if (formData.movement_type === 'out') {
      // new outbound batch
      referenceId = uuidv4();
    } else {
      // inherit reference from last outbound for first item
      const firstId = scannedItems[0]?.id;
      const { data: lastOut, error: lastErr } = await supabase
        .from('inventory_movements')
        .select('reference_id')
        .eq('inventory_id', firstId)
        .eq('movement_type', 'out')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      referenceId = (!lastErr && lastOut?.reference_id)
        ? lastOut.reference_id
        : uuidv4();
    }

    try {
      const { data: currentLocation, error: locationError } = await supabase
        .from('customer_locations')
        .select('id')
        .eq('id', formData.customer_location_to_id)
        .single();

      if (locationError) throw locationError;

      // Fetch current locations of scanned items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, location_id')
        .in('id', scannedItems.map(item => item.id));

      if (inventoryError) throw inventoryError;

      // Create movements with proper location references
      const movements = scannedItems.map((item: MovementItem) => ({
        inventory_id: item.id,
        gate_id: formData.gate_id,
        movement_type: formData.movement_type.toLowerCase(),
        customer_location_id: formData.customer_location_to_id, // To
        previous_location_id: formData.customer_location_from_id, // From
        recorded_by: JSON.parse(localStorage.getItem('session')).user.id,
        remark: formData.remark || null,
        reference_id: referenceId
      }));

      const { error: insertError } = await supabase
        .from('inventory_movements')
        .insert(movements);

      if (insertError) throw insertError;

      // Update inventory status
      if (formData.movement_type === 'out') {
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            status: 'In-Transit',
            last_scan_time: new Date().toISOString(),
            last_scan_gate: formData.gate_id
          })
          .in('id', scannedItems.map(item => item.id));

        if (updateError) {
          console.error('Error updating inventory status:', updateError);
          toast({
            title: "Error",
            description: "Failed to update inventory status",
            variant: "destructive"
          });
          return;
        }
      }
      if (formData.movement_type === 'in') {
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            status: 'In-Stock',
            last_scan_time: new Date().toISOString(),
            last_scan_gate: formData.gate_id
          })
          .in('id', scannedItems.map(item => item.id));

        if (updateError) {
          console.error('Error updating inventory status:', updateError);
          toast({
            title: "Error",
            description: "Failed to update inventory status",
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: "Movements created successfully",
      });
      setIsDialogOpen(false);
      fetchMovements();
    } catch (error) {
      console.error('Error creating movement:', error);
      toast({
        title: "Error",
        description: "Failed to create movement",
        variant: "destructive",
      });
    }
  };

  const fetchCustomerLocations = async (customerId: string) => {
    try {
      const { data: customerLocations, error } = await supabase
        .from('customer_locations')
        .select('id, location_name')
        .eq('customer_id', customerId)
        .order('location_name');

      if (error) throw error;
      return customerLocations?.map(loc => ({
        id: loc.id,
        name: loc.location_name,
        customer_id: customerId
      })) || [];
    } catch (error) {
      console.error('Error fetching customer locations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer locations",
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    if (formData.customer_id) {
      fetchCustomerLocations(formData.customer_id).then(data => {
        setCustomerLocations(data);
        if (data.length > 0) {
          setFormData(prev => ({
            ...prev,
            customer_location_from_id: data[0].id,
            customer_location_to_id: data[0].id
          }));
        }
      }).catch(error => {
        console.error('Error fetching customer locations:', error);
        toast({
          title: "Error",
          description: "Failed to fetch customer locations",
          variant: "destructive",
        });
      });
    } else {
      setCustomerLocations([]);
      setFormData(prev => ({
        ...prev,
        customer_location_from_id: '',
        customer_location_to_id: ''
      }));
    }
  }, [formData.customer_id, toast]);

  const filteredMovements = displayedMovements.filter(
    m => (m.customer_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         m.inventory_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isBaseCustomer = (customerId: string) => {
    if (!customers) return false;
    const baseCustomer = customers.find(c => c.id === customerId);
    return baseCustomer !== undefined;
  };

  const getCustomerLocations = (customerId: string) => {
    if (!customerId || !locations) return [];
    
    // Get the customer's locations
    const customerLocations = locations.filter(location => 
      location.id === settings.base_location_id || // Always include base location
      customers.find(c => c.id === customerId)?.default_location_id === location.id
    );
    
    return customerLocations;
  };

  const inventoryStatusMap = new Map(inventoryItems.map(item => [item.id, item.status]));

  const handleNext = async () => {
    if (formData.movement_type === 'in') {
      const { data: statusList, error: statusError } = await supabase
        .from('inventory')
        .select('id, status, rfid_tag')
        .in('id', scannedItems.map(item => item.id));
      if (statusError) {
        toast({ title: "Error", description: "Failed to check item statuses", variant: "destructive" });
        return;
      }
      for (const item of statusList) {
        if (item.status === 'In-Stock') {
          toast({ title: "Error", description: `Item ${item.rfid_tag} is In-Stock. Cannot proceed.`, variant: "destructive" });
          return;
        }
        if (item.status === 'Received' || item.status === 'In-Transit') {
          toast({ title: "Warning", description: `Item ${item.rfid_tag} is ${item.status}. Only 'Returned' is preferred.`, variant: "destructive" });
        }
      }
    }
    setIsScanning(false);
  };

  return (
    <div className="container mx-auto py-8">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : permissionError ? (
        <div className="text-red-500 text-center py-4">
          You do not have permission to access this page.
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Inventory Movements</h2>
            <Button
              onClick={() => {
                setIsDialogOpen(true);
                setIsScanning(true);
              }}
              disabled={!userHasPermission}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Movement
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Input
              placeholder="Search movements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inventory ID</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Movement</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => {
                  // Display From using previous_location_id (customer location name if available)
                  const fromLocation = customerLocationsMap.get(movement.previous_location_id) || movement.previous_location_id || '';
                  const toLocation = customerLocationsMap.get(movement.customer_location_id) || movement.customer_location_id || '';
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>{movement.inventory_code}</TableCell>
                      <TableCell>{movement.gate_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={movement.movement_type === 'IN' ? 'secondary' : 'outline'}
                          className={movement.movement_type === 'IN' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {movement.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-900">{fromLocation}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-900">{toLocation}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded font-semibold text-xs
                          ${movement.status === 'In-Stock' ? 'bg-green-100 text-green-800' : ''}
                          ${movement.status === 'In-Transit' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${movement.status === 'Lost' ? 'bg-red-100 text-red-800' : ''}
                          ${!['In-Stock','In-Transit','Lost'].includes(movement.status) ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {movement.status || inventoryStatusMap.get(movement.inventory_id) || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>{formatTimestamp(movement.timestamp)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
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
          </div>

          {hasMoreMovements && (
            <div className="flex justify-center py-4">
              <Button
                onClick={() => {
                  setIsLoadingMore(true);
                  const nextPage = page + 1;
                  const nextSlice = allMovements.slice(0, (nextPage + 1) * PAGE_SIZE);
                  setDisplayedMovements(nextSlice);
                  setPage(nextPage);
                  setHasMoreMovements(allMovements.length > nextSlice.length);
                  setIsLoadingMore(false);
                }}
                disabled={isLoadingMore}
              >
                Load more
              </Button>
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Movement</DialogTitle>
                <DialogDescription>
                  {isScanning ? (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="movement_type">Movement Type</Label>
                        <Select
                          value={formData.movement_type || 'out'}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, movement_type: value }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select movement type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in">IN - Move from Customer Location to Base Location</SelectItem>
                            <SelectItem value="out">OUT - Move from Base Location to Customer Location</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Scan Inventory Items</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Scan Inventory ID"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleInventoryScan(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            onClick={handleNext}
                            disabled={scannedItems.length === 0}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                      {scannedItems.length > 0 && (
                        <div className="space-y-2">
                          <Label>Scanned Items</Label>
                          <div className="space-y-1">
                            {scannedItems.map((item, index) => (
                              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                <span>{index + 1}. {item.rfid_tag}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setScannedItems(prev => prev.filter(i => i.id !== item.id));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="customer_id">Customer</Label>
                        <Select
                          value={formData.customer_id || ''}
                          onValueChange={(value) => {
                            setFormData(prev => ({ 
                              ...prev, 
                              customer_id: value,
                              customer_location_from_id: '',
                              customer_location_to_id: ''
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers && customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="customer_location_from_id">Customer Location (From)</Label>
                        <Select
                          value={formData.customer_location_from_id || ''}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, customer_location_from_id: value }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer location (From)" />
                          </SelectTrigger>
                          <SelectContent>
                            {customerLocations.length > 0 ? (
                              customerLocations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_customer_selected" disabled>
                                Please select a customer first
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="customer_location_to_id">Customer Location (To)</Label>
                        <Select
                          value={formData.customer_location_to_id || ''}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, customer_location_to_id: value }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer location (To)" />
                          </SelectTrigger>
                          <SelectContent>
                            {customerLocations.length > 0 ? (
                              customerLocations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_customer_selected" disabled>
                                Please select a customer first
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="gate_id">Gate</Label>
                        <Select
                          value={formData.gate_id || ''}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, gate_id: value }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gate" />
                          </SelectTrigger>
                          <SelectContent>
                            {gates && gates.map((gate) => (
                              <SelectItem key={gate.id} value={gate.id}>
                                {gate.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="remark">Remark (optional)</Label>
                        <Input
                          id="remark"
                          placeholder="Enter notes or remarks"
                          value={formData.remark}
                          onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-left">From</Label>
                          <Label className="text-right">To</Label>
                        </div>
                        <div className="relative">
                          {/* Movement Icon */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <Truck className={`w-8 h-8 ${formData.movement_type === 'in' ? 'text-blue-500' : 'text-red-500'}`} />
                          </div>
                          
                          {/* Locations */}
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary" className={`px-4 py-2 ${formData.movement_type === 'in' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'}`}>
                              {formData.movement_type === 'in' ? (
                                customerLocations.find(loc => loc.id === formData.customer_location_from_id)?.name || 'Customer Location'
                              ) : (
                                locations.find(loc => loc.id === settings?.base_location_id)?.name || 'Base Location'
                              )}
                            </Badge>
                            <Badge variant="secondary" className={`px-4 py-2 ${formData.movement_type === 'in' ? 'bg-green-100 text-green-800' : 'bg-green-100 text-green-800'}`}>
                              {formData.movement_type === 'in' ? (
                                locations.find(loc => loc.id === settings?.base_location_id)?.name || 'Base Location'
                              ) : (
                                customerLocations.find(loc => loc.id === formData.customer_location_to_id)?.name || 'Customer Location'
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsScanning(true)}>
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          onClick={handleCreateMovement}
                          disabled={scannedItems.length === 0}
                        >
                          Process Movements
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

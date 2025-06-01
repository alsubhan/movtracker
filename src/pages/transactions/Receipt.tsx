import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid'; // used as fallback if no reference_id on outbound movement
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Inventory } from "@/types/index";
import { Trash2, Loader2, Search, X, Plus } from "lucide-react";
import { fetchLocations } from "@/utils/location";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type MovementItem = {
  id: string;
  rfid_tag: string;
  location: string;
  status: 'In-Stock' | 'In-Transit' | 'Received' | 'Returned';
};

interface ReceiptData {
  items: MovementItem[];
}

// Helper function to format dates as dd/mm/yyyy hh:mm
const formatDateTime = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export default function Receipt() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<Inventory[]>([]);
  const [scannedReceiveItems, setScannedReceiveItems] = useState<MovementItem[]>([]);
  const [scannedReturnItems, setScannedReturnItems] = useState<MovementItem[]>([]);
  const [rfidTag, setRfidTag] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  // User's assigned location for validation
  const [userLocationId, setUserLocationId] = useState<string | null>(null);
  const [baseCustomerLocationId, setBaseCustomerLocationId] = useState<string | null>(null);
  const [locations, setLocations] = useState<{id: string; name: string}[]>([]);
  const [tab, setTab] = useState<'receive'|'return'>('receive');
  const [searchInput, setSearchInput] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [filteredMovements, setFilteredMovements] = useState<any[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 1000;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRemoveItem = (itemId: string) => {
    if (tab === 'receive') {
      setScannedReceiveItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setScannedReturnItems(prev => prev.filter(item => item.id !== itemId));
    }

    toast({
      title: "Removed",
      description: "Item removed from receipt"
    });
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // Get session data
        const session = localStorage.getItem('session');
        if (!session) {
          toast({
            title: "Error",
            description: "Not logged in",
            variant: "destructive",
          });
          navigate('/auth/login');
          return;
        }

        // Fetch necessary data
        const inventoryData = await fetchInventoryItems();

        setInventoryItems(inventoryData);
        setLoading(false);
        // Preload customer locations for lookup
        const locs = await fetchLocations();
        setLocations(locs);
      } catch (error) {
        console.error('Error initializing:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    initialize();

    // Add error boundary for fetch operations
    const handleError = (error: any) => {
      console.error('Error in fetch operation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive"
      });
      setLoading(false);
    };

    // Fetch user's customer_location_id from profile
    (async () => {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const userId = session.user?.id;
      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('customer_location_id')
          .eq('id', userId)
          .single();
        if (!profileError && profile) setUserLocationId(profile.customer_location_id);
      }
    })();

    // Fetch base customer location from settings
    (async () => {
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('base_customer_location_id')
        .limit(1)
        .maybeSingle();
      
      if (!settingsError && settings) {
        setBaseCustomerLocationId(settings.base_customer_location_id);
      }
    })();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('status', 'In-Transit');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  };

  // Scan logic for Receive or Return
  const handleInventoryScan = async (rfidTag: string) => {
    try {
      // Fetch single inventory row by RFID
      const { data, error } = await supabase
        .from('inventory')
        .select('id, location_id, status')
        .eq('rfid_tag', rfidTag)
        .limit(1)
        .single();
      if (error) {
        // Handle 'no rows' as not found
        if (error.code === 'PGRST116') {
          toast({ title: 'Not Found', description: 'No item found with this Inventory ID', variant: 'destructive' });
          return;
        }
        console.error('Error scanning inventory:', error);
        toast({ title: 'Error', description: error.message || 'Failed to fetch inventory', variant: 'destructive' });
        return;
      }
      // data exists
      // Only allow scanning items with correct status
      if (tab === 'receive' && data.status !== 'In-Transit') {
        toast({
          title: "Error",
          description: "This item is not in transit. Cannot receive.",
          variant: "destructive"
        });
        return;
      }
      if (tab === 'return' && data.status !== 'Received') {
        toast({
          title: "Error",
          description: "This item is not received. Cannot return.",
          variant: "destructive"
        });
        return;
      }

      // Verify movement created for this inventory at user's location
      if (userLocationId) {
        const { data: lastMov, error: movErr } = await supabase
          .from('inventory_movements')
          .select('customer_location_id')
          .eq('inventory_id', data.id)
          .eq('movement_type', 'out')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
        if (movErr || lastMov.customer_location_id !== userLocationId) {
          // Show origin and user location names in error
          const originLoc = locations.find(loc => loc.id === lastMov.customer_location_id);
          const originName = originLoc?.name ?? lastMov.customer_location_id;
          const userLoc = locations.find(loc => loc.id === userLocationId!);
          const userName = userLoc?.name ?? userLocationId!;
          toast({
            title: 'Error',
            description: `Cannot receive: last sent from ${originName}, your location is ${userName}.`,
            variant: 'destructive'
          });
          return;
        }
      }
      // Display destination (To) location name matching logged-in user
      let locationName: string = data.location_id;
      if (userLocationId) {
        const dest = locations.find(loc => loc.id === userLocationId);
        if (dest) locationName = dest.name;
      }

      const existingItem = tab === 'receive' ? scannedReceiveItems.find(item => item.id === data.id) : scannedReturnItems.find(item => item.id === data.id);
      if (!existingItem) {
        if (tab === 'receive') {
          setScannedReceiveItems(prev => [...prev, {
            id: data.id,
            rfid_tag: rfidTag,
            location: locationName,
            status: data.status
          } as MovementItem]);
        } else {
          setScannedReturnItems(prev => [...prev, {
            id: data.id,
            rfid_tag: rfidTag,
            location: locationName,
            status: data.status
          } as MovementItem]);
        }
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
    } catch (error) {
      console.error('Error scanning inventory:', error);
      toast({
        title: "Error",
        description: "Failed to scan inventory",
        variant: "destructive"
      });
    }
  };

  // Process all Receive or Return
  const handleProcessAll = async () => {
    const itemsToProcess = tab === 'receive' ? scannedReceiveItems : scannedReturnItems;
    if (itemsToProcess.length === 0) {
      toast({ title: 'Info', description: tab === 'receive' ? 'No items to receive' : 'No items to return' });
      return;
    }
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const userId = session.user?.id;
      // Removed global batch reference. We'll reuse each item's outbound reference_id.
      await Promise.all(itemsToProcess.map(async (item) => {
        // get last OUT movement (include reference_id) for location fields
        const { data: outMovement } = await supabase
          .from('inventory_movements')
          .select('customer_location_id, previous_location_id, gate_id, reference_id')
          .eq('inventory_id', item.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        // Always use customer_locations.id for previous_location_id and customer_location_id
        const previousLocationId = outMovement?.previous_location_id;
        const customerLocationId = outMovement?.customer_location_id;

        const isReceive = tab === 'receive';
        const prevLoc = isReceive ? previousLocationId : customerLocationId;
        const custLoc = isReceive ? customerLocationId : baseCustomerLocationId;

        // reuse outbound reference_id (fallback to new if missing)
        const batchRef = outMovement?.reference_id ?? uuidv4();
        const { error: insertError } = await supabase
          .from('inventory_movements')
          .insert({
            inventory_id: item.id,
            movement_type: isReceive ? 'in' : 'out',
            previous_location_id: prevLoc, // swapped for Return
            customer_location_id: custLoc, // swapped for Return
            gate_id: outMovement?.gate_id ?? null,
            recorded_by: userId,
            reference_id: batchRef
          });
        if (insertError) {
          console.error('Insert movement error:', insertError);
          throw insertError;
        }

        if (tab === 'receive') {
          // update inventory to Received
          await supabase
            .from('inventory')
            .update({
              status: 'Received',
              last_scan_time: new Date().toISOString(),
              last_scan_gate: userLocationId,
              last_customer_location_id: customerLocationId
            })
            .eq('id', item.id);
        } else if (tab === 'return') {
          // update inventory to Returned
          await supabase
            .from('inventory')
            .update({
              status: 'Returned',
              last_scan_time: new Date().toISOString(),
              last_scan_gate: userLocationId
            })
            .eq('id', item.id);
        }
      }));
      toast({ title: 'Success', description: tab === 'receive' ? 'All items received' : 'All items returned' });
      if (tab === 'receive') { setScannedReceiveItems([]); } else { setScannedReturnItems([]); }
    } catch (e) {
      console.error('Error receiving items:', e);
      toast({ title: 'Error', description: tab === 'receive' ? 'Failed to receive items' : 'Failed to return items', variant: 'destructive' });
    }
  };

  const handleSearchMovements = async () => {
    if (!userLocationId) {
      console.log('No userLocationId available');
      return;
    }
    
    setIsLoadingMovements(true);
    try {
      console.log('Searching with params:', {
        userLocationId,
        movementType: tab === 'receive' ? 'out' : 'in',
        searchInput,
        tab
      });

      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          inventory!inner (
            id,
            rfid_tag,
            status,
            code
          ),
          previous_location:previous_location_id (
            location_name
          ),
          customer_location:customer_location_id (
            location_name
          )
        `)
        .eq('customer_location_id', userLocationId)
        .eq('movement_type', tab === 'receive' ? 'out' : 'in')
        .order('timestamp', { ascending: false })
        .limit(PAGE_SIZE);

      // Only apply search filter if there's a search term
      if (searchInput.trim()) {
        query = query.ilike('inventory.rfid_tag', `%${searchInput}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Raw data from database:', data?.map(m => ({
        id: m.id,
        inventory_id: m.inventory_id,
        rfid_tag: m.inventory?.rfid_tag,
        status: m.inventory?.status,
        movement_type: m.movement_type,
        timestamp: m.timestamp
      })));

      if (data) {
        // Filter the data based on status after fetching
        const filteredData = data.filter(movement => {
          const matchesStatus = tab === 'receive' 
            ? movement.inventory?.status === 'In-Transit'
            : movement.inventory?.status === 'Received';
          
          if (movement.inventory?.rfid_tag === 'SRP000765') {
            console.log('Found SRP000765:', {
              status: movement.inventory?.status,
              expectedStatus: tab === 'receive' ? 'In-Transit' : 'Received',
              matchesStatus,
              movementType: movement.movement_type,
              timestamp: movement.timestamp
            });
          }
          
          return matchesStatus;
        });
        
        console.log('Final filtered movements:', filteredData.map(m => ({
          id: m.id,
          inventory_id: m.inventory_id,
          rfid_tag: m.inventory?.rfid_tag,
          code: m.inventory?.code,
          status: m.inventory?.status,
          movement_type: m.movement_type,
          customer_location_id: m.customer_location_id,
          timestamp: m.timestamp
        })));
        
        setFilteredMovements(filteredData);
        setTotalCount(filteredData.length);
        setHasMore(filteredData.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error searching movements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch movements",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMovements(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setFilteredMovements([]);
    setTotalCount(0);
    setHasMore(false);
  };

  const loadMoreItems = async () => {
    if (!userLocationId) return;
    
    setIsLoadingMore(true);
    try {
      // Calculate the correct range for pagination
      const start = filteredMovements.length;
      const end = start + PAGE_SIZE - 1;

      console.log('Loading more items with range:', { start, end, currentCount: filteredMovements.length });

      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          inventory!inner (
            id,
            rfid_tag,
            status,
            code
          ),
          previous_location:previous_location_id (
            location_name
          ),
          customer_location:customer_location_id (
            location_name
          )
        `)
        .eq('customer_location_id', userLocationId)
        .eq('movement_type', tab === 'receive' ? 'out' : 'in')
        .order('timestamp', { ascending: false })
        .range(start, end);

      // Only apply search filter if there's a search term
      if (searchInput.trim()) {
        query = query.ilike('inventory.rfid_tag', `%${searchInput}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        console.log('Load more raw data:', data?.map(m => ({
          id: m.id,
          inventory_id: m.inventory_id,
          rfid_tag: m.inventory?.rfid_tag,
          status: m.inventory?.status,
          movement_type: m.movement_type,
          timestamp: m.timestamp
        })));

        // Filter the data based on status after fetching
        const filteredData = data.filter(movement => {
          const matchesStatus = tab === 'receive' 
            ? movement.inventory?.status === 'In-Transit'
            : movement.inventory?.status === 'Received';
          
          if (movement.inventory?.rfid_tag === 'SRP000765') {
            console.log('Found SRP000765 in load more:', {
              status: movement.inventory?.status,
              expectedStatus: tab === 'receive' ? 'In-Transit' : 'Received',
              matchesStatus,
              movementType: movement.movement_type,
              timestamp: movement.timestamp
            });
          }
          
          return matchesStatus;
        });

        // Check for duplicates before adding new data
        const newData = filteredData.filter(newItem => 
          !filteredMovements.some(existingItem => 
            existingItem.id === newItem.id && 
            existingItem.inventory_id === newItem.inventory_id &&
            existingItem.timestamp === newItem.timestamp
          )
        );
        
        console.log('New unique items to add:', newData.length);
        
        setFilteredMovements(prev => [...prev, ...newData]);
        setHasMore(newData.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more movements:', error);
      toast({
        title: "Error",
        description: "Failed to load more movements",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Helper function to format batch reference
  const formatBatchReference = (referenceId: string | null) => {
    if (!referenceId) return '-';
    return referenceId.substring(0, 8).toUpperCase();
  };

  // Update useEffect to handle tab changes
  useEffect(() => {
    if (userLocationId) {
      // Reset search input and movements when tab changes
      setSearchInput("");
      setFilteredMovements([]);
      setTotalCount(0);
      setHasMore(false);
      handleSearchMovements();
    }
  }, [userLocationId, tab]); // Added tab dependency

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Receipt Management</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {tab === 'receive' ? 'Receive Items' : 'Return Items'}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as 'receive'|'return')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="receive">Receive</TabsTrigger>
          <TabsTrigger value="return">Return</TabsTrigger>
        </TabsList>

        <TabsContent value="receive">
      <Card>
        <CardHeader>
              <CardTitle>Receive Movements</CardTitle>
              <CardDescription>
                View and manage movements for receiving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 w-[400px]">
                    <Input
                      placeholder="Search Inventory ID..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchMovements();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSearchMovements}
                      className="h-10"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearSearch}
                      className="h-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                {isLoadingMovements ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <div className="text-sm text-muted-foreground">
                        {filteredMovements.length} OUT movements found
                      </div>
                      {hasMore && (
                        <Button 
                          onClick={loadMoreItems} 
                          disabled={isLoadingMore}
                          className="flex items-center gap-2"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load More'
                          )}
                        </Button>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Inventory ID</TableHead>
                          <TableHead>Movement</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Remark</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No OUT movements found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMovements.map((movement) => (
                            <TableRow key={`${movement.id}-${movement.inventory_id}-${movement.timestamp}`}>
                              <TableCell className="font-medium">
                                {movement.inventory?.rfid_tag || movement.inventory?.code || '-'}
                              </TableCell>
                              <TableCell>
                                <span className="uppercase">{movement.movement_type}</span>
                              </TableCell>
                              <TableCell>
                                {movement.previous_location?.location_name}
                              </TableCell>
                              <TableCell>
                                {movement.customer_location?.location_name}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  movement.inventory?.status === 'In-Transit' 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : movement.inventory?.status === 'Received'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {movement.inventory?.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatBatchReference(movement.reference_id)}
                              </TableCell>
                              <TableCell>
                                {formatDateTime(new Date(movement.timestamp))}
                              </TableCell>
                              <TableCell>
                                {movement.remark}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="return">
          <Card>
            <CardHeader>
              <CardTitle>Return Movements</CardTitle>
              <CardDescription>
                View and manage movements for returns
              </CardDescription>
        </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 w-[400px]">
                    <Input
                      placeholder="Search Inventory ID..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchMovements();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSearchMovements}
                      className="h-10"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearSearch}
                      className="h-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                {isLoadingMovements ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <div className="text-sm text-muted-foreground">
                        {filteredMovements.length} IN movements found
                      </div>
                      {hasMore && (
                        <Button 
                          onClick={loadMoreItems} 
                          disabled={isLoadingMore}
                          className="flex items-center gap-2"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load More'
                          )}
                        </Button>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Inventory ID</TableHead>
                          <TableHead>Movement</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Remark</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No IN movements found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMovements.map((movement) => (
                            <TableRow key={`${movement.id}-${movement.inventory_id}-${movement.timestamp}`}>
                              <TableCell className="font-medium">
                                {movement.inventory?.rfid_tag || movement.inventory?.code || '-'}
                              </TableCell>
                              <TableCell>
                                <span className="uppercase">{movement.movement_type}</span>
                              </TableCell>
                              <TableCell>
                                {movement.previous_location?.location_name}
                              </TableCell>
                              <TableCell>
                                {movement.customer_location?.location_name}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  movement.inventory?.status === 'In-Transit' 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : movement.inventory?.status === 'Received'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {movement.inventory?.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatBatchReference(movement.reference_id)}
                              </TableCell>
                              <TableCell>
                                {formatDateTime(new Date(movement.timestamp))}
                              </TableCell>
                              <TableCell>
                                {movement.remark}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{tab === 'receive' ? 'Receive Items' : 'Return Items'}</DialogTitle>
            <DialogDescription>
              {tab === 'receive' ? 'Scan and receive items at your location' : 'Scan and return items to base location'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
          {tab === 'return' && baseCustomerLocationId && (
            <div className="space-y-2 mb-4">
              <Label>Return Location</Label>
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm text-muted-foreground">Items will be returned to:</div>
                <div className="font-medium">
                  {locations.find(loc => loc.id === baseCustomerLocationId)?.name || 'Base Customer Location'}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rfid">Scan Inventory ID</Label>
            <Input
              id="rfid"
              placeholder="Scan Inventory ID"
              value={rfidTag}
              onChange={(e) => setRfidTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInventoryScan(rfidTag);
                  setRfidTag('');
                }
              }}
            />
          </div>

          <div className="space-y-2">
              <Label>Scanned Items to {tab === 'receive' ? 'Receive' : 'Return'}</Label>
              <div className="text-sm text-muted-foreground">
                Total scanned items: {tab === 'receive' ? scannedReceiveItems.length : scannedReturnItems.length}
              </div>
            <ScrollArea className="h-64 overflow-y-auto space-y-2">
              {(tab === 'receive' ? scannedReceiveItems : scannedReturnItems).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div>
                    <span className="font-medium">{item.rfid_tag}</span>
                    <div className="text-sm text-muted-foreground">
                      {item.location}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
            {(tab === 'receive' ? scannedReceiveItems : scannedReturnItems).length > 0 && (
              <Button className="mt-2" onClick={handleProcessAll}>
                {tab === 'receive' ? 'Receive All' : 'Return All'}
              </Button>
            )}
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

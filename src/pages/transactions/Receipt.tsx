import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid'; // used as fallback if no reference_id on outbound movement
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Inventory } from "@/types/index";
import { Trash2 } from "lucide-react";
import { fetchLocations } from "@/utils/location";

type MovementItem = {
  id: string;
  rfid_tag: string;
  location: string;
  status: 'In-Stock' | 'In-Transit' | 'Received' | 'Returned';
};

interface ReceiptData {
  items: MovementItem[];
}

export default function Receipt() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<Inventory[]>([]);
  const [scannedItems, setScannedItems] = useState<MovementItem[]>([]);
  const [rfidTag, setRfidTag] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  // User's assigned location for validation
  const [userLocationId, setUserLocationId] = useState<string | null>(null);
  const [locations, setLocations] = useState<{id: string; name: string}[]>([]);
  const [tab, setTab] = useState<'receive'|'return'>('receive');

  const handleRemoveItem = (itemId: string) => {
    setScannedItems(scannedItems.filter(item => item.id !== itemId));
    setScannedItems(prev => prev.filter(item => item.id !== itemId));

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

      const existingItem = scannedItems.find(item => item.id === data.id);
      if (!existingItem) {
        setScannedItems(prev => [...prev, {
          id: data.id,
          rfid_tag: rfidTag,
          location: locationName,
          status: data.status
        } as MovementItem]);
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
    if (scannedItems.length === 0) {
      toast({ title: 'Info', description: 'No items to receive' });
      return;
    }
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const userId = session.user?.id;
      // Removed global batch reference. We'll reuse each item's outbound reference_id.
      await Promise.all(scannedItems.map(async (item) => {
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
        const custLoc = isReceive ? customerLocationId : previousLocationId;

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
              last_scan_gate: userLocationId
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
      setScannedItems([]);
    } catch (e) {
      console.error('Error receiving items:', e);
      toast({ title: 'Error', description: tab === 'receive' ? 'Failed to receive items' : 'Failed to return items', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex gap-4">
              <button className={tab==='receive' ? 'font-bold underline' : ''} onClick={()=>setTab('receive')}>Receive</button>
              <button className={tab==='return' ? 'font-bold underline' : ''} onClick={()=>setTab('return')}>Return</button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label>{tab === 'receive' ? 'Scanned Items to Receive' : 'Scanned Items to Return'}</Label>
            <div className="space-y-2">
              {scannedItems.map((item) => (
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
            </div>
            {scannedItems.length > 0 && (
              <Button className="mt-2" onClick={handleProcessAll}>
                {tab === 'receive' ? 'Receive All' : 'Return All'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

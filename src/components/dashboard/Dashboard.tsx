import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Box, 
  Package, 
  Package2, 
  Truck, 
  Building,
  IndianRupee
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

export const Dashboard = () => {
  const [inventoryCounts, setInventoryCounts] = useState<{
    total: number;
    inStock: number;
    inTransit: number;
    received: number;
    returned: number;
  }>({
    total: 0,
    inStock: 0,
    inTransit: 0,
    received: 0,
    returned: 0
  });
  
  const [inventoryByLocation, setInventoryByLocation] = useState<{
    location: string;
    count: number;
  }[]>([]);
  const [wipRentalTotal, setWipRentalTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Efficient counts with Supabase head+count
        const [{ count: total, error: totalErr },
               { count: inStock, error: inStockErr },
               { count: inTransit, error: inTransitErr },
               { count: received, error: receivedErr },
               { count: returned, error: returnedErr }]
          = await Promise.all([
            supabase.from('inventory').select('id', { count: 'exact', head: true }),
            supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('status', 'In-Stock'),
            supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('status', 'In-Transit'),
            supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('status', 'Received'),
            supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('status', 'Returned')
          ]);
        if (totalErr || inStockErr || inTransitErr || receivedErr || returnedErr) {
          throw totalErr || inStockErr || inTransitErr || receivedErr || returnedErr;
        }
        setInventoryCounts({
          total: total || 0,
          inStock: inStock || 0,
          inTransit: inTransit || 0,
          received: received || 0,
          returned: returned || 0
        });
          
        // Fetch all inventory and latest movements to include customer locations
        const items: { id: string; location_id: string | null }[] = [];
        let start = 0;
        const BATCH = 1000;
        while (true) {
          const { data: batchData, error: batchErr } = await supabase
            .from('inventory')
            .select('id, location_id')
            .range(start, start + BATCH - 1);
          if (batchErr) throw batchErr;
          if (!batchData || batchData.length === 0) break;
          items.push(...batchData);
          if (batchData.length < BATCH) break;
          start += BATCH;
        }

        // Latest movement per inventory
        let movStart = 0;
        const movements: { inventory_id: string; customer_location_id: string | null }[] = [];
        while (true) {
          const { data: batchMov, error: batchMovErr } = await supabase
            .from('inventory_movements')
            .select('inventory_id, customer_location_id')
            .order('timestamp', { ascending: false })
            .range(movStart, movStart + BATCH - 1);
          if (batchMovErr) throw batchMovErr;
          if (!batchMov || batchMov.length === 0) break;
          movements.push(...batchMov);
          if (batchMov.length < BATCH) break;
          movStart += BATCH;
        }
        const movementMap = new Map<string, string>();
        movements.forEach(m => {
          if (m.inventory_id && m.customer_location_id && !movementMap.has(m.inventory_id)) {
            movementMap.set(m.inventory_id, m.customer_location_id);
          }
        });

        // Collect all location IDs from movements and defaults
        const movedLocIds = new Set(movementMap.values());
        const defaultLocIds = new Set(items.map(i => i.location_id));
        const allLocIds = new Set([...movedLocIds, ...defaultLocIds]);

        // Fetch customer location names
        const { data: movLocData, error: movLocErr } = await supabase
          .from('customer_locations')
          .select('id, location_name')
          .in('id', Array.from(movedLocIds));
        if (movLocErr) throw movLocErr;

        // Fetch default location names
        const { data: defLocData, error: defLocErr } = await supabase
          .from('locations')
          .select('id, name')
          .in('id', Array.from(defaultLocIds));
        if (defLocErr) throw defLocErr;

        // Merge into map
        const locEntries: [string,string][] = [
          ...(movLocData?.map(l => [l.id, l.location_name] as [string,string]) ?? []),
          ...(defLocData?.map(l => [l.id, l.name] as [string,string]) ?? [])
        ];
        const locMap = new Map<string,string>(locEntries);

        // Build counts by resolved location
        const invByLoc = Array.from(allLocIds).map(locId => {
          const locationName = locMap.get(locId) || 'Unknown';
          const count = items.filter(item => (movementMap.get(item.id) || item.location_id) === locId).length;
          return { location: locationName, count };
        });
        setInventoryByLocation(invByLoc);

        // Calculate rental costs for WIP inventory
        const { data: rentalData, error: rentalError } = await supabase
          .from('inventory')
          .select('id, type_id')
          .eq('status', 'In-Transit');
        
        if (rentalError) throw rentalError;
        
        if (rentalData) {
          const totalRental = (rentalData.length || 0) * 50;
          setWipRentalTotal(totalRental);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <ScrollArea className="h-full w-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Inventory
              </CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryCounts.total}</div>
              <p className="text-xs text-muted-foreground">
                Tracking {inventoryCounts.total} inventory items across all locations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                In Stock
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryCounts.inStock}</div>
              <Progress 
                value={(inventoryCounts.inStock / (inventoryCounts.total || 1)) * 100} 
                className="h-2 mt-2 bg-blue-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((inventoryCounts.inStock / (inventoryCounts.total || 1)) * 100)}% of total inventory
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                In Transit
              </CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryCounts.inTransit}</div>
              <Progress 
                value={(inventoryCounts.inTransit / (inventoryCounts.total || 1)) * 100} 
                className="h-2 mt-2 bg-yellow-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((inventoryCounts.inTransit / (inventoryCounts.total || 1)) * 100)}% of total inventory
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Received
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryCounts.received}</div>
              <Progress 
                value={(inventoryCounts.received / (inventoryCounts.total || 1)) * 100} 
                className="h-2 mt-2 bg-green-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((inventoryCounts.received / (inventoryCounts.total || 1)) * 100)}% of total inventory
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Location</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryByLocation.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No location data available
                </div>
              ) : (
                <div className="space-y-4">
                  {inventoryByLocation.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center">
                          <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                          {item.location}
                        </span>
                        <div className="text-sm text-muted-foreground">
                          <span>{item.count} items</span>
                        </div>
                      </div>
                      <Progress 
                        value={(item.count / (inventoryCounts.total || 1)) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-60">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-40 w-40">
                    <svg className="h-full w-full" viewBox="0 0 20 20">
                      <circle r="10" cx="10" cy="10" fill="white" />
                      <circle 
                        r="5" 
                        cx="10" 
                        cy="10" 
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        strokeDasharray={`${(inventoryCounts.inStock / (inventoryCounts.total || 1)) * 31.4} 31.4`}
                        transform="rotate(-90) translate(-20)"
                      />
                      <circle 
                        r="5" 
                        cx="10" 
                        cy="10" 
                        fill="transparent"
                        stroke="#fcd34d"
                        strokeWidth="10"
                        strokeDasharray={`${(inventoryCounts.inTransit / (inventoryCounts.total || 1)) * 31.4} 31.4`}
                        strokeDashoffset={`${-1 * (inventoryCounts.inStock / (inventoryCounts.total || 1)) * 31.4}`}
                        transform="rotate(-90) translate(-20)"
                      />
                      <circle 
                        r="5" 
                        cx="10" 
                        cy="10" 
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeDasharray={`${(inventoryCounts.received / (inventoryCounts.total || 1)) * 31.4} 31.4`}
                        strokeDashoffset={`${-1 * ((inventoryCounts.inStock + inventoryCounts.inTransit) / (inventoryCounts.total || 1)) * 31.4}`}
                        transform="rotate(-90) translate(-20)"
                      />
                      <circle 
                        r="5" 
                        cx="10" 
                        cy="10" 
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="10"
                        strokeDasharray={`${(inventoryCounts.returned / (inventoryCounts.total || 1)) * 31.4} 31.4`}
                        strokeDashoffset={`${-1 * ((inventoryCounts.inStock + inventoryCounts.inTransit + inventoryCounts.received) / (inventoryCounts.total || 1)) * 31.4}`}
                        transform="rotate(-90) translate(-20)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{inventoryCounts.total}</span>
                    </div>
                  </div>
                  
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">In Stock: {inventoryCounts.inStock}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-yellow-400"></div>
                      <span className="text-sm font-medium">In Transit: {inventoryCounts.inTransit}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Received: {inventoryCounts.received}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium">Returned: {inventoryCounts.returned}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Dashboard;

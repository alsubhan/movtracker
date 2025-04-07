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
  const [inventoryCounts, setInventoryCounts] = useState({
    total: 0,
    inStock: 0,
    inWip: 0,
    dispatched: 0,
    damaged: 0
  });
  
  const [inventoryByLocation, setInventoryByLocation] = useState<{location: string, count: number}[]>([]);
  const [wipRentalTotal, setWipRentalTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Get inventory counts by status
        const { data: binsData, error: countError } = await supabase
          .from('bins')
          .select('id, status');
        
        if (countError) throw countError;
        
        if (binsData) {
          const total = binsData.length || 0;
          const inStock = binsData.filter(bin => bin.status === 'in-stock').length || 0;
          const inWip = binsData.filter(bin => bin.status === 'in-wip').length || 0;
          const dispatched = binsData.filter(bin => bin.status === 'dispatched').length || 0;
          const damaged = binsData.filter(bin => bin.status === 'damaged').length || 0;
          
          setInventoryCounts({
            total,
            inStock,
            inWip,
            dispatched,
            damaged
          });
        }
          
        // Get inventory counts by location
        const { data: locationData, error: locationError } = await supabase
          .from('bins')
          .select('location');
        
        if (locationError) throw locationError;
        
        if (locationData) {
          const locations = locationData.reduce((acc, bin) => {
            const locationName = bin.location;
            acc[locationName] = (acc[locationName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const formattedLocationData = Object.entries(locations).map(([location, count]) => ({
            location,
            count
          }));
          
          setInventoryByLocation(formattedLocationData);
        }
        
        // Calculate rental costs for WIP inventory
        const { data: rentalData, error: rentalError } = await supabase
          .from('bins')
          .select('id, customer_location_id, inventory_type')
          .eq('status', 'in-wip');
        
        if (rentalError) throw rentalError;
        
        if (rentalData) {
          // This is a simplified calculation - in a real app, you would need to
          // join with customer_locations to get the actual rental rates
          // Here we're assuming a fixed rate of 50 per item in WIP
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
                In WIP
              </CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryCounts.inWip}</div>
              <Progress 
                value={(inventoryCounts.inWip / (inventoryCounts.total || 1)) * 100} 
                className="h-2 mt-2 bg-yellow-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((inventoryCounts.inWip / (inventoryCounts.total || 1)) * 100)}% of total inventory
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Dispatched
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryCounts.dispatched}</div>
              <Progress 
                value={(inventoryCounts.dispatched / (inventoryCounts.total || 1)) * 100} 
                className="h-2 mt-2 bg-green-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((inventoryCounts.dispatched / (inventoryCounts.total || 1)) * 100)}% of total inventory
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
              <CardTitle className="flex items-center">
                <IndianRupee className="h-4 w-4 mr-2" />
                WIP Rental Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <div className="text-3xl font-bold">₹{wipRentalTotal.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Rental Cost for WIP Items</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-3 rounded-md">
                    <div className="text-xl font-medium">{inventoryCounts.inWip}</div>
                    <div className="text-sm text-muted-foreground">Items in WIP</div>
                  </div>
                  
                  <div className="border p-3 rounded-md">
                    <div className="text-xl font-medium">
                      ₹{inventoryCounts.inWip > 0 
                        ? (wipRentalTotal / inventoryCounts.inWip).toFixed(2) 
                        : "0.00"}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Cost per Item</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                      strokeDasharray={`${(inventoryCounts.inWip / (inventoryCounts.total || 1)) * 31.4} 31.4`}
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
                      strokeDasharray={`${(inventoryCounts.dispatched / (inventoryCounts.total || 1)) * 31.4} 31.4`}
                      strokeDashoffset={`${-1 * ((inventoryCounts.inStock + inventoryCounts.inWip) / (inventoryCounts.total || 1)) * 31.4}`}
                      transform="rotate(-90) translate(-20)"
                    />
                    <circle 
                      r="5" 
                      cx="10" 
                      cy="10" 
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="10"
                      strokeDasharray={`${(inventoryCounts.damaged / (inventoryCounts.total || 1)) * 31.4} 31.4`}
                      strokeDashoffset={`${-1 * ((inventoryCounts.inStock + inventoryCounts.inWip + inventoryCounts.dispatched) / (inventoryCounts.total || 1)) * 31.4}`}
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
                    <span className="text-sm font-medium">In WIP: {inventoryCounts.inWip}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Dispatched: {inventoryCounts.dispatched}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">Damaged: {inventoryCounts.damaged}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default Dashboard;

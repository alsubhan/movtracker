
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Box, 
  Package, 
  Truck, 
  Package2, 
  Clock, 
  AlertTriangle 
} from "lucide-react";

// Mock data for the dashboard - in a real app, this would come from an API
const dashboardData = {
  warehouseInventory: {
    fgInventory: 320,
    emptyInventory: 180,
    total: 500
  },
  wipInventory: {
    count: 120,
    total: 200
  },
  customerInventory: [
    { name: "Toyota", count: 45 },
    { name: "Honda", count: 30 },
    { name: "Nissan", count: 25 },
  ],
  overdueInventory: 15,
  unusedInventory: 8
};

export const Dashboard = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium">System Online</span>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Inventory
                </CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.warehouseInventory.total}</div>
                <p className="text-xs text-muted-foreground">
                  Tracking {dashboardData.warehouseInventory.total} Inventory across all locations
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Warehouse Inventory
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.warehouseInventory.fgInventory + dashboardData.warehouseInventory.emptyInventory}</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-rfid-blue"></div>
                    <span>FG: {dashboardData.warehouseInventory.fgInventory}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                    <span>Empty: {dashboardData.warehouseInventory.emptyInventory}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  WIP Inventory
                </CardTitle>
                <Package2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.wipInventory.count}</div>
                <Progress 
                  value={(dashboardData.wipInventory.count / dashboardData.wipInventory.total) * 100} 
                  className="h-2 mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.wipInventory.count} of {dashboardData.wipInventory.total} capacity
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Customer Inventory
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.customerInventory.reduce((acc, customer) => acc + customer.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dispatched to {dashboardData.customerInventory.length} customers
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Inventory by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <div className="relative h-40 w-40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{dashboardData.warehouseInventory.total}</span>
                    </div>
                    <svg className="h-full w-full" viewBox="0 0 20 20">
                      <circle r="10" cx="10" cy="10" fill="white" />
                      <circle 
                        r="5" 
                        cx="10" 
                        cy="10" 
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        strokeDasharray={`${(dashboardData.warehouseInventory.fgInventory / dashboardData.warehouseInventory.total) * 31.4} 31.4`}
                        transform="rotate(-90) translate(-20)"
                      />
                      <circle 
                        r="5" 
                        cx="10" 
                        cy="10" 
                        fill="transparent"
                        stroke="#d1d5db"
                        strokeWidth="10"
                        strokeDasharray={`${(dashboardData.warehouseInventory.emptyInventory / dashboardData.warehouseInventory.total) * 31.4} 31.4`}
                        strokeDashoffset={`${-1 * (dashboardData.warehouseInventory.fgInventory / dashboardData.warehouseInventory.total) * 31.4}`}
                        transform="rotate(-90) translate(-20)"
                      />
                      <circle 
                        r="5" 
                        cx="10" 
                        cy="10" 
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeDasharray={`${(dashboardData.wipInventory.count / dashboardData.warehouseInventory.total) * 31.4} 31.4`}
                        strokeDashoffset={`${-1 * ((dashboardData.warehouseInventory.fgInventory + dashboardData.warehouseInventory.emptyInventory) / dashboardData.warehouseInventory.total) * 31.4}`}
                        transform="rotate(-90) translate(-20)"
                      />
                      <circle 
                        r="5" 
                        cx="10" 
                        cy="10" 
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="10"
                        strokeDasharray={`${(dashboardData.customerInventory.reduce((acc, customer) => acc + customer.count, 0) / dashboardData.warehouseInventory.total) * 31.4} 31.4`}
                        strokeDashoffset={`${-1 * ((dashboardData.warehouseInventory.fgInventory + dashboardData.warehouseInventory.emptyInventory + dashboardData.wipInventory.count) / dashboardData.warehouseInventory.total) * 31.4}`}
                        transform="rotate(-90) translate(-20)"
                      />
                    </svg>
                  </div>
                  
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-rfid-blue"></div>
                      <span className="text-sm font-medium">FG Warehouse: {dashboardData.warehouseInventory.fgInventory}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-gray-300"></div>
                      <span className="text-sm font-medium">Empty Warehouse: {dashboardData.warehouseInventory.emptyInventory}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-rfid-success"></div>
                      <span className="text-sm font-medium">WIP: {dashboardData.wipInventory.count}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-rfid-warning"></div>
                      <span className="text-sm font-medium">
                        Customer: {dashboardData.customerInventory.reduce((acc, customer) => acc + customer.count, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                      <Clock className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Overdue Inventory</p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.overdueInventory} inventory past turnaround time
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Unused Inventory</p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.unusedInventory} inventory unused for over 1 month
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <div className="absolute inset-0 rounded-full bg-green-400 opacity-40 animate-pulse-ring"></div>
                      <div className="z-10 h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">RFID System</p>
                      <p className="text-xs text-muted-foreground">
                        All readers online and functioning
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${i % 2 === 0 ? 'bg-rfid-success' : 'bg-rfid-warning'}`}></div>
                        <span className="font-medium">TOY1001080{i + 10}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Gate {i % 3 + 1}</span>
                        <span className="text-xs">{i % 2 === 0 ? 'In' : 'Out'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Customer  Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.customerInventory.map((customer, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{customer.name}</span>
                        <span className="text-sm text-muted-foreground">{customer.count} inventory</span>
                      </div>
                      <Progress value={(customer.count / 100) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">Advanced analytics module coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;

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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, ArrowRight, Box, Download, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { fetchCustomTableData } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define the movement type
interface Movement {
  id: string;
  inventoryId: string;
  gateId: string;
  movementType: string;
  timestamp: Date;
  location: string;
  previousLocation: string;
  customer: string;
  project: string;
}

const MovementReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMovements = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await fetchCustomTableData('movements', {
          range: {
            from: dateRange.from,
            to: dateRange.to,
            field: 'timestamp'
          }
        });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedData = data.map(item => ({
            id: item.id,
            inventoryId: item.inventory_id,
            gateId: item.gate_id,
            movementType: item.movement_type,
            timestamp: new Date(item.timestamp),
            location: item.location,
            previousLocation: item.previous_location || "",
            customer: item.customer || "",
            project: item.project || ""
          })) as Movement[];
          
          setMovements(formattedData);
        } else {
          // If no data from Supabase, use mock data for development
          const mockMovements = [
            {
              id: "1",
              inventoryId: "TOY100108001",
              gateId: "Gate 1",
              movementType: "out",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
              location: "customer",
              previousLocation: "warehouse",
              customer: "Toyota",
              project: "1001",
            },
            {
              id: "2",
              inventoryId: "HON200104002",
              gateId: "Gate 2",
              movementType: "in",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
              location: "wip",
              previousLocation: "warehouse",
              customer: "Honda",
              project: "2001",
            },
            {
              id: "3",
              inventoryId: "NIS300102003",
              gateId: "Gate 3",
              movementType: "in",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
              location: "warehouse",
              previousLocation: "wip",
              customer: "Nissan",
              project: "3001",
            },
            {
              id: "4",
              inventoryId: "TOY100108005",
              gateId: "Gate 1",
              movementType: "in",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
              location: "warehouse",
              previousLocation: "customer",
              customer: "Toyota",
              project: "1001",
            },
            {
              id: "5",
              inventoryId: "HON200104007",
              gateId: "Gate 2",
              movementType: "out",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
              location: "wip",
              previousLocation: "warehouse",
              customer: "Honda",
              project: "2001",
            },
          ];
          setMovements(mockMovements);
        }
      } catch (error) {
        console.error('Error fetching movements:', error);
        toast({
          title: "Error",
          description: "Failed to load movement data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMovements();
  }, [dateRange, toast]);

  // Filter movements based on search term
  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.inventoryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Export data as CSV
  const handleExport = () => {
    try {
      // Create CSV header
      let csv = "Inventory ID,Customer,Gate,Timestamp,Previous Location,Current Location,Movement Type\n";
      
      // Add data rows
      filteredMovements.forEach(movement => {
        const row = [
          movement.inventoryId,
          movement.customer,
          movement.gateId,
          movement.timestamp.toLocaleString(),
          movement.previousLocation,
          movement.location,
          movement.movementType
        ].map(value => `"${value}"`).join(',');
        
        csv += row + '\n';
      });
      
      // Create a download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `movement-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Movement report has been exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export movement report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Movement Report</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Movements Report</CardTitle>
            <CardDescription>
              Track all movements across gates and locations
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by inventory ID or customer..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline">Filter</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DatePickerWithRange 
                date={dateRange} 
                setDate={(newDateRange) => setDateRange(newDateRange || { from: undefined, to: undefined })} 
              />
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="text-lg">Loading movement data...</div>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Movements</TabsTrigger>
                <TabsTrigger value="in">In</TabsTrigger>
                <TabsTrigger value="out">Out</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventory ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Location Change</TableHead>
                      <TableHead>Movement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length > 0 ? (
                      filteredMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-muted-foreground" />
                              {movement.inventoryId}
                            </div>
                          </TableCell>
                          <TableCell>{movement.customer}</TableCell>
                          <TableCell>{movement.gateId}</TableCell>
                          <TableCell>
                            {movement.timestamp.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="font-medium">{movement.previousLocation}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-medium">{movement.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                movement.movementType === "in"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }
                            >
                              {movement.movementType === "in" ? "In" : "Out"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <FileText className="h-8 w-8 mb-2" />
                            <p>No movements found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="in">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventory ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Location Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.filter(m => m.movementType === "in").length > 0 ? (
                      filteredMovements
                        .filter(m => m.movementType === "in")
                        .map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-muted-foreground" />
                                {movement.inventoryId}
                              </div>
                            </TableCell>
                            <TableCell>{movement.customer}</TableCell>
                            <TableCell>{movement.gateId}</TableCell>
                            <TableCell>
                              {movement.timestamp.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-xs">
                                <span className="font-medium">{movement.previousLocation}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-medium">{movement.location}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <FileText className="h-8 w-8 mb-2" />
                            <p>No in movements found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="out">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventory ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Location Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.filter(m => m.movementType === "out").length > 0 ? (
                      filteredMovements
                        .filter(m => m.movementType === "out")
                        .map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-muted-foreground" />
                                {movement.inventoryId}
                              </div>
                            </TableCell>
                            <TableCell>{movement.customer}</TableCell>
                            <TableCell>{movement.gateId}</TableCell>
                            <TableCell>
                              {movement.timestamp.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-xs">
                                <span className="font-medium">{movement.previousLocation}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-medium">{movement.location}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <FileText className="h-8 w-8 mb-2" />
                            <p>No out movements found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementReport;

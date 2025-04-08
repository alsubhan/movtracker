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
import { SearchX, FileText, Download, Filter, AlertTriangle, Clock } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { fetchCustomTableData } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MissingItem {
  id: string;
  inventoryId: string;
  customer: string;
  project: string;
  lastSeen: {
    location: string;
    gate: string;
    timestamp: Date;
  };
  status: string;
  missingDays: number;
}

const MissingReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -90),
    to: new Date(),
  });
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMissingItems = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await fetchCustomTableData('missing_inventory', {
          range: {
            from: dateRange.from,
            to: dateRange.to,
            field: 'last_seen_timestamp'
          }
        });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedData = data.map(item => ({
            id: item.id,
            inventoryId: item.inventory_id,
            customer: item.customer,
            project: item.project || "",
            lastSeen: {
              location: item.last_seen_location,
              gate: item.last_seen_gate,
              timestamp: new Date(item.last_seen_timestamp)
            },
            status: item.status,
            missingDays: item.missing_days
          })) as MissingItem[];
          
          setMissingItems(formattedData);
        } else {
          // If no data from Supabase, use mock data for development
          const mockMissings = [
            {
              id: "1",
              inventoryId: "TOY100108010",
              customer: "Toyota",
              project: "1001",
              lastSeen: {
                location: "warehouse",
                gate: "Gate 1",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
              },
              status: "missing",
              missingDays: 30,
            },
            {
              id: "2",
              inventoryId: "HON200104015",
              customer: "Honda",
              project: "2001",
              lastSeen: {
                location: "wip",
                gate: "Gate 2",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
              },
              status: "missing",
              missingDays: 45,
            },
            {
              id: "3",
              inventoryId: "NIS300102025",
              customer: "Nissan",
              project: "3001",
              lastSeen: {
                location: "customer",
                gate: "Gate 3",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
              },
              status: "missing",
              missingDays: 15,
            },
            {
              id: "4",
              inventoryId: "TOY100108050",
              customer: "Toyota",
              project: "1001",
              lastSeen: {
                location: "customer",
                gate: "Gate 1",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
              },
              status: "long-missing",
              missingDays: 60,
            },
            {
              id: "5",
              inventoryId: "HON200104060",
              customer: "Honda",
              project: "2001",
              lastSeen: {
                location: "wip",
                gate: "Gate 2",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
              },
              status: "missing",
              missingDays: 20,
            },
          ];
          setMissingItems(mockMissings);
        }
      } catch (error) {
        console.error('Error fetching missing items:', error);
        toast({
          title: "Error",
          description: "Failed to load missing items data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMissingItems();
  }, [dateRange, toast]);

  const filteredMissings = missingItems.filter((inventory) => {
    const matchesSearch =
      inventory.inventoryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleExport = () => {
    try {
      let csv = "Inventory ID,Customer,Project,Last Seen Location,Last Seen Gate,Last Scan Date,Missing Days,Status\n";
      
      filteredMissings.forEach(item => {
        const row = [
          item.inventoryId,
          item.customer,
          item.project,
          item.lastSeen.location,
          item.lastSeen.gate,
          item.lastSeen.timestamp.toLocaleDateString(),
          item.missingDays,
          item.status
        ].map(value => `"${value}"`).join(',');
        
        csv += row + '\n';
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `missing-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Missing report has been exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export missing report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Missing Report</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Missing Report</CardTitle>
            <CardDescription>
              Track and locate Inventory that have not been scanned recently
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <SearchX className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
              <div className="text-lg">Loading missing data...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Missing &lt; 30 days</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {filteredMissings.filter((inventory) => inventory.missingDays < 30).length}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-orange-800">Missing 30-60 days</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {filteredMissings.filter((inventory) => inventory.missingDays >= 30 && inventory.missingDays < 60).length}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-red-800">Missing &gt; 60 days</p>
                        <p className="text-2xl font-bold text-red-900">
                          {filteredMissings.filter((inventory) => inventory.missingDays >= 60).length}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Last Seen Location</TableHead>
                    <TableHead>Last Seen Gate</TableHead>
                    <TableHead>Last Scan Date</TableHead>
                    <TableHead>Missing Days</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMissings.length > 0 ? (
                    filteredMissings.map((inventory) => (
                      <TableRow key={inventory.id}>
                        <TableCell className="font-medium">{inventory.inventoryId}</TableCell>
                        <TableCell>{inventory.customer}</TableCell>
                        <TableCell>{inventory.lastSeen.location}</TableCell>
                        <TableCell>{inventory.lastSeen.gate}</TableCell>
                        <TableCell>{inventory.lastSeen.timestamp.toLocaleDateString()}</TableCell>
                        <TableCell>{inventory.missingDays} days</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              inventory.missingDays < 30
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : inventory.missingDays < 60
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {inventory.missingDays < 30
                              ? "Recently Missing"
                              : inventory.missingDays < 60
                              ? "Missing"
                              : "Long Missing"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-8 w-8 mb-2" />
                          <p>No missing items found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MissingReport;

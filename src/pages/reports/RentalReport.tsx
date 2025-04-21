import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  IndianRupee, 
  Building, 
  ArrowRight, 
  Boxes, 
  Calendar, 
  Printer, 
  FileDown,
  Search,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RentalReport as RentalReportType } from "@/types";
import { DateRange } from "react-day-picker";
import { addDays, format, differenceInDays } from "date-fns";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RentalReport = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<RentalReportType[]>([]);
  const [filteredData, setFilteredData] = useState<RentalReportType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  // Pagination
  const PAGE_SIZE = 100;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Fetch data from Supabase
  useEffect(() => {
    const fetchRentalData = async () => {
      setIsLoading(true);
      try {
        // Fetch all OUT movements with customer and location
        const { data: movData, error: movErr } = await supabase
          .from('inventory_movements')
          .select('inventory_id, customer_location_id, timestamp, movement_type, reference_id')
          .eq('movement_type', 'out');
        if (movErr) throw movErr;
        const movements = movData ?? [];
        // group by reference_id and inventory_id to get unique OUT movements per item
        const uniqueMap = new Map<string, typeof movements[0]>();
        movements.forEach(m => {
          if (m.reference_id) {
            const key = `${m.reference_id}-${m.inventory_id}`;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, m);
            }
          }
        });
        const uniqueMovements = Array.from(uniqueMap.values());
        // If no unique OUT movements, skip further fetch
        if (uniqueMovements.length === 0) {
          setReportData([]);
          setFilteredData([]);
          setIsLoading(false);
          return;
        }
        // Fetch inventory columns (id, RFID, type reference)
        const invIds = uniqueMovements.map(m => m.inventory_id).filter((id): id is string => Boolean(id));
        const { data: invData, error: invErr } = await supabase
          .from('inventory')
          .select('id, rfid_tag, type_id')
          .in('id', invIds);
        if (invErr) throw invErr;
        const invMap = new Map(invData.map(i => [i.id, i]));
        // Fetch inventory type codes
        const typeIds = Array.from(new Set(invData.map(i => i.type_id))).filter((id): id is string => Boolean(id));
        const { data: typeData, error: typeErr } = await supabase
          .from('inventory_types')
          .select('id, code')
          .in('id', typeIds);
        if (typeErr) throw typeErr;
        const typeMap = new Map(typeData.map(t => [t.id, t.code]));
        // Fetch customer location details (rates, customer_id, location_name)
        const locIds = uniqueMovements.map(m => m.customer_location_id).filter((id): id is string => Boolean(id));
        const { data: locData, error: locErr } = await supabase
          .from('customer_locations')
          .select('id, customer_id, location_name, rental_rates')
          .in('id', locIds);
        if (locErr) throw locErr;
        // Map customer_location_id to its details
        const locMapData = new Map(locData.map(l => [l.id, { customer_id: l.customer_id, location_name: l.location_name, rental_rates: l.rental_rates }]));
        // Fetch customer names
        const custIds = Array.from(new Set(locData.map(l => l.customer_id))).filter((id): id is string => Boolean(id));
        const { data: custData, error: custErr } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', custIds);
        if (custErr) throw custErr;
        const custMap = new Map(custData.map(c => [c.id, c.name]));
        // Build report rows only for valid inventories
        const validMovements = uniqueMovements.filter(m => invMap.has(m.inventory_id));
        const rentalReports: RentalReportType[] = validMovements.map(m => {
          const inv = invMap.get(m.inventory_id)!;
          const cl = locMapData.get(m.customer_location_id);
          const customerName = cl ? (custMap.get(cl.customer_id) || cl.customer_id) : 'Unknown';
          const locationName = cl ? cl.location_name : 'Unknown';
          const rentalStartDate = new Date(m.timestamp);
          const daysRented = 7;
          // Determine rate key via fetched type code
          const typeCode = typeMap.get(inv.type_id) || inv.type_id || '';
          const rentalCost = cl?.rental_rates[typeCode] ?? 0;
          return {
            inventoryId: inv.rfid_tag || inv.id,
            inventoryType: typeCode,
            customer: customerName,
            location: locationName,
            status: 'out',
            rentalStartDate,
            rentalCost,
            daysRented,
            monthlyTotal: rentalCost * daysRented,
            dailyAverage: rentalCost
          };
        });
        setReportData(rentalReports);
        setFilteredData(rentalReports);
      } catch (error) {
        console.error('Error fetching rental data:', error);
        toast({
          title: "Failed to Load Data",
          description: "Could not load rental report data from the database. Using sample data instead.",
          variant: "destructive",
        });
        
        // Fallback to mock data
        const mockRentalData: RentalReportType[] = [
          {
            inventoryId: "TOY100108001",
            inventoryType: "PLT",
            customer: "Toyota",
            location: "customer",
            status: "Received",
            rentalStartDate: new Date(2023, 5, 15),
            rentalCost: 50,
            daysRented: 35,
            monthlyTotal: 50,
            dailyAverage: 1.67
          },
          {
            inventoryId: "HON200104002",
            inventoryType: "BIN",
            customer: "Honda",
            location: "warehouse",
            status: "In-Stock",
            rentalStartDate: new Date(2023, 6, 1),
            rentalCost: 75,
            daysRented: 15,
            monthlyTotal: 75,
            dailyAverage: 2.5
          },
          {
            inventoryId: "NIS300102003",
            inventoryType: "BOX",
            customer: "Nissan",
            location: "customer",
            status: "Received",
            rentalStartDate: new Date(2023, 4, 10),
            rentalCost: 25,
            daysRented: 55,
            monthlyTotal: 25,
            dailyAverage: 0.83
          },
          {
            inventoryId: "TOY100108004",
            inventoryType: "PLT",
            customer: "Toyota",
            location: "wip",
            status: "In-Transit",
            rentalStartDate: new Date(2023, 7, 5),
            rentalCost: 50,
            daysRented: 8,
            monthlyTotal: 50,
            dailyAverage: 1.67
          },
          {
            inventoryId: "SUZ400101005",
            inventoryType: "BIN",
            customer: "Suzuki",
            location: "customer",
            status: "Received",
            rentalStartDate: new Date(2023, 3, 20),
            rentalCost: 60,
            daysRented: 90,
            monthlyTotal: 60,
            dailyAverage: 2.0
          }
        ];
        setReportData(mockRentalData);
        setFilteredData(mockRentalData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRentalData();
  }, [toast]);

  // Get unique locations from data for filters, filtering out undefined/null
  const locations = [
    "all",
    ...Array.from(
      new Set(
        reportData.map(item => item.location).filter((loc): loc is string => Boolean(loc))
      )
    )
  ];

  // Apply filters when they change
  useEffect(() => {
    console.debug('[RentalReport] filtering', reportData.length, 'items with searchTerm:', searchTerm, 'selectedLocation:', selectedLocation, 'dateRange:', dateRange);
    let filtered = reportData;
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(item => item.inventoryId.toLowerCase().includes(term));
    }
    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(item => {
        const d = item.rentalStartDate;
        return d && d >= dateRange.from && d <= dateRange.to;
      });
    }
    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }
    setFilteredData(filtered);
    // reset pagination
    setPage(0);
    setHasMore(filtered.length > PAGE_SIZE);
  }, [reportData, searchTerm, selectedLocation, dateRange]);

  // Function to export data to CSV
  const exportToCSV = () => {
    const headers = ["Inventory ID", "Type", "Customer", "Location", "Status", "Start Date", "Days Rented", "Monthly Cost (₹)", "Daily Average (₹)"];
    
    const csvData = filteredData.map(item => [
      item.inventoryId,
      item.inventoryType || "-",
      item.customer,
      item.location,
      item.status,
      item.rentalStartDate ? format(item.rentalStartDate, "yyyy-MM-dd") : "-",
      item.daysRented,
      item.monthlyTotal.toFixed(2),
      item.dailyAverage.toFixed(2)
    ]);
    
    const csvContent = [
      headers,
      ...csvData
    ]
      .map(row => row.join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rental_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to print the report
  const printReport = () => {
    window.print();
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In-Stock":
        return "bg-green-50 text-green-700 border-green-200";
      case "In-Transit":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Received":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Get location badge color
  const getLocationBadge = (location: string) => {
    switch (location) {
      case "warehouse":
        return "bg-green-50 text-green-700 border-green-200";
      case "wip":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "customer":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };
  
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Rental Report</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <FileDown className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Rental Cost Analysis</CardTitle>
            <CardDescription>
              View and analyze rental costs by location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Filters: Location and Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="mb-2 block">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location === "all"
                            ? "All Locations"
                            : `${location.charAt(0).toUpperCase()}${location.slice(1)}`
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date-range" className="mb-2 block">Rental Start Date Range</Label>
                  <DatePickerWithRange id="date-range" date={dateRange} setDate={setDateRange} />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search Inventory ID"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 mr-2">
                      <IndianRupee className="h-3 w-3 mr-1" />
                      Monthly
                    </Badge>
                    <span className="font-medium">₹{filteredData.reduce((sum, item) => sum + item.monthlyTotal, 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 mr-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      Daily Avg
                    </Badge>
                    <span className="font-medium">₹{filteredData.reduce((sum, item) => sum + item.dailyAverage, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Results Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventory ID</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Monthly Cost (₹)</TableHead>
                      <TableHead>Daily Avg (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.slice(0, (page + 1) * PAGE_SIZE).map((item, idx) => (
                        <TableRow key={`${item.inventoryId}-${idx}`}>
                          <TableCell>{item.inventoryId}</TableCell>
                          <TableCell>{item.rentalStartDate ? format(item.rentalStartDate, 'dd-MM-yyyy') : '-'}</TableCell>
                          <TableCell>{item.daysRented}</TableCell>
                          <TableCell>{item.monthlyTotal.toFixed(2)}</TableCell>
                          <TableCell>{item.dailyAverage.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No rental data found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button onClick={() => setPage(p => p + 1)}>Load more</Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Removed Rental Summary section */}
      </div>
    </ScrollArea>
  );
};

export default RentalReport;

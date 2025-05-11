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
  Calendar as CalendarIcon, 
  Printer, 
  FileDown,
  Search,
  Loader2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RentalReport as RentalReportType } from "@/types";
import { format, differenceInDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const RentalReport = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<RentalReportType[]>([]);
  const [filteredData, setFilteredData] = useState<RentalReportType[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); // First day of the current month
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [toDate, setToDate] = useState<Date | null>(new Date()); // Today's date
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  
  // Fetch data from Supabase with pagination and date filtering
  useEffect(() => {
    const fetchRentalData = async () => {
      if (page === 0) {
      setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        // Calculate start and end of the selected date range
        const endOfRange = toDate ? new Date(toDate) : new Date();
        endOfRange.setHours(23, 59, 59, 999); // Set to end of the day

        // Build the base query
        let query = supabase
          .from('inventory_movements')
          .select('inventory_id, customer_location_id, previous_location_id, timestamp, movement_type, reference_id, rental_rate', { count: 'exact' })
          .eq('movement_type', 'out')
          .gt('rental_rate', 0)
          .lte('timestamp', endOfRange.toISOString()); // Use endOfRange

        // Debugging: Log the selected location
        console.log("Selected Location:", selectedLocation);

        // Add location filter if not 'all'
        if (selectedLocation && selectedLocation !== 'all') {
          query = query.eq('customer_location_id', selectedLocation);
        }

        // First get total count
        const { count, error: countError } = await query;
        if (countError) throw countError;
        setTotalCount(count || 0);

        // Fetch paginated movements
        const { data: movData, error: movErr } = await query
          .order('timestamp', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (movErr) {
          console.error('Error fetching movements:', movErr);
          if (page === 0) {
            setReportData([]);
            setFilteredData([]);
          }
          return;
        }

        // If no data is returned, handle accordingly
        if (!movData || movData.length === 0) {
          if (page === 0) {
          setReportData([]);
          setFilteredData([]);
          }
          return;
        }

        const movements = movData;

        // Get unique inventory IDs from current page
        const invIds = movements.map(m => m.inventory_id).filter((id): id is string => Boolean(id));
        
        // Fetch inventory data in batches
        const BATCH_SIZE = 100; // Define a batch size
        let allInventoryData = [];

        for (let i = 0; i < invIds.length; i += BATCH_SIZE) {
          const batchIds = invIds.slice(i, i + BATCH_SIZE); // Get a batch of IDs

          const { data: invResponse, error: invError } = await supabase
            .from('inventory')
            .select('id, rfid_tag, type_id')
            .in('id', batchIds); // Fetch only the current batch of IDs

          if (invError) throw invError;
          if (invResponse) {
            allInventoryData = [...allInventoryData, ...invResponse]; // Accumulate the results
          }
        }

        // Get unique customer IDs
        const custIds = Array.from(new Set(movements.map(m => m.customer_location_id))).filter((id): id is string => Boolean(id));
        
        // Fetch customer names
        const { data: custData, error: custErr } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', custIds);

        if (custErr) throw custErr;
        const custMap = new Map(custData.map(c => [c.id, c.name]));

        // Build report rows with proper rental calculations
        const newRentalReports: RentalReportType[] = movements
          .filter(m => allInventoryData.some(i => i.id === m.inventory_id))
          .map(m => {
          const inv = allInventoryData.find(i => i.id === m.inventory_id)!;
            const cl = custMap.get(m.customer_location_id);
          const customerName = cl ? (custMap.get(m.customer_location_id) || m.customer_location_id) : 'Unknown';
          const locationName = cl ? cl.location_name : 'Unknown';
          const rentalStartDate = new Date(m.timestamp);
            
            // Calculate days rented based on selected date
            const endDate = Math.min(endOfRange.getTime(), new Date().getTime());
            const daysRented = differenceInDays(
              endDate,
              rentalStartDate.getTime()
            ) + 1; // Add 1 to include both start and end dates
            
          const typeCode = inv.type_id || '';
          const rentalCost = m.rental_rate ?? 0;

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

        // Update states
        setReportData(prevData => {
          const updatedData = page === 0 ? newRentalReports : [...prevData, ...newRentalReports];
          return updatedData;
        });

        // Apply filters to the complete dataset
        const completeData = page === 0 ? newRentalReports : [...reportData, ...newRentalReports];
        const filtered = applyFilters(completeData, searchTerm, selectedLocation, selectedDate);
        setFilteredData(filtered);

      } catch (error) {
        console.error('Error fetching rental data:', error);
        toast({
          title: "Failed to Load Data",
          description: "Could not load rental report data from the database.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };
    
    fetchRentalData();
  }, [page, toDate, searchTerm, selectedLocation]);

  const loadMoreItems = () => {
    if (totalCount > (page + 1) * PAGE_SIZE) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  // Helper function to apply filters
  const applyFilters = (data: RentalReportType[], search: string, location: string, date: Date | null) => {
    let filtered = data;
    const term = search.trim().toLowerCase();
    
    if (term) {
      filtered = filtered.filter(item => item.inventoryId.toLowerCase().includes(term));
    }
    
    if (date) {
      filtered = filtered.filter(item => {
        const d = item.rentalStartDate;
        return d && d >= date;
      });
    }
    
    if (location !== 'all') {
      filtered = filtered.filter(item => item.location === location);
    }
    
    return filtered;
  };

  // Function to export data to CSV
  const exportToCSV = async () => {
    try {
      setIsLoading(true);

      // Calculate start and end of the selected date range
      const startOfDay = selectedDate ? new Date(selectedDate) : new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = toDate ? new Date(toDate) : new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Build the base query
      let query = supabase
        .from('inventory_movements')
        .select('inventory_id, customer_location_id, previous_location_id, timestamp, movement_type, reference_id, rental_rate', { count: 'exact' })
        .eq('movement_type', 'out')
        .gt('rental_rate', 0)
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString());

      // Add location filter if not 'all'
      if (selectedLocation && selectedLocation !== 'all') {
        query = query.eq('customer_location_id', selectedLocation);
      }

      // First get total count
      const { count, error: countError } = await query;
      if (countError) throw countError;

      const totalItems = count || 0;
      const BATCH_SIZE = 1000; // Set batch size to 1000
      let allMovements: any[] = [];

      // Fetch all movements in batches
      for (let offset = 0; offset < totalItems; offset += BATCH_SIZE) {
        const { data: batchData, error: batchError } = await query
          .order('timestamp', { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (batchError) throw batchError;
        if (batchData) {
          allMovements = [...allMovements, ...batchData];
        }
      }

      // Get unique inventory IDs from all movements
      const invIds = allMovements.map(m => m.inventory_id).filter((id): id is string => Boolean(id));
      
      // Fetch inventory data in batches
      const BATCH_SIZE_INV = 100; // Define a batch size for inventory
      let allInventoryData = [];

      for (let i = 0; i < invIds.length; i += BATCH_SIZE_INV) {
        const batchIds = invIds.slice(i, i + BATCH_SIZE_INV); // Get a batch of IDs

        const { data: invResponse, error: invError } = await supabase
          .from('inventory')
          .select('id, rfid_tag') // Only fetch necessary fields
          .in('id', batchIds); // Fetch only the current batch of IDs

        if (invError) throw invError;
        if (invResponse) {
          allInventoryData = [...allInventoryData, ...invResponse]; // Accumulate the results
        }
      }

      // Get unique customer IDs
      const custIds = Array.from(new Set(allMovements.map(m => m.customer_location_id))).filter((id): id is string => Boolean(id));
      
      // Fetch customer names
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('id, name')
        .in('id', custIds);

      if (custErr) throw custErr;
      const custMap = new Map(custData.map(c => [c.id, c.name]));

      // Build report rows with proper rental calculations
      const exportRows = allMovements
        .filter(m => allInventoryData.some(i => i.id === m.inventory_id))
        .map(m => {
          const inv = allInventoryData.find(i => i.id === m.inventory_id)!;
          const rentalStartDate = new Date(m.timestamp);
          
          // Calculate days rented based on selected date
          const endDate = Math.min(endOfDay.getTime(), new Date().getTime());
          const daysRented = differenceInDays(
            endDate,
            rentalStartDate.getTime()
          ) + 1; // Add 1 to include both start and end dates
          
          const rentalCost = m.rental_rate ?? 0;

          return {
            inventoryId: inv.rfid_tag || inv.id,
            rentalStartDate,
            daysRented,
            monthlyTotal: rentalCost * daysRented,
            dailyAverage: rentalCost
          };
        });

      // Generate CSV
      const headers = ["Inventory ID", "Start Date", "Days Rented", "Monthly Cost (₹)", "Daily Average (₹)"];
      const csvData = exportRows.map(item => [
        item.inventoryId,
        item.rentalStartDate ? format(item.rentalStartDate, "yyyy-MM-dd") : "-",
        item.daysRented,
        item.monthlyTotal.toFixed(2),
        item.dailyAverage.toFixed(2)
      ]);
      
      const csvContent = [
        headers,
        ...csvData
      ]
        .map(row => row.map(v => `"${v.toString().replace(/"/g, '""')}"`).join(","))
        .join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `rental_report_${format(selectedDate, "yyyy-MM")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${exportRows.length} items to CSV.`
      });
    } catch (error: any) {
      console.error('Error exporting rental data:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export rental data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

  // Update the location selection handler
  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    setPage(0); // Reset page when location changes
    setReportData([]); // Clear existing data
    setFilteredData([]); // Clear filtered data
  };

  // Assuming you have a function to fetch locations
  const fetchLocations = async () => {
    const { data, error } = await supabase.from('customer_locations').select('id, location_name');
    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
    // Add "All Locations" option
    return [
      { id: "all", name: "All Locations" },
      ...data.map(location => ({
        id: location.id, // UUID
        name: location.location_name // Human-readable name
      }))
    ];
  };

  // Fetch locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      const locs = await fetchLocations();
      setLocations(locs);
    };
    loadLocations();
  }, []);
  
  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-none p-4 md:p-8 pt-6 space-y-4">
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
              {/* Filters: Location, From Date, and To Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="location" className="mb-2 block">Location</Label>
                  <Select value={selectedLocation} onValueChange={handleLocationChange}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="from-date" className="mb-2 block">From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            const newSelectedDate = date;
                            if (toDate && differenceInDays(newSelectedDate, toDate) > 31) {
                              toast({
                                title: "Invalid Date Range",
                                description: "The date range cannot exceed 31 days.",
                                variant: "destructive",
                              });
                              return; // Prevent setting the date if the range is invalid
                            }
                            setSelectedDate(newSelectedDate);
                            setPage(0); // Reset page when date changes
                            setReportData([]); // Clear existing data
                            setFilteredData([]); // Clear filtered data
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="to-date" className="mb-2 block">To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={(date) => {
                          if (date) {
                            const newToDate = date;
                            if (selectedDate && differenceInDays(selectedDate, newToDate) > 31) {
                              toast({
                                title: "Invalid Date Range",
                                description: "The date range cannot exceed 31 days.",
                                variant: "destructive",
                              });
                              return; // Prevent setting the date if the range is invalid
                            }
                            setToDate(newToDate);
                            setPage(0); // Reset page when date changes
                            setReportData([]); // Clear existing data
                            setFilteredData([]); // Clear filtered data
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center space-x-2 w-full sm:w-64 mb-4 sm:mb-0">
                  <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search Inventory ID"
                    className="pl-8"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10"
                    onClick={() => {
                      setSearchTerm(searchInput);
                      setPage(0);
                    }}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10"
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                      setPage(0);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Daily Avg
                    </Badge>
                    <span className="font-medium">₹{filteredData.reduce((sum, item) => sum + item.dailyAverage, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
              </div>
              
      {/* Scrollable Data Section */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-8">
            <Card>
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div className="text-sm text-muted-foreground">
                      {filteredData.length} movements found
                    </div>
                    {totalCount > (page + 1) * PAGE_SIZE && (
                      <Button 
                        onClick={loadMoreItems} 
                        disabled={isLoadingMore}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
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
                      <TableHead>Start Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Monthly Cost (₹)</TableHead>
                      <TableHead>Daily Avg (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <p className="text-sm text-muted-foreground">Loading data...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredData.length > 0 ? (
                        filteredData.map((item, idx) => (
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
            </div>
          </CardContent>
        </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default RentalReport;

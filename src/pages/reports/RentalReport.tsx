
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
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RentalReport } from "@/types";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Mock data for rental report
const mockRentalData: RentalReport[] = [
  {
    inventoryId: "TOY100108001",
    inventoryType: "PLT",
    customer: "Toyota",
    location: "customer",
    status: "dispatched",
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
    status: "in-stock",
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
    status: "dispatched",
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
    status: "in-wip",
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
    status: "dispatched",
    rentalStartDate: new Date(2023, 3, 20),
    rentalCost: 60,
    daysRented: 90,
    monthlyTotal: 60,
    dailyAverage: 2.0
  }
];

const RentalReport = () => {
  const [reportData, setReportData] = useState<RentalReport[]>(mockRentalData);
  const [filteredData, setFilteredData] = useState<RentalReport[]>(mockRentalData);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [filterBy, setFilterBy] = useState<"location" | "status">("location");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Calculate total rental costs
  const totalMonthlyCost = filteredData.reduce((sum, item) => sum + item.monthlyTotal, 0);
  const totalDailyAverage = filteredData.reduce((sum, item) => sum + item.dailyAverage, 0);
  
  // Get unique locations and statuses from data for filters
  const locations = ["all", ...Array.from(new Set(reportData.map(item => item.location)))];
  const statuses = ["all", ...Array.from(new Set(reportData.map(item => item.status)))];

  // Apply filters when they change
  useEffect(() => {
    let filtered = reportData;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.inventoryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventoryType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by date range
    if (dateRange?.from) {
      filtered = filtered.filter(item => 
        item.rentalStartDate && item.rentalStartDate >= dateRange.from
      );
    }
    
    if (dateRange?.to) {
      filtered = filtered.filter(item => 
        item.rentalStartDate && item.rentalStartDate <= dateRange.to
      );
    }
    
    // Filter by location or status
    if (filterBy === "location" && selectedLocation !== "all") {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }
    
    if (filterBy === "status" && selectedStatus !== "all") {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }
    
    setFilteredData(filtered);
  }, [reportData, searchTerm, dateRange, filterBy, selectedLocation, selectedStatus]);

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
      case "in-stock":
        return "bg-green-50 text-green-700 border-green-200";
      case "in-wip":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "dispatched":
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
            <Button variant="outline" size="sm" onClick={printReport}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <FileDown className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Rental Cost Analysis</CardTitle>
            <CardDescription>
              View and analyze rental costs by location or inventory status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="filterBy" className="mb-2 block">Filter By</Label>
                  <RadioGroup 
                    id="filterBy"
                    value={filterBy}
                    onValueChange={(value) => setFilterBy(value as "location" | "status")}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="location" id="filter-location" />
                      <Label htmlFor="filter-location">Location</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="status" id="filter-status" />
                      <Label htmlFor="filter-status">Status</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {filterBy === "location" ? (
                  <div>
                    <Label htmlFor="location" className="mb-2 block">Location</Label>
                    <Select
                      value={selectedLocation}
                      onValueChange={setSelectedLocation}
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location === "all" ? "All Locations" : 
                              location.charAt(0).toUpperCase() + location.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="status" className="mb-2 block">Status</Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === "all" ? "All Statuses" : 
                              status === "in-stock" ? "In Stock" :
                              status === "in-wip" ? "In WIP" :
                              status === "dispatched" ? "Dispatched" : 
                              status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="date-range" className="mb-2 block">Rental Start Date Range</Label>
                  <DateRangePicker 
                    id="date-range"
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search inventory..."
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
                    <span className="font-medium">₹{totalMonthlyCost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 mr-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      Daily Avg
                    </Badge>
                    <span className="font-medium">₹{totalDailyAverage.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Results Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventory ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Monthly Cost (₹)</TableHead>
                      <TableHead>Daily Avg (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <TableRow key={item.inventoryId}>
                          <TableCell className="font-medium">{item.inventoryId}</TableCell>
                          <TableCell>{item.inventoryType || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              {item.customer}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getLocationBadge(item.location)}
                            >
                              {item.location === "warehouse"
                                ? "Warehouse"
                                : item.location === "wip"
                                ? "WIP"
                                : "Customer"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadge(item.status)}
                            >
                              {item.status === "in-stock"
                                ? "In Stock"
                                : item.status === "in-wip"
                                ? "In WIP"
                                : item.status === "dispatched"
                                ? "Dispatched"
                                : item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.rentalStartDate ? format(item.rentalStartDate, "MMM dd, yyyy") : "-"}
                          </TableCell>
                          <TableCell>{item.daysRented}</TableCell>
                          <TableCell className="font-medium">₹{item.monthlyTotal.toFixed(2)}</TableCell>
                          <TableCell>₹{item.dailyAverage.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4">
                          No rental data found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Rental Summary</CardTitle>
            <CardDescription>Breakdown by customer and location</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                Customer Breakdown
              </h3>
              
              <div className="space-y-3">
                {Array.from(new Set(filteredData.map(item => item.customer))).map(customer => {
                  const customerItems = filteredData.filter(item => item.customer === customer);
                  const total = customerItems.reduce((sum, item) => sum + item.monthlyTotal, 0);
                  
                  return (
                    <div key={customer} className="flex justify-between items-center">
                      <span>{customer}</span>
                      <span className="font-medium">₹{total.toFixed(2)}/month</span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{totalMonthlyCost.toFixed(2)}/month</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Boxes className="mr-2 h-4 w-4 text-muted-foreground" />
                Location Breakdown
              </h3>
              
              <div className="space-y-3">
                {Array.from(new Set(filteredData.map(item => item.location))).map(location => {
                  const locationItems = filteredData.filter(item => item.location === location);
                  const total = locationItems.reduce((sum, item) => sum + item.monthlyTotal, 0);
                  
                  return (
                    <div key={location} className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Badge
                          variant="outline"
                          className={getLocationBadge(location)}
                        >
                          {location === "warehouse"
                            ? "Warehouse"
                            : location === "wip"
                            ? "WIP"
                            : "Customer"}
                        </Badge>
                      </span>
                      <span className="font-medium">₹{total.toFixed(2)}/month</span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{totalMonthlyCost.toFixed(2)}/month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default RentalReport;

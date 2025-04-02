
import { useState } from "react";
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

// Mock data for product movements
const mockMovements = [
  {
    id: "1",
    productId: "TOY100108001",
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
    productId: "HON200104002",
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
    productId: "NIS300102003",
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
    productId: "TOY100108005",
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
    productId: "HON200104007",
    gateId: "Gate 2",
    movementType: "out",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    location: "wip",
    previousLocation: "warehouse",
    customer: "Honda",
    project: "2001",
  },
];

const ProductMovementReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  // Filter movements based on search term and date range
  const filteredMovements = mockMovements.filter((movement) => {
    const matchesSearch =
      movement.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const movementDate = movement.timestamp;
    const withinDateRange = 
      (!dateRange.from || movementDate >= dateRange.from) && 
      (!dateRange.to || movementDate <= dateRange.to);
    
    return matchesSearch && withinDateRange;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Product Movement Report</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Movements</CardTitle>
            <CardDescription>
              Track all product movements across gates and locations
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
                  placeholder="Search by product ID or customer..."
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
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Movements</TabsTrigger>
              <TabsTrigger value="in">Product In</TabsTrigger>
              <TabsTrigger value="out">Product Out</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
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
                            {movement.productId}
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
                          <p>No product movements found</p>
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
                    <TableHead>Product ID</TableHead>
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
                              {movement.productId}
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
                          <p>No product in movements found</p>
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
                    <TableHead>Product ID</TableHead>
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
                              {movement.productId}
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
                          <p>No product out movements found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductMovementReport;

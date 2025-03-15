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
import { SearchX, FileText, Download, Filter, AlertTriangle, Clock } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";

const mockMissingBins = [
  {
    id: "1",
    binId: "TOY100108010",
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
    binId: "HON200104015",
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
    binId: "NIS300102025",
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
    binId: "TOY100108050",
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
    binId: "HON200104060",
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

const MissingBinReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -90),
    to: new Date(),
  });

  const filteredMissingBins = mockMissingBins.filter((bin) => {
    const matchesSearch =
      bin.binId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bin.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const lastSeenDate = bin.lastSeen.timestamp;
    const withinDateRange = 
      (!dateRange.from || lastSeenDate >= dateRange.from) && 
      (!dateRange.to || lastSeenDate <= dateRange.to);
    
    return matchesSearch && withinDateRange;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Missing Bins Report</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Missing Bins</CardTitle>
            <CardDescription>
              Track and locate bins that have not been scanned recently
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
                  placeholder="Search by bin ID or customer..."
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Missing &lt; 30 days</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {mockMissingBins.filter((bin) => bin.missingDays < 30).length}
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
                      {mockMissingBins.filter((bin) => bin.missingDays >= 30 && bin.missingDays < 60).length}
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
                      {mockMissingBins.filter((bin) => bin.missingDays >= 60).length}
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
                <TableHead>Bin ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Last Seen Location</TableHead>
                <TableHead>Last Seen Gate</TableHead>
                <TableHead>Last Scan Date</TableHead>
                <TableHead>Missing Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMissingBins.length > 0 ? (
                filteredMissingBins.map((bin) => (
                  <TableRow key={bin.id}>
                    <TableCell className="font-medium">{bin.binId}</TableCell>
                    <TableCell>{bin.customer}</TableCell>
                    <TableCell>{bin.lastSeen.location}</TableCell>
                    <TableCell>{bin.lastSeen.gate}</TableCell>
                    <TableCell>{bin.lastSeen.timestamp.toLocaleDateString()}</TableCell>
                    <TableCell>{bin.missingDays} days</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          bin.missingDays < 30
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : bin.missingDays < 60
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {bin.missingDays < 30
                          ? "Recently Missing"
                          : bin.missingDays < 60
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
                      <p>No missing bins found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MissingBinReport;

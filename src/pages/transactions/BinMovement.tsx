
import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Box, Antenna, RotateCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface BinMovementData {
  id: string;
  binId: string;
  gateId: string;
  movementType: "in" | "out";
  timestamp: Date;
  location: string;
  previousLocation: string;
  customer: string;
  project: string;
}

const mockMovements: BinMovementData[] = [
  {
    id: "1",
    binId: "TOY100108001",
    gateId: "Gate 1",
    movementType: "out",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    location: "customer",
    previousLocation: "warehouse",
    customer: "Toyota",
    project: "1001",
  },
  {
    id: "2",
    binId: "HON200104002",
    gateId: "Gate 2",
    movementType: "in",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    location: "wip",
    previousLocation: "warehouse",
    customer: "Honda",
    project: "2001",
  },
  {
    id: "3",
    binId: "NIS300102003",
    gateId: "Gate 3",
    movementType: "in",
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    location: "warehouse",
    previousLocation: "wip",
    customer: "Nissan",
    project: "3001",
  },
  {
    id: "4",
    binId: "TOY100108005",
    gateId: "Gate 1",
    movementType: "in",
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
    location: "warehouse",
    previousLocation: "customer",
    customer: "Toyota",
    project: "1001",
  },
  {
    id: "5",
    binId: "HON200104007",
    gateId: "Gate 2",
    movementType: "out",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    location: "wip",
    previousLocation: "warehouse",
    customer: "Honda",
    project: "2001",
  },
];

const BinMovement = () => {
  const [searchParams] = useSearchParams();
  const movementType = searchParams.get("type") || "out";
  const location = useLocation();
  const { toast } = useToast();
  
  const [movements, setMovements] = useState<BinMovementData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [antennaAStatus, setAntennaAStatus] = useState<"idle" | "active" | "complete">("idle");
  const [antennaBStatus, setAntennaBStatus] = useState<"idle" | "active" | "complete">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedBins, setDetectedBins] = useState<string[]>([]);
  const [selectedGate, setSelectedGate] = useState("Gate 1");

  useEffect(() => {
    // Filter movements based on movement type from URL
    const filtered = mockMovements.filter(
      (movement) => movement.movementType === movementType
    );
    setMovements(filtered);
  }, [movementType]);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setDetectedBins([]);
    setAntennaAStatus("idle");
    setAntennaBStatus("idle");
    
    toast({
      title: "Scan Started",
      description: `Starting ${movementType === "in" ? "Bin In" : "Bin Out"} scan at ${selectedGate}`,
    });
    
    // Simulate antenna A activation
    setTimeout(() => {
      setAntennaAStatus("active");
      setScanProgress(20);
    }, 1000);
    
    // Simulate bins being detected by antenna A
    setTimeout(() => {
      const binsToDetect = movementType === "in" 
        ? ["TOY100108010", "TOY100108011", "HON200104015"] 
        : ["NIS300102020", "NIS300102021", "TOY100108025"];
      
      setDetectedBins(binsToDetect);
      setAntennaAStatus("complete");
      setScanProgress(50);
    }, 3000);
    
    // Simulate antenna B activation
    setTimeout(() => {
      setAntennaBStatus("active");
      setScanProgress(70);
    }, 4000);
    
    // Simulate scan completion
    setTimeout(() => {
      setAntennaBStatus("complete");
      setScanProgress(100);
      
      // Add the detected bins to the movements list
      const newMovements = detectedBins.map((binId, index) => ({
        id: `new-${Date.now()}-${index}`,
        binId,
        gateId: selectedGate,
        movementType: movementType as "in" | "out",
        timestamp: new Date(),
        location: movementType === "in" ? "warehouse" : "customer",
        previousLocation: movementType === "in" ? "customer" : "warehouse",
        customer: binId.substring(0, 3),
        project: binId.substring(3, 7),
      }));
      
      // Update movements
      setMovements((prev) => [...newMovements, ...prev]);
      
      toast({
        title: "Scan Complete",
        description: `${detectedBins.length} bins detected for ${movementType === "in" ? "Bin In" : "Bin Out"} movement`,
      });
      
      setIsScanning(false);
    }, 6000);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {movementType === "in" ? "Bin In Movement" : "Bin Out Movement"}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>RFID Scanner</CardTitle>
            <CardDescription>
              {movementType === "in"
                ? "Scan bins coming into the warehouse"
                : "Scan bins going out of the warehouse"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Gate</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedGate}
                  onChange={(e) => setSelectedGate(e.target.value)}
                  disabled={isScanning}
                >
                  <option value="Gate 1">Gate 1 - Warehouse</option>
                  <option value="Gate 2">Gate 2 - Production</option>
                  <option value="Gate 3">Gate 3 - Dispatch</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Antenna A</span>
                    <span>
                      {antennaAStatus === "idle" && "Ready"}
                      {antennaAStatus === "active" && "Scanning..."}
                      {antennaAStatus === "complete" && "Complete"}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${
                    antennaAStatus === "idle" ? "bg-gray-200" : 
                    antennaAStatus === "active" ? "bg-blue-500" : "bg-green-500"
                  }`}></div>
                </div>
                <Antenna className={`h-5 w-5 ${
                  antennaAStatus === "idle" ? "text-gray-400" : 
                  antennaAStatus === "active" ? "text-blue-500" : "text-green-500"
                }`} />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Antenna B</span>
                    <span>
                      {antennaBStatus === "idle" && "Ready"}
                      {antennaBStatus === "active" && "Scanning..."}
                      {antennaBStatus === "complete" && "Complete"}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${
                    antennaBStatus === "idle" ? "bg-gray-200" : 
                    antennaBStatus === "active" ? "bg-blue-500" : "bg-green-500"
                  }`}></div>
                </div>
                <Antenna className={`h-5 w-5 ${
                  antennaBStatus === "idle" ? "text-gray-400" : 
                  antennaBStatus === "active" ? "text-blue-500" : "text-green-500"
                }`} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Scan Progress</span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} />
              </div>
              
              {detectedBins.length > 0 && (
                <div className="border rounded-md p-3">
                  <h4 className="text-sm font-medium mb-2">Detected Bins</h4>
                  <div className="space-y-1">
                    {detectedBins.map((bin, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Box className="h-3 w-3 text-blue-500" />
                        <span>{bin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleStartScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  {movementType === "in" ? (
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Start Scanning
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
            <CardDescription>
              Recently tracked bin {movementType === "in" ? "in" : "out"} movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="space-y-4">
              <TabsList>
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bin ID</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Location Change</TableHead>
                      <TableHead>Movement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length > 0 ? (
                      movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-muted-foreground" />
                              {movement.binId}
                            </div>
                          </TableCell>
                          <TableCell>{movement.gateId}</TableCell>
                          <TableCell>
                            {movement.timestamp.toLocaleTimeString()}
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
                        <TableCell colSpan={5} className="text-center py-4">
                          No movements recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="summary">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Bins</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{movements.length}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">By Customer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Array.from(new Set(movements.map(m => m.customer))).map((customer, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span>{customer}</span>
                              <span className="font-medium">
                                {movements.filter(m => m.customer === customer).length}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Movement by Time</h4>
                    <div className="h-[100px] border rounded-md">
                      {/* Simple visual representation */}
                      <div className="h-full flex items-end px-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="flex-1 mx-0.5">
                            <div 
                              className="bg-blue-500 rounded-t-sm" 
                              style={{ 
                                height: `${Math.floor(Math.random() * 70) + 10}%`,
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BinMovement;

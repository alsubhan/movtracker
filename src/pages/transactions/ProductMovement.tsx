
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowRight, Box, Barcode, Scan } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProductMovementData {
  id: string;
  productId: string;
  gateId: string;
  movementType: "in" | "out";
  timestamp: Date;
  location: string;
  previousLocation: string;
  customer: string;
  project: string;
}

// Mock data for demo purposes
const mockMovements: ProductMovementData[] = [
  {
    id: "1",
    productId: "TOY100108001",
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
    productId: "HON200104002",
    gateId: "Gate 2",
    movementType: "in",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    location: "wip",
    previousLocation: "warehouse",
    customer: "Honda",
    project: "2001",
  },
];

// Mock customers for demo
const mockCustomers = [
  { id: "TOY", name: "Toyota" },
  { id: "HON", name: "Honda" },
  { id: "NIS", name: "Nissan" },
  { id: "SUZ", name: "Suzuki" },
];

const ProductMovement = () => {
  const [searchParams] = useSearchParams();
  const defaultMovementType = searchParams.get("type") || "out";
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [movements, setMovements] = useState<ProductMovementData[]>([]);
  const [selectedGate, setSelectedGate] = useState("Gate 1");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [movementType, setMovementType] = useState<"in" | "out">(defaultMovementType as "in" | "out");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load all movements initially
  useEffect(() => {
    setMovements(mockMovements);
  }, []);

  // Filter movements based on selected type
  const filteredMovements = movements.filter(
    (movement) => movement.movementType === movementType
  );

  // Handle barcode scan
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid barcode",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedCustomer && barcodeInput.length >= 3) {
      // Try to extract customer code from barcode
      const customerCode = barcodeInput.substring(0, 3);
      const customer = mockCustomers.find(c => c.id === customerCode);
      if (customer) {
        setSelectedCustomer(customer.id);
      }
    }
    
    const newMovement: ProductMovementData = {
      id: `manual-${Date.now()}`,
      productId: barcodeInput,
      gateId: selectedGate,
      movementType: movementType,
      timestamp: new Date(),
      location: movementType === "in" ? "warehouse" : "customer",
      previousLocation: movementType === "in" ? "customer" : "warehouse",
      customer: selectedCustomer || barcodeInput.substring(0, 3),
      project: barcodeInput.length >= 7 ? barcodeInput.substring(3, 7) : "",
    };
    
    // Save to database (mock)
    // In a real implementation, we would save to Supabase here
    
    // Add to local state
    setMovements((prev) => [newMovement, ...prev]);
    
    toast({
      title: "Barcode Scanned",
      description: `Product ${barcodeInput} registered as ${movementType === "in" ? "Product In" : "Product Out"} movement`,
    });
    
    // Reset input and focus for next scan
    setBarcodeInput("");
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Product Movement
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Product Scanner</CardTitle>
            <CardDescription>
              Scan products coming into or going out of the warehouse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Movement Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Movement Type</label>
                <RadioGroup 
                  value={movementType} 
                  onValueChange={(value) => setMovementType(value as "in" | "out")}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in" id="in" />
                    <label htmlFor="in" className="cursor-pointer">Product In</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="out" id="out" />
                    <label htmlFor="out" className="cursor-pointer">Product Out</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Select Customer</Label>
                <Select
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gate Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Gate</label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedGate}
                  onChange={(e) => setSelectedGate(e.target.value)}
                >
                  <option value="Gate 1">Gate 1 - Warehouse</option>
                  <option value="Gate 2">Gate 2 - Production</option>
                  <option value="Gate 3">Gate 3 - Dispatch</option>
                </select>
              </div>
              
              {/* Barcode Scanner */}
              <form onSubmit={handleBarcodeScan} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="barcode-input" className="text-sm font-medium">Scan or Enter Barcode</label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode-input"
                      ref={barcodeInputRef}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="e.g. TOY100108001"
                      className="flex-1"
                      autoComplete="off"
                      autoFocus
                    />
                    <Button type="submit" variant="outline" size="icon">
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Point your barcode scanner at the product label or manually enter the product ID
                </div>
              </form>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => barcodeInputRef.current?.focus()}
              variant="default"
            >
              <Barcode className="mr-2 h-4 w-4" />
              Focus Barcode Scanner
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
            <CardDescription>
              Recently tracked product {movementType === "in" ? "in" : "out"} movements
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
                      <TableHead>Product ID</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location Change</TableHead>
                      <TableHead>Type</TableHead>
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
                        <CardTitle className="text-sm">Total Products</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{filteredMovements.length}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">By Customer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Array.from(new Set(filteredMovements.map(m => m.customer))).map((customer, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span>{customer}</span>
                              <span className="font-medium">
                                {filteredMovements.filter(m => m.customer === customer).length}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
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

export default ProductMovement;

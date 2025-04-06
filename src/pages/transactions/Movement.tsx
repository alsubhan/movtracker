
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Barcode, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Box, 
  ChevronRight, 
  Truck,
  FileText,
  IndianRupee, 
  Download,
  DoorOpen
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";

// Updated mock data to match the new requirements
const mockLocations = [
  { id: "1", name: "Main Warehouse", code: "WH" },
  { id: "2", name: "Factory A", code: "FA" },
  { id: "3", name: "Distribution Center B", code: "DCB" },
  { id: "4", name: "Toyota Site", code: "TS" },
  { id: "5", name: "Honda Factory", code: "HF" },
];

const mockCustomers = [
  { 
    id: "1", code: "TOY", name: "Toyota", 
    locations: [
      { id: "4", name: "Toyota Site", rentalRates: { "PLT": 10, "CTN": 5, "CRT": 8 } },
      { id: "6", name: "Toyota Factory B", rentalRates: { "PLT": 12, "CTN": 6, "CRT": 9 } }
    ]
  },
  { 
    id: "2", code: "HON", name: "Honda", 
    locations: [
      { id: "5", name: "Honda Factory", rentalRates: { "PLT": 15, "CTN": 7, "CRT": 10 } }
    ]
  },
  { 
    id: "3", code: "DEF", name: "Defense Corp", 
    locations: [
      { id: "7", name: "Defense Site A", rentalRates: { "PLT": 20, "CTN": 10, "CRT": 15 } },
      { id: "8", name: "Defense Site B", rentalRates: { "PLT": 18, "CTN": 9, "CRT": 14 } }
    ]
  },
];

// Mock gates linked to locations
const mockGates = [
  { id: "G1", name: "Gate 1", locationId: "1" },
  { id: "G2", name: "Gate 2", locationId: "1" },
  { id: "G3", name: "Gate 3", locationId: "2" },
  { id: "G4", name: "Gate 4", locationId: "3" },
  { id: "G5", name: "Gate 5", locationId: "4" },
  { id: "G6", name: "Gate 6", locationId: "5" },
  { id: "G7", name: "Gate 7", locationId: "6" },
  { id: "G8", name: "Gate 8", locationId: "7" },
  { id: "G9", name: "Gate 9", locationId: "8" },
];

const mockInventoryItems = [
  { id: "TOY100108001", type: "PLT", customer: "TOY", project: "1001", location: "Main Warehouse" },
  { id: "TOY100108002", type: "CTN", customer: "TOY", project: "1001", location: "Main Warehouse" },
  { id: "DEF100208003", type: "CRT", customer: "DEF", project: "1002", location: "Factory A" },
  { id: "HON100308004", type: "PLT", customer: "HON", project: "1003", location: "Main Warehouse" },
  { id: "DEF100408005", type: "CTN", customer: "DEF", project: "1004", location: "Distribution Center B" },
];

// Mock company info for base customer and location
const mockCompanyInfo = {
  baseCustomerId: "1", // Toyota is the base customer
  baseLocationId: "1"  // Main Warehouse is the base location
};

const Movement = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("in");
  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedGate, setSelectedGate] = useState("");
  const [filteredGates, setFilteredGates] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedInventory, setSelectedInventory] = useState<any | null>(null);
  const [challanDetails, setChallanDetails] = useState({
    challanNo: "",
    customerName: "",
    customerAddress: "",
    items: [] as any[],
  });
  const [showChallan, setShowChallan] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [isDifferentCustomer, setIsDifferentCustomer] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(mockCompanyInfo);

  // Load company info from localStorage
  useEffect(() => {
    const savedCompanyInfo = localStorage.getItem('companyInfo');
    if (savedCompanyInfo) {
      try {
        const parsedInfo = JSON.parse(savedCompanyInfo);
        if (parsedInfo.baseCustomerId && parsedInfo.baseLocationId) {
          setCompanyInfo({
            baseCustomerId: parsedInfo.baseCustomerId,
            baseLocationId: parsedInfo.baseLocationId
          });
        }
      } catch (error) {
        console.error('Error parsing company info from localStorage', error);
      }
    }
  }, []);

  // Reset selections when tab changes
  useEffect(() => {
    setSelectedLocation("");
    setSelectedCustomer("");
    setSelectedGate("");
    setScannedItems([]);
    setFilteredGates([]);
    setFilteredLocations([]);
  }, [activeTab]);

  // Update available locations when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      const customer = mockCustomers.find(c => c.id === selectedCustomer);
      if (customer) {
        setFilteredLocations(customer.locations);
        if (customer.locations.length > 0) {
          setSelectedLocation(customer.locations[0]?.id || "");
        }
      }
    } else {
      setFilteredLocations([]);
      setSelectedLocation("");
    }
    setSelectedGate("");
  }, [selectedCustomer]);

  // Update available gates when location is selected
  useEffect(() => {
    if (selectedLocation) {
      const gates = mockGates.filter(gate => gate.locationId === selectedLocation);
      setFilteredGates(gates);
      if (gates.length > 0) {
        setSelectedGate(gates[0]?.id || "");
      }
    } else {
      setFilteredGates([]);
      setSelectedGate("");
    }
  }, [selectedLocation]);

  // Determine if it's a movement between different customers (for challan generation)
  useEffect(() => {
    if (scannedItems.length > 0 && selectedCustomer) {
      // Check if any item belongs to a different customer than selected
      const customerCode = mockCustomers.find(c => c.id === selectedCustomer)?.code;
      const differentCustomer = scannedItems.some(item => item.customer !== customerCode);
      
      // Also check if the selected customer is different from the base customer
      const isNotBaseCustomer = selectedCustomer !== companyInfo.baseCustomerId;
      
      setIsDifferentCustomer(differentCustomer || isNotBaseCustomer);
    } else {
      setIsDifferentCustomer(false);
    }
  }, [scannedItems, selectedCustomer, companyInfo.baseCustomerId]);

  const handleScan = () => {
    if (!barcode) {
      toast({
        title: "Scan Error",
        description: "Please enter a barcode to scan",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer before scanning items",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLocation) {
      toast({
        title: "Location Required",
        description: "Please select a location before scanning items",
        variant: "destructive",
      });
      return;
    }

    if (!selectedGate) {
      toast({
        title: "Gate Required",
        description: "Please select a gate before scanning items",
        variant: "destructive",
      });
      return;
    }

    const found = mockInventoryItems.find(item => item.id === barcode);
    if (!found) {
      toast({
        title: "Item Not Found",
        description: `No inventory found with barcode ${barcode}`,
        variant: "destructive",
      });
      return;
    }

    if (scannedItems.some(item => item.id === found.id)) {
      toast({
        title: "Already Scanned",
        description: `Item ${found.id} has already been scanned`,
        variant: "destructive",
      });
      return;
    }

    // Get customer details
    const customer = mockCustomers.find(c => c.id === selectedCustomer);
    if (!customer) return;

    // Get location details
    const location = customer.locations.find(l => l.id === selectedLocation);
    if (!location) return;

    // Calculate rental cost based on inventory type and location
    let hourlyRentalCost = 0;
    
    // Only apply rental cost if the customer is the base customer (internal movement)
    if (customer.id === companyInfo.baseCustomerId) {
      if (location.rentalRates[found.type]) {
        hourlyRentalCost = location.rentalRates[found.type];
      }
    }

    setScannedItems([...scannedItems, { 
      ...found, 
      scannedAt: new Date(),
      hourlyRentalCost,
      gate: mockGates.find(g => g.id === selectedGate)?.name || 'Unknown'
    }]);
    
    setBarcode("");
    
    toast({
      title: "Item Scanned",
      description: `Added ${found.id} to scanned items`,
    });
  };

  const handleProcess = () => {
    if (scannedItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please scan items before processing",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Simulate processing
    setTimeout(() => {
      const movementType = activeTab === "in" ? "In Movement" : "Out Movement";
      
      toast({
        title: "Movement Processed",
        description: `${scannedItems.length} item(s) ${activeTab === "in" ? "received at" : "sent from"} ${
          mockLocations.find(l => l.id === selectedLocation)?.name || selectedLocation
        }`,
      });

      // Generate delivery challan if:
      // 1. It's an OUT movement AND
      // 2. Either it's a movement between different customers OR to a non-base customer
      // 3. User has the delivery challan permission
      if (activeTab === "out" && isDifferentCustomer && hasPermission(PERMISSIONS.DELIVERY_CHALLAN)) {
        // Create challan
        const challanNo = "DC" + Math.floor(Math.random() * 10000).toString().padStart(5, '0');
        const customerObj = mockCustomers.find(c => c.id === selectedCustomer);
        const locationObj = customerObj?.locations.find(l => l.id === selectedLocation);
        
        setChallanDetails({
          challanNo,
          customerName: customerObj?.name || "Unknown",
          customerAddress: locationObj?.name || "Unknown",
          items: scannedItems.map(item => ({
            ...item,
            qty: 1,
            rentalRate: item.hourlyRentalCost
          }))
        });
        
        setShowChallan(true);
      }

      // Reset form
      setScannedItems([]);
      setSelectedLocation("");
      setSelectedCustomer("");
      setSelectedGate("");
      setNotes("");
      setIsProcessing(false);
    }, 1500);
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems(scannedItems.filter(item => item.id !== id));
    
    toast({
      title: "Item Removed",
      description: `Removed ${id} from scanned items`,
    });
  };

  const viewItemDetails = (item: any) => {
    setSelectedInventory(item);
  };

  const closeItemDetails = () => {
    setSelectedInventory(null);
  };

  const handlePrintChallan = () => {
    // Simulate printing
    toast({
      title: "Printing Challan",
      description: `Delivery Challan ${challanDetails.challanNo} sent to printer`,
    });
    
    // Close challan view after print
    setTimeout(() => {
      setShowChallan(false);
    }, 1000);
  };

  const handleDownloadChallan = () => {
    // Simulate download
    toast({
      title: "Downloading Challan",
      description: `Delivery Challan ${challanDetails.challanNo} download started`,
    });
    
    // In a real app, would generate PDF and trigger download
  };

  const getLocationName = (locationId: string) => {
    // First check customer locations
    for (const customer of mockCustomers) {
      const location = customer.locations.find(l => l.id === locationId);
      if (location) return location.name;
    }
    // Then check general locations
    return mockLocations.find(l => l.id === locationId)?.name || locationId;
  };

  const getCustomerName = (customerId: string) => {
    return mockCustomers.find(c => c.id === customerId)?.name || customerId;
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Inventory Movement</h2>
      </div>

      {showChallan ? (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Delivery Challan</CardTitle>
              <CardDescription>
                Challan # {challanDetails.challanNo} - {format(new Date(), "dd/MM/yyyy")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowChallan(false)}>
                Back
              </Button>
              <Button size="sm" variant="secondary" onClick={handleDownloadChallan}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
              <Button size="sm" onClick={handlePrintChallan}>
                <FileText className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-6 space-y-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-lg">From:</h3>
                  <p>RENTracker Warehouse</p>
                  <p>123 Logistics Way</p>
                  <p>Warehouse District</p>
                </div>
                <div>
                  <h3 className="font-bold text-lg">To:</h3>
                  <p>Customer: {challanDetails.customerName}</p>
                  <p>Location: {challanDetails.customerAddress}</p>
                </div>
              </div>

              <Separator />
              
              <div>
                <h3 className="font-bold text-lg mb-2">Items:</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Item ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Hourly Rate (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {challanDetails.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.id}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.type}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.qty}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right">₹{item.rentalRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <div>
                  <h3 className="font-bold">Terms & Conditions:</h3>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground ml-2 mt-2">
                    <li>Rental will be charged based on hourly rates</li>
                    <li>Items must be returned in original condition</li>
                    <li>Customer is responsible for items while in their possession</li>
                  </ol>
                </div>
                <div className="text-right">
                  <div className="mb-6">
                    <p className="text-sm">Signature:</p>
                    <div className="w-40 h-10 border-b border-dashed mt-6 mb-1"></div>
                    <p className="text-sm">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : selectedInventory ? (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inventory Details</CardTitle>
              <CardDescription>
                Details for item {selectedInventory.id}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={closeItemDetails}>
              Back to List
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">ID:</span>
                    <span>{selectedInventory.id}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">Type:</span>
                    <span>{selectedInventory.type}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">Customer:</span>
                    <span>{selectedInventory.customer}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">Project:</span>
                    <span>{selectedInventory.project}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">Current Location:</span>
                    <span>{selectedInventory.location}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">Hourly Rental Cost:</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3 mr-1" /> 
                      {selectedInventory.hourlyRentalCost}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Movement Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">Scanned At:</span>
                    <span>{format(selectedInventory.scannedAt, "dd MMM yyyy HH:mm:ss")}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">Movement Type:</span>
                    <span>{activeTab === "in" ? "In Movement" : "Out Movement"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">Gate:</span>
                    <span>{selectedInventory.gate || "Not set"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="font-medium">{activeTab === "in" ? "Source" : "Destination"}:</span>
                    <span>{getLocationName(selectedLocation)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Scan Items</CardTitle>
                <CardDescription>
                  Scan inventory items for movement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="in" className="flex items-center gap-1">
                      <ArrowLeft className="h-4 w-4" /> In
                    </TabsTrigger>
                    <TabsTrigger value="out" className="flex items-center gap-1">
                      <ArrowRight className="h-4 w-4" /> Out
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="customer">Customer</Label>
                    <Select
                      value={selectedCustomer}
                      onValueChange={setSelectedCustomer}
                    >
                      <SelectTrigger id="customer">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">
                      {activeTab === "in" ? "Source Location" : "Destination Location"}
                    </Label>
                    <Select
                      value={selectedLocation}
                      onValueChange={setSelectedLocation}
                      disabled={!selectedCustomer}
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder={`Select ${activeTab === "in" ? "source" : "destination"}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!selectedCustomer && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a customer first to see available locations
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gate">Gate</Label>
                    <Select
                      value={selectedGate}
                      onValueChange={setSelectedGate}
                      disabled={!selectedLocation}
                    >
                      <SelectTrigger id="gate">
                        <SelectValue placeholder="Select gate" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredGates.map((gate) => (
                          <SelectItem key={gate.id} value={gate.id}>
                            {gate.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedLocation && filteredGates.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No gates available for this location
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="barcode">Scan Barcode</Label>
                    <div className="flex mt-1">
                      <Input
                        id="barcode"
                        placeholder="Scan or enter barcode"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="flex-1"
                        disabled={!selectedGate}
                      />
                      <Button 
                        onClick={handleScan} 
                        type="button" 
                        className="ml-2"
                        disabled={!selectedGate}
                      >
                        <Barcode className="h-4 w-4 mr-2" />
                        Scan
                      </Button>
                    </div>
                    {!selectedGate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a gate before scanning items
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Add notes about this movement"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleProcess}
                  disabled={isProcessing || scannedItems.length === 0 || !selectedGate}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Processing...
                    </>
                  ) : (
                    <>
                      {activeTab === "in" ? (
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      ) : (
                        <Truck className="mr-2 h-4 w-4" />
                      )}
                      Process {activeTab === "in" ? "In" : "Out"} Movement
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Scanned Items</CardTitle>
                <CardDescription>
                  {scannedItems.length} item(s) scanned for {activeTab === "in" ? "in" : "out"} movement
                  {isDifferentCustomer && activeTab === "out" && (
                    <span className="ml-2 text-amber-600 font-medium">
                      Delivery challan will be generated (cross-customer movement)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px] w-full rounded-md border">
                  {scannedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Box className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No items scanned yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scan items to see them listed here
                      </p>
                    </div>
                  ) : (
                    <div className="p-4">
                      {scannedItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border-b last:border-0 hover:bg-muted/50 rounded-sm"
                        >
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <div>
                              <div className="font-medium">{item.id}</div>
                              <div className="text-sm text-muted-foreground">
                                Type: {item.type} | Location: {item.location} | Gate: {item.gate}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium flex items-center">
                              <IndianRupee className="h-3 w-3 mr-1" /> 
                              {item.hourlyRentalCost}/hour
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewItemDetails(item)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground flex items-center">
                  <DoorOpen className="h-4 w-4 mr-2" />
                  {selectedGate 
                    ? `Selected gate: ${mockGates.find(g => g.id === selectedGate)?.name}`
                    : "Select a gate to scan items"}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movement;

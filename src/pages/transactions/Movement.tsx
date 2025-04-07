
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
  DoorOpen,
  Loader2
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
import { supabase, getCustomTable } from "@/integrations/supabase/client";

// Interface definitions
interface Location {
  id: string;
  name: string;
  code?: string;
}

interface CustomerLocation {
  id: string;
  name: string;
  rentalRates: {
    [key: string]: number; // Key is inventory type code, value is hourly rate
  };
}

interface Customer {
  id: string;
  code: string;
  name: string;
  locations: CustomerLocation[];
}

interface Gate {
  id: string;
  name: string;
  locationId: string;
}

interface InventoryItem {
  id: string;
  type: string;
  customer: string;
  project: string;
  location: string;
}

interface CompanyInfo {
  baseCustomerId: string;
  baseLocationId: string;
}

interface ScannedItem extends InventoryItem {
  scannedAt: Date;
  hourlyRentalCost: number;
  gate: string;
}

interface ChallanDetails {
  challanNo: string;
  customerName: string;
  customerAddress: string;
  items: ScannedItem[];
}

const Movement = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("in");
  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedGate, setSelectedGate] = useState("");
  const [filteredGates, setFilteredGates] = useState<Gate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [selectedInventory, setSelectedInventory] = useState<ScannedItem | null>(null);
  const [challanDetails, setChallanDetails] = useState<ChallanDetails>({
    challanNo: "",
    customerName: "",
    customerAddress: "",
    items: [],
  });
  const [showChallan, setShowChallan] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<CustomerLocation[]>([]);
  const [isDifferentCustomer, setIsDifferentCustomer] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    baseCustomerId: "",
    baseLocationId: ""
  });
  
  // Data states
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [rentalRates, setRentalRates] = useState<{[key: string]: {[key: string]: {[key: string]: number}}}>({});

  // Fetch initial data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch company info
        const { data: companyData, error: companyError } = await supabase
          .from('company_info')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (companyError) {
          console.error('Error fetching company info:', companyError);
        }
        
        if (companyData) {
          setCompanyInfo({
            baseCustomerId: companyData.base_customer_id || "",
            baseLocationId: companyData.base_location_id || ""
          });
        }
        
        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('status', 'active');
        
        if (locationsError) {
          console.error('Error fetching locations:', locationsError);
        }
        
        if (locationsData) {
          setLocations(locationsData.map(loc => ({
            id: loc.id,
            name: loc.name
          })));
        }
        
        // Fetch customers and their locations with rental rates
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*, customer_locations(*)');
        
        if (customerError) {
          console.error('Error fetching customers:', customerError);
        }
        
        if (customerData) {
          const formattedCustomers = customerData.map(cust => {
            const customerLocations = cust.customer_locations ? cust.customer_locations.map((loc: any) => ({
              id: loc.location_id,
              name: loc.location_name,
              rentalRates: loc.rental_rates as {[key: string]: number} || {}
            })) : [];
            
            return {
              id: cust.id,
              code: cust.code,
              name: cust.name,
              locations: customerLocations
            };
          });
          
          setCustomers(formattedCustomers);
          
          // Build rental rates object for quick lookup
          const rates: {[key: string]: {[key: string]: {[key: string]: number}}} = {};
          
          formattedCustomers.forEach(customer => {
            if (!rates[customer.id]) {
              rates[customer.id] = {};
            }
            
            customer.locations.forEach(location => {
              if (!rates[customer.id][location.id]) {
                rates[customer.id][location.id] = {};
              }
              
              rates[customer.id][location.id] = location.rentalRates;
            });
          });
          
          setRentalRates(rates);
        }
        
        // Fetch gates
        const { data: gatesData, error: gatesError } = await supabase
          .from('gates')
          .select('*')
          .eq('status', 'active');
        
        if (gatesError) {
          console.error('Error fetching gates:', gatesError);
        }
        
        if (gatesData) {
          setGates(gatesData.map(gate => ({
            id: gate.id,
            name: gate.name,
            locationId: gate.gate_location
          })));
        }
        
        // Fetch inventory items (bins)
        const { data: binsData, error: binsError } = await supabase
          .from('bins')
          .select('*');
        
        if (binsError) {
          console.error('Error fetching inventory items:', binsError);
        }
        
        if (binsData) {
          setInventoryItems(binsData.map(bin => ({
            id: bin.id,
            type: bin.rfid_tag?.split('-')[0] || 'PLT', // Extracting type from RFID tag if available
            customer: bin.customer,
            project: bin.project || '',
            location: bin.location
          })));
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error Loading Data",
          description: "There was an error loading data. Using sample data instead.",
          variant: "destructive",
        });
        
        // Load sample data as fallback
        loadSampleData();
      } finally {
        setIsLoading(false);
      }
    };
    
    const loadSampleData = () => {
      // Sample locations
      setLocations([
        { id: "1", name: "Main Warehouse", code: "WH" },
        { id: "2", name: "Factory A", code: "FA" },
        { id: "3", name: "Distribution Center B", code: "DCB" },
      ]);
      
      // Sample customers with locations and rental rates
      setCustomers([
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
      ]);
      
      // Sample gates
      setGates([
        { id: "G1", name: "Gate 1", locationId: "1" },
        { id: "G2", name: "Gate 2", locationId: "1" },
        { id: "G3", name: "Gate 3", locationId: "2" },
        { id: "G4", name: "Gate 4", locationId: "3" },
        { id: "G5", name: "Gate 5", locationId: "4" },
        { id: "G6", name: "Gate 6", locationId: "5" },
      ]);
      
      // Sample inventory
      setInventoryItems([
        { id: "TOY100108001", type: "PLT", customer: "TOY", project: "1001", location: "Main Warehouse" },
        { id: "TOY100108002", type: "CTN", customer: "TOY", project: "1001", location: "Main Warehouse" },
        { id: "HON100308004", type: "PLT", customer: "HON", project: "1003", location: "Main Warehouse" },
      ]);
      
      // Sample company info
      setCompanyInfo({
        baseCustomerId: "1", // Toyota is the base customer
        baseLocationId: "1"  // Main Warehouse is the base location
      });
      
      // Build rental rates object for quick lookup
      const rates: {[key: string]: {[key: string]: {[key: string]: number}}} = {
        "1": { // Toyota
          "4": { "PLT": 10, "CTN": 5, "CRT": 8 },
          "6": { "PLT": 12, "CTN": 6, "CRT": 9 }
        },
        "2": { // Honda
          "5": { "PLT": 15, "CTN": 7, "CRT": 10 }
        }
      };
      
      setRentalRates(rates);
    };
    
    fetchData();
  }, [toast]);

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
      const customer = customers.find(c => c.id === selectedCustomer);
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
  }, [selectedCustomer, customers]);

  // Update available gates when location is selected
  useEffect(() => {
    if (selectedLocation) {
      const filteredGates = gates.filter(gate => gate.locationId === selectedLocation);
      setFilteredGates(filteredGates);
      if (filteredGates.length > 0) {
        setSelectedGate(filteredGates[0]?.id || "");
      }
    } else {
      setFilteredGates([]);
      setSelectedGate("");
    }
  }, [selectedLocation, gates]);

  // Determine if it's a movement between different customers (for challan generation)
  useEffect(() => {
    if (scannedItems.length > 0 && selectedCustomer) {
      // Check if any item belongs to a different customer than selected
      const customer = customers.find(c => c.id === selectedCustomer);
      if (!customer) return;
      
      const customerCode = customer.code;
      const differentCustomer = scannedItems.some(item => item.customer !== customerCode);
      
      // Also check if the selected customer is different from the base customer
      const isNotBaseCustomer = selectedCustomer !== companyInfo.baseCustomerId;
      
      setIsDifferentCustomer(differentCustomer || isNotBaseCustomer);
    } else {
      setIsDifferentCustomer(false);
    }
  }, [scannedItems, selectedCustomer, companyInfo.baseCustomerId, customers]);

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

    const found = inventoryItems.find(item => item.id === barcode);
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
    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer) return;

    // Calculate rental cost based on inventory type and location
    let hourlyRentalCost = 0;
    
    // Check if rental rates exist for this customer and location
    if (rentalRates[selectedCustomer] && 
        rentalRates[selectedCustomer][selectedLocation] && 
        rentalRates[selectedCustomer][selectedLocation][found.type]) {
        hourlyRentalCost = rentalRates[selectedCustomer][selectedLocation][found.type];
    }

    const scannedItem: ScannedItem = { 
      ...found, 
      scannedAt: new Date(),
      hourlyRentalCost,
      gate: gates.find(g => g.id === selectedGate)?.name || 'Unknown'
    };

    setScannedItems([...scannedItems, scannedItem]);
    
    setBarcode("");
    
    toast({
      title: "Item Scanned",
      description: `Added ${found.id} to scanned items`,
    });
  };

  const handleProcess = async () => {
    if (scannedItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please scan items before processing",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Process each scanned item
      for (const item of scannedItems) {
        // Get previous location from inventory
        const inventoryItem = inventoryItems.find(inv => inv.id === item.id);
        const previousLocation = inventoryItem?.location || '';
        
        // Create movement record in database
        const { error } = await getCustomTable('bin_movements').insert({
          bin_id: item.id,
          gate_id: selectedGate,
          movement_type: activeTab,
          timestamp: new Date().toISOString(),
          location: selectedLocation,
          previous_location: previousLocation
        });
        
        if (error) {
          console.error('Error recording movement:', error);
          throw new Error('Failed to record movement');
        }
        
        // Update inventory location
        const { error: updateError } = await supabase
          .from('bins')
          .update({ 
            location: selectedLocation,
            last_scan_gate: selectedGate,
            last_scan_time: new Date().toISOString()
          })
          .eq('id', item.id);
          
        if (updateError) {
          console.error('Error updating inventory location:', updateError);
          throw new Error('Failed to update inventory location');
        }
      }
      
      const customer = customers.find(c => c.id === selectedCustomer);
      const location = filteredLocations.find(l => l.id === selectedLocation);
      
      const movementType = activeTab === "in" ? "In Movement" : "Out Movement";
      
      toast({
        title: "Movement Processed",
        description: `${scannedItems.length} item(s) ${activeTab === "in" ? "received at" : "sent from"} ${
          location?.name || selectedLocation
        }`,
      });

      // Generate delivery challan if:
      // 1. It's an OUT movement AND
      // 2. Either it's a movement between different customers OR to a non-base customer
      // 3. User has the delivery challan permission
      if (activeTab === "out" && isDifferentCustomer && hasPermission(PERMISSIONS.DELIVERY_CHALLAN)) {
        // Create challan
        const challanNo = "DC" + Math.floor(Math.random() * 10000).toString().padStart(5, '0');
        
        setChallanDetails({
          challanNo,
          customerName: customer?.name || "Unknown",
          customerAddress: location?.name || "Unknown",
          items: scannedItems.map(item => ({
            ...item,
            hourlyRentalCost: item.hourlyRentalCost
          }))
        });
        
        setShowChallan(true);
      } else {
        // Reset form if no challan needed
        resetForm();
      }
    } catch (error) {
      console.error('Error processing movement:', error);
      toast({
        title: "Processing Failed",
        description: "There was an error processing the movement. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setScannedItems([]);
    setSelectedLocation("");
    setSelectedCustomer("");
    setSelectedGate("");
    setNotes("");
    setIsProcessing(false);
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems(scannedItems.filter(item => item.id !== id));
    
    toast({
      title: "Item Removed",
      description: `Removed ${id} from scanned items`,
    });
  };

  const viewItemDetails = (item: ScannedItem) => {
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
      resetForm();
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
    for (const customer of customers) {
      const location = customer.locations.find(l => l.id === locationId);
      if (location) return location.name;
    }
    // Then check general locations
    return locations.find(l => l.id === locationId)?.name || locationId;
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || customerId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading inventory data...</p>
        </div>
      </div>
    );
  }

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
                          <td className="px-4 py-2 whitespace-nowrap text-sm">1</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right">₹{item.hourlyRentalCost}</td>
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
                        {customers.map((customer) => (
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
                  </div>

                  <Button 
                    onClick={handleProcess} 
                    disabled={scannedItems.length === 0 || isProcessing} 
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DoorOpen className="h-4 w-4 mr-2" />
                        Process {activeTab === "in" ? "Receiving" : "Dispatch"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Scanned Items</CardTitle>
                <CardDescription>
                  {scannedItems.length} item(s) scanned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scannedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-md p-6">
                    <Box className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No items scanned yet</p>
                    <p className="text-sm text-muted-foreground max-w-md text-center mt-1">
                      Select a customer and location, then scan items to add them to the list.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {scannedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 border rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="font-medium">{item.id}</span>
                              <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                {item.type}
                              </span>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              <span>Customer: {item.customer}</span>
                              {item.project && <span>Project: {item.project}</span>}
                              <span className="flex items-center">
                                <IndianRupee className="h-3 w-3 mr-1" /> 
                                {item.hourlyRentalCost}/hr
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewItemDetails(item)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4 text-destructive"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movement;

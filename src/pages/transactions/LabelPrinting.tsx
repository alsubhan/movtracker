
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, CheckCircle, AlertTriangle, Barcode, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LabelPrinting = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customer: "",
    project: "",
    partition: "",
    serialStart: "",
    quantity: "1",
  });
  const [previewData, setPreviewData] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("generate");

  // Mock inventory database for search
  const mockInventory = [
    "TOY100108001",
    "TOY100108002",
    "HON200104001",
    "HON200104002",
    "NIS300102001",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a inventory ID to search",
        variant: "destructive",
      });
      return;
    }

    // Filter inventory based on search query
    const results = mockInventory.filter(id => 
      id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
    
    if (results.length === 0) {
      toast({
        title: "No Results",
        description: "No inventory found matching your search",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Search Complete",
        description: `Found ${results.length} matching inventory`,
      });
    }
  };

  const handlePreview = () => {
    // Validate fields
    if (
      !formData.customer ||
      !formData.project ||
      !formData.partition ||
      !formData.serialStart ||
      !formData.quantity
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check field lengths
    if (
      formData.customer.length !== 3 ||
      formData.project.length !== 4 ||
      formData.partition.length !== 2 ||
      formData.serialStart.length !== 3
    ) {
      toast({
        title: "Validation Error",
        description:
          "Customer (3), Project (4), Partition (2), and Serial (3) must have correct lengths",
        variant: "destructive",
      });
      return;
    }

    // Generate preview data
    const quantity = parseInt(formData.quantity);
    const serialStart = parseInt(formData.serialStart);
    
    if (isNaN(quantity) || quantity < 1 || quantity > 100) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(serialStart)) {
      toast({
        title: "Invalid Serial Number",
        description: "Serial number must be numeric",
        variant: "destructive",
      });
      return;
    }

    // Generate preview list
    const previews: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const serial = (serialStart + i).toString().padStart(3, "0");
      const inventoryId = `${formData.customer}${formData.project}${formData.partition}${serial}`;
      previews.push(inventoryId);
    }
    
    setPreviewData(previews);
    
    toast({
      title: "Preview Generated",
      description: `${quantity} barcode labels ready for printing`,
    });
  };

  const toggleInventoryelection = (inventoryId: string) => {
    if (selectedInventory.includes(inventoryId)) {
      setSelectedInventory(selectedInventory.filter(id => id !== inventoryId));
    } else {
      setSelectedInventory([...selectedInventory, inventoryId]);
    }
  };

  const handleAddSelectedToPreview = () => {
    if (selectedInventory.length === 0) {
      toast({
        title: "No Inventory Selected",
        description: "Please select at least one inventory to add to preview",
        variant: "destructive",
      });
      return;
    }
    
    setPreviewData([...selectedInventory]);
    setActiveTab("preview");
    
    toast({
      title: "Inventory Added to Preview",
      description: `${selectedInventory.length} inventory ready for printing`,
    });
  };

  const handlePrint = () => {
    if (previewData.length === 0) {
      toast({
        title: "No Labels to Print",
        description: "Please generate a preview first",
        variant: "destructive",
      });
      return;
    }
    
    setIsPrinting(true);
    
    // Simulate printing process
    toast({
      title: "Printing Started",
      description: `Printing ${previewData.length} barcode labels...`,
    });
    
    setTimeout(() => {
      setIsPrinting(false);
      toast({
        title: "Printing Complete",
        description: `Successfully printed ${previewData.length} barcode labels`,
      });
    }, 2000);
  };

  const handleClear = () => {
    setFormData({
      customer: "",
      project: "",
      partition: "",
      serialStart: "",
      quantity: "1",
    });
    setPreviewData([]);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedInventory([]);
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please scan or enter a inventory ID",
        variant: "destructive",
      });
      return;
    }
    
    // Check if scanned barcode exists in our mock database
    if (mockInventory.includes(searchQuery)) {
      // Add to selected inventory if not already there
      if (!selectedInventory.includes(searchQuery)) {
        setSelectedInventory([...selectedInventory, searchQuery]);
        toast({
          title: "Inventory Added",
          description: `Inventory ${searchQuery} added to selection`,
        });
      } else {
        toast({
          title: "Already Selected",
          description: `Inventory ${searchQuery} is already in your selection`,
        });
      }
    } else {
      toast({
        title: "Inventory Not Found",
        description: `Inventory ${searchQuery} not found in database`,
        variant: "destructive",
      });
    }
    
    setSearchQuery("");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Barcode Label Printing</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate New Labels</TabsTrigger>
          <TabsTrigger value="search">Search Inventory</TabsTrigger>
          <TabsTrigger value="preview">Preview & Print</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Barcode Labels</CardTitle>
              <CardDescription>
                Create new barcode labels based on inventory information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer Code (3 chars)</Label>
                    <Input
                      id="customer"
                      name="customer"
                      value={formData.customer}
                      onChange={handleInputChange}
                      placeholder="e.g. TOY"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">Project Code (4 chars)</Label>
                    <Input
                      id="project"
                      name="project"
                      value={formData.project}
                      onChange={handleInputChange}
                      placeholder="e.g. 1001"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partition">Inventory Partition (2 chars)</Label>
                    <Input
                      id="partition"
                      name="partition"
                      value={formData.partition}
                      onChange={handleInputChange}
                      placeholder="e.g. 08"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serialStart">Starting Serial (3 chars)</Label>
                    <Input
                      id="serialStart"
                      name="serialStart"
                      value={formData.serialStart}
                      onChange={handleInputChange}
                      placeholder="e.g. 001"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity to Print</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min={1}
                      max={100}
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleClear}>Clear</Button>
              <Button onClick={handlePreview}>
                Preview Labels
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Existing Inventory</CardTitle>
              <CardDescription>
                Find inventory by ID to print their barcode labels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleBarcodeScan} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search or scan inventory ID"
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="button" onClick={handleSearch}>
                    Search
                  </Button>
                  <Button type="submit" variant="outline">
                    <Barcode className="h-4 w-4" />
                    Scan
                  </Button>
                </div>
              </form>
              
              {searchResults.length > 0 && (
                <div className="border rounded-md">
                  <div className="py-2 px-4 bg-muted text-sm font-medium">
                    Search Results ({searchResults.length})
                  </div>
                  <div className="p-4 space-y-2">
                    {searchResults.map((inventory, index) => (
                      <div key={index} className="flex items-center justify-between border-b py-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4 text-muted-foreground" />
                          <span>{inventory}</span>
                        </div>
                        <Button
                          variant={selectedInventory.includes(inventory) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleInventoryelection(inventory)}
                        >
                          {selectedInventory.includes(inventory) ? "Selected" : "Select"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedInventory.length > 0 && (
                <div className="border rounded-md">
                  <div className="py-2 px-4 bg-muted text-sm font-medium">
                    Selected Inventory ({selectedInventory.length})
                  </div>
                  <div className="p-4 space-y-2">
                    {selectedInventory.map((inventory, index) => (
                      <div key={index} className="flex items-center justify-between border-b py-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{inventory}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleInventoryelection(inventory)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleClear}>Clear Selection</Button>
              <Button 
                onClick={handleAddSelectedToPreview} 
                disabled={selectedInventory.length === 0}
              >
                Add to Preview
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Label Preview</CardTitle>
              <CardDescription>
                Preview of barcode labels to be printed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewData.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {previewData.slice(0, 6).map((inventoryId, index) => (
                      <div 
                        key={index} 
                        className="border rounded-md p-4 flex flex-col items-center justify-center bg-white"
                      >
                        <div className="text-xs text-gray-500 mb-1">Barcode Label</div>
                        <div className="text-lg font-bold">{inventoryId}</div>
                        <div className="mt-2">
                          <Barcode className="h-12 w-32" />
                        </div>
                        <div className="mt-2 text-xs rounded-sm text-center">
                          {inventoryId}
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-500 mt-2" />
                      </div>
                    ))}
                  </div>
                  
                  {previewData.length > 6 && (
                    <div className="text-center text-sm text-muted-foreground">
                      +{previewData.length - 6} more labels
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="bg-muted rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Label Format</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: XXX-YYYY-ZZ-NNN where:
                      <br />
                      XXX = Customer code (3 chars)
                      <br />
                      YYYY = Project code (4 chars)
                      <br />
                      ZZ = Inventory partition (2 chars)
                      <br />
                      NNN = Serial number (3 chars)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                  <Barcode className="h-16 w-16 mb-4 text-muted" />
                  <p>No labels previewed yet</p>
                  <p className="text-sm">Generate new labels or search for existing inventory</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleClear}>Clear</Button>
              <Button 
                onClick={handlePrint} 
                disabled={previewData.length === 0 || isPrinting}
              >
                {isPrinting ? (
                  <>
                    <Printer className="mr-2 h-4 w-4 animate-pulse" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Labels
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabelPrinting;

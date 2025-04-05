
import { useState, useRef } from "react";
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
import { Barcode, Printer, CheckCircle, AlertTriangle, FileUp, File, Search, Plus, Minus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock inventory data for search
const mockInventory = [
  { id: "TOY100108001", type: "PLT", customer: "TOY", project: "1001" },
  { id: "TOY100108002", type: "CTN", customer: "TOY", project: "1001" },
  { id: "DEF100208003", type: "CRT", customer: "DEF", project: "1002" },
  { id: "GHI100308004", type: "PLT", customer: "GHI", project: "1003" },
  { id: "JKL100408005", type: "CTN", customer: "JKL", project: "1004" },
];

const BarcodeLabelPrinting = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<typeof mockInventory>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string, copies: number }>>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [prnFileName, setPrnFileName] = useState<string | null>(null);
  const [prnFileContent, setPrnFileContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadPrnFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPrnFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPrnFileContent(content);
      toast({
        title: "PRN File Loaded",
        description: `File "${file.name}" loaded successfully`,
      });
    };
    reader.readAsText(file);
  };

  const handleSearch = () => {
    if (!searchTerm) {
      setShowSearchResults(false);
      return;
    }

    const results = mockInventory.filter(item => 
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(results);
    setShowSearchResults(true);
    
    if (results.length === 0) {
      toast({
        title: "No Results",
        description: "No inventory items match your search",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = (item: typeof mockInventory[0]) => {
    if (selectedItems.some(selected => selected.id === item.id)) {
      toast({
        title: "Already Added",
        description: `Item ${item.id} is already in the list`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedItems([...selectedItems, { id: item.id, copies: 1 }]);
    setSearchTerm("");
    setShowSearchResults(false);
    
    toast({
      title: "Item Added",
      description: `Added ${item.id} to print list`,
    });
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const handleCopiesChange = (id: string, change: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id 
        ? { ...item, copies: Math.max(1, Math.min(99, item.copies + change)) } 
        : item
    ));
  };

  const handlePrint = () => {
    if (!prnFileContent) {
      toast({
        title: "No PRN File",
        description: "Please upload a PRN file first",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one inventory item to print",
        variant: "destructive",
      });
      return;
    }
    
    setIsPrinting(true);
    
    // Simulate printing process - we'd replace placeholder in PRN file with actual inventory ID
    const totalLabels = selectedItems.reduce((total, item) => total + item.copies, 0);
    const itemsDetail = selectedItems.map(item => `${item.id} (${item.copies} copies)`).join(", ");
    
    toast({
      title: "Printing Started",
      description: `Printing ${totalLabels} barcode labels...`,
    });
    
    setTimeout(() => {
      setIsPrinting(false);
      toast({
        title: "Printing Complete",
        description: `Successfully printed ${totalLabels} barcode labels`,
      });
    }, 2000);
  };

  const handleClear = () => {
    setSelectedItems([]);
    setPrnFileName(null);
    setPrnFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Barcode Label Printing</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Print Barcode Labels</CardTitle>
            <CardDescription>
              Upload PRN file template and print barcode labels for inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prnFile">PRN Template File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="prnFile"
                      type="file"
                      accept=".prn"
                      onChange={handleUploadPrnFile}
                      ref={fileInputRef}
                      className="flex-1"
                    />
                  </div>
                  {prnFileName && (
                    <div className="flex items-center mt-2 text-sm text-muted-foreground">
                      <File className="h-4 w-4 mr-2" />
                      {prnFileName}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a PRN file with {`{{INVENTORY_ID}}`} placeholder to be replaced with the inventory ID.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="searchInventoryId">Search Inventory</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="searchInventoryId"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by inventory ID"
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} type="button">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                  
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                      {searchResults.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex justify-between items-center p-2 hover:bg-muted cursor-pointer"
                          onClick={() => handleAddItem(item)}
                        >
                          <div>
                            <div className="font-medium">{item.id}</div>
                            <div className="text-xs text-muted-foreground">Type: {item.type} | Customer: {item.customer}</div>
                          </div>
                          <Plus className="h-4 w-4" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Items</Label>
                    <ScrollArea className="h-[200px] w-full rounded-md border">
                      <div className="p-4 space-y-2">
                        {selectedItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="font-medium">{item.id}</div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopiesChange(item.id, -1)}
                                disabled={item.copies <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center">{item.copies}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopiesChange(item.id, 1)}
                                disabled={item.copies >= 99}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="text-sm text-muted-foreground">
                      Total labels to print: {selectedItems.reduce((total, item) => total + item.copies, 0)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClear}>Clear</Button>
            <Button 
              onClick={handlePrint} 
              disabled={!prnFileContent || selectedItems.length === 0 || isPrinting}
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

        <Card>
          <CardHeader>
            <CardTitle>Label Preview</CardTitle>
            <CardDescription>
              Preview of barcode labels to be printed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedItems.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedItems.slice(0, 4).map((item) => (
                    <div 
                      key={item.id} 
                      className="border rounded-md p-4 flex flex-col items-center justify-center bg-white relative"
                    >
                      <div className="absolute top-1 right-1 text-xs bg-muted px-1 rounded">
                        x{item.copies}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">Barcode Label</div>
                      <div className="text-lg font-bold">{item.id}</div>
                      <div className="mt-2">
                        <Barcode className="h-12 w-32" />
                      </div>
                      <div className="mt-2 text-xs rounded-sm text-center">
                        {item.id}
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500 mt-2" />
                    </div>
                  ))}
                </div>
                
                {selectedItems.length > 4 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{selectedItems.length - 4} more labels
                  </div>
                )}
                
                <Separator />
                
                <div className="bg-muted rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">PRN File Format</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PRN files should contain a placeholder {`{{INVENTORY_ID}}`} that will be replaced with the actual inventory ID when printing.
                  </p>
                </div>
                
                {prnFileName && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm font-medium">File loaded: {prnFileName}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <Barcode className="h-16 w-16 mb-4 text-muted" />
                <p>No items selected</p>
                <p className="text-sm">Search and add inventory items to print</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BarcodeLabelPrinting;

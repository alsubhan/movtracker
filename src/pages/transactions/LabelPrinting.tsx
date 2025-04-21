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
import { supabase } from "@/lib/supabase/client";

interface InventoryItem {
  id: string;
  rfid_tag: string;
}

interface SelectedItem {
  id: string;
  rfid_tag: string;
  copies: number;
}

const BarcodeLabelPrinting = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [prnFileContent, setPrnFileContent] = useState<string | null>(null);
  const [prnFileName, setPrnFileName] = useState<string | null>(null);
  const [printerIp, setPrinterIp] = useState<string>('');
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

  const handleSearch = async () => {
    if (!searchTerm) {
      setShowSearchResults(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, rfid_tag')
        .ilike('rfid_tag', `%${searchTerm}%`)
        .order('rfid_tag');

      if (error) throw error;

      if (data) {
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to search inventory",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async (item: InventoryItem) => {
    if (selectedItems.some(selected => selected.id === item.id)) {
      toast({
        title: "Already Added",
        description: `Item ${item.rfid_tag} is already in the list`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedItems([...selectedItems, { id: item.id, rfid_tag: item.rfid_tag, copies: 1 }]);
    setSearchTerm("");
    setShowSearchResults(false);
    
    toast({
      title: "Item Added",
      description: `Added ${item.rfid_tag} to print list`,
    });
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const handlePrint = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please select items to print",
        variant: "destructive",
      });
      return;
    }

    if (!prnFileContent) {
      toast({
        title: "No PRN File",
        description: "Please upload a PRN file first",
        variant: "destructive",
      });
      return;
    }

    setIsPrinting(true);
    try {
      // Build raw PRN content with replaced placeholders
      let printContent = '';
      for (const item of selectedItems) {
        // Replace placeholder &INVENTORY_ID& with actual RFID tag
        printContent += prnFileContent.replace(/&INVENTORY_ID&/g, item.rfid_tag);
      }
      // Send ZPL directly to Zebra printer
      if (!printerIp) {
        toast({ title: 'No Printer IP', description: 'Enter printer IP to send ZPL', variant: 'destructive' });
        return;
      }
      const zebraUrl = `http://${printerIp}/pstprnt`;
      try {
        // Attempt request without CORS enforcement
        await fetch(zebraUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': printContent.length.toString()
          },
          body: printContent
        });
      } catch (err: any) {
        console.warn('Zebra print fetch failed', err);
        toast({
          title: 'Print Error',
          description: 'Failed to send to printer. This may be due to CORS restrictions. Consider enabling CORS on printer or using a proxy.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: "Printing Complete",
        description: `Printed ${selectedItems.length} labels successfully`,
      });
      
      // Reset after printing
      setSelectedItems([]);
      setSearchTerm("");
      setShowSearchResults(false);
    } catch (error) {
      console.error('Error printing:', error);
      toast({
        title: "Print Error",
        description: error instanceof Error ? error.message : "Failed to print labels",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Barcode Label Printing</CardTitle>
          <CardDescription>Search and print barcode labels for inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Section */}
            <div className="relative">
              <Input
                placeholder="Search by Inventory ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {searchResults.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleAddItem(item)}
                    >
                      <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4" />
                        <div className="flex-1 space-y-1">
                          <div className="text-sm font-medium">{item.rfid_tag}</div>
                        </div>
                        <Plus className="h-4 w-4" />
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Selected Items</h3>
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md border"
                      >
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.rfid_tag}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Printer IP for direct Zebra printing */}
            <div className="space-y-2">
              <Label htmlFor="printerIp" className="text-sm font-medium">Printer IP Address</Label>
              <Input
                id="printerIp"
                placeholder="e.g. 192.168.1.100"
                value={printerIp}
                onChange={e => setPrinterIp(e.target.value)}
                className="w-60"
              />
            </div>

            {/* PRN File Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">PRN File</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".prn"
                  onChange={handleUploadPrnFile}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  {prnFileName || "Upload PRN File"}
                </Button>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex justify-end">
              <Button
                disabled={isPrinting || selectedItems.length === 0 || !prnFileContent}
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeLabelPrinting;

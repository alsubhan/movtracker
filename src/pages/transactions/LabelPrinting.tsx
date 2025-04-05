
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
import { Barcode, Printer, CheckCircle, AlertTriangle, FileUp, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const BarcodeLabelPrinting = () => {
  const { toast } = useToast();
  const [inventoryId, setInventoryId] = useState("");
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

  const handlePrint = () => {
    if (!prnFileContent) {
      toast({
        title: "No PRN File",
        description: "Please upload a PRN file first",
        variant: "destructive",
      });
      return;
    }
    
    if (!inventoryId) {
      toast({
        title: "No Inventory ID",
        description: "Please enter an inventory ID",
        variant: "destructive",
      });
      return;
    }
    
    setIsPrinting(true);
    
    // Simulate printing process - we'd replace placeholder in PRN file with actual inventory ID
    const modifiedPrn = prnFileContent.replace(/\{\{INVENTORY_ID\}\}/g, inventoryId);
    
    // In a real app, we would send this to a printer service
    console.log("Modified PRN content:", modifiedPrn);
    
    toast({
      title: "Printing Started",
      description: `Printing barcode label for ${inventoryId}...`,
    });
    
    setTimeout(() => {
      setIsPrinting(false);
      toast({
        title: "Printing Complete",
        description: `Successfully printed barcode label for ${inventoryId}`,
      });
    }, 2000);
  };

  const handleClear = () => {
    setInventoryId("");
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
                  <Label htmlFor="inventoryId">Inventory ID</Label>
                  <Input
                    id="inventoryId"
                    name="inventoryId"
                    value={inventoryId}
                    onChange={(e) => setInventoryId(e.target.value)}
                    placeholder="e.g. TOY100108001"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClear}>Clear</Button>
            <Button 
              onClick={handlePrint} 
              disabled={!prnFileContent || !inventoryId || isPrinting}
            >
              {isPrinting ? (
                <>
                  <Printer className="mr-2 h-4 w-4 animate-pulse" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Label
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Label Preview</CardTitle>
            <CardDescription>
              Preview of barcode label to be printed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryId ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div 
                    className="border rounded-md p-4 flex flex-col items-center justify-center bg-white w-64"
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
                </div>
                
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
                <p>No inventory ID entered</p>
                <p className="text-sm">Enter an inventory ID and upload a PRN file</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BarcodeLabelPrinting;

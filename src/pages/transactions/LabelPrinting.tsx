
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
import { Printer, CheckCircle, AlertTriangle, Barcode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const productId = `${formData.customer}${formData.project}${formData.partition}${serial}`;
      previews.push(productId);
    }
    
    setPreviewData(previews);
    
    toast({
      title: "Preview Generated",
      description: `${quantity} barcode labels ready for printing`,
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
              Generate and print 2D barcode labels for manual product tracking
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
                  <Label htmlFor="partition">Product Partition (2 chars)</Label>
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
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handlePreview}>
                Preview
              </Button>
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
            </div>
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
            {previewData.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {previewData.slice(0, 6).map((productId, index) => (
                    <div 
                      key={index} 
                      className="border rounded-md p-4 flex flex-col items-center justify-center bg-white"
                    >
                      <div className="text-xs text-gray-500 mb-1">Barcode Label</div>
                      <div className="text-lg font-bold">{productId}</div>
                      <div className="mt-2">
                        <Barcode className="h-12 w-32" />
                      </div>
                      <div className="mt-2 text-xs rounded-sm text-center">
                        {productId}
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
                    ZZ = Product partition (2 chars)
                    <br />
                    NNN = Serial number (3 chars)
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <Barcode className="h-16 w-16 mb-4 text-muted" />
                <p>No labels previewed yet</p>
                <p className="text-sm">Fill in the form and click Preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LabelPrinting;

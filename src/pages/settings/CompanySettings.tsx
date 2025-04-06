
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, IndianRupee, Building, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompanyInfo {
  code: string;
  name: string;
  headerInfo: string;
  footerInfo: string;
  baseLocationId?: string;
  baseCustomerId?: string;
}

// Mock initial company data
const initialCompanyData: CompanyInfo = {
  code: "ABC",
  name: "ACME Corporation",
  headerInfo: "ACME Corporation\n123 Main Street\nNew York, NY 10001",
  footerInfo: "Thank you for your business!\nContact: info@acme.com | Phone: (555) 123-4567",
  baseLocationId: "1",
  baseCustomerId: "1"
};

// Mock locations and customers data
const mockLocations = [
  { id: "1", name: "Main Warehouse", code: "WH" },
  { id: "2", name: "Factory A", code: "FA" },
  { id: "3", name: "Distribution Center B", code: "DCB" },
];

const mockCustomers = [
  { id: "1", code: "TOY", name: "Toyota" },
  { id: "2", code: "HON", name: "Honda" },
  { id: "3", code: "DEF", name: "Defense Corp" },
];

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyData);
  const { toast } = useToast();

  // Load saved company info from localStorage on component mount
  useEffect(() => {
    const savedCompanyInfo = localStorage.getItem('companyInfo');
    if (savedCompanyInfo) {
      try {
        const parsedInfo = JSON.parse(savedCompanyInfo);
        setCompanyInfo(parsedInfo);
      } catch (error) {
        console.error('Error parsing company info from localStorage', error);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate company code
    if (companyInfo.code.length !== 3) {
      toast({
        title: "Invalid Company Code",
        description: "Company code must be exactly 3 characters",
        variant: "destructive",
      });
      return;
    }

    // Save company info to localStorage
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));

    // In a real application, save to database here
    // For now, we'll just show a success toast
    toast({
      title: "Company Settings Saved",
      description: "Your company information has been updated",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Company Code (3)</Label>
              <Input
                id="code"
                name="code"
                value={companyInfo.code}
                onChange={handleInputChange}
                placeholder="e.g. ABC"
                maxLength={3}
                pattern="[A-Za-z0-9]{3}"
                title="3 characters (letters and numbers only)"
                required
              />
              <p className="text-sm text-muted-foreground">
                Three character code to identify your company in inventory codes
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                name="name"
                value={companyInfo.name}
                onChange={handleInputChange}
                placeholder="e.g. ACME Corporation"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="baseLocationId" className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Base Location
              </Label>
              <Select
                value={companyInfo.baseLocationId}
                onValueChange={(value) => handleSelectChange('baseLocationId', value)}
              >
                <SelectTrigger id="baseLocationId">
                  <SelectValue placeholder="Select base location" />
                </SelectTrigger>
                <SelectContent>
                  {mockLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select your company's main location
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseCustomerId" className="flex items-center gap-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                Base Customer
              </Label>
              <Select
                value={companyInfo.baseCustomerId}
                onValueChange={(value) => handleSelectChange('baseCustomerId', value)}
              >
                <SelectTrigger id="baseCustomerId">
                  <SelectValue placeholder="Select base customer" />
                </SelectTrigger>
                <SelectContent>
                  {mockCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Internal customer for rental calculations
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="headerInfo">Invoice Header Information</Label>
            <Textarea
              id="headerInfo"
              name="headerInfo"
              value={companyInfo.headerInfo}
              onChange={handleInputChange}
              placeholder="Enter header information for invoices"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              This information will appear at the top of your invoices
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="footerInfo">Invoice Footer Information</Label>
            <Textarea
              id="footerInfo"
              name="footerInfo"
              value={companyInfo.footerInfo}
              onChange={handleInputChange}
              placeholder="Enter footer information for invoices"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              This information will appear at the bottom of your invoices
            </p>
          </div>

          <Button type="submit" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Company Information
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default CompanySettings;

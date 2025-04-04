
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, IndianRupee } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CompanyInfo {
  code: string;
  name: string;
  headerInfo: string;
  footerInfo: string;
}

interface InventorySettings {
  defaultCodeType: "customer" | "type" | "company";
}

// Mock initial company data
const initialCompanyData: CompanyInfo = {
  code: "ABC",
  name: "ACME Corporation",
  headerInfo: "ACME Corporation\n123 Main Street\nNew York, NY 10001",
  footerInfo: "Thank you for your business!\nContact: info@acme.com | Phone: (555) 123-4567",
};

const initialInventorySettings: InventorySettings = {
  defaultCodeType: "company"
};

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyData);
  const [inventorySettings, setInventorySettings] = useState<InventorySettings>(initialInventorySettings);
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

    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.defaultCodeType) {
          setInventorySettings(prev => ({
            ...prev,
            defaultCodeType: parsedSettings.defaultCodeType
          }));
        }
      } catch (error) {
        console.error('Error parsing settings from localStorage', error);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleCodeTypeChange = (value: string) => {
    setInventorySettings(prev => ({ 
      ...prev, 
      defaultCodeType: value as "customer" | "type" | "company" 
    }));
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

    // Save inventory settings to localStorage by updating the existing settings
    const savedSettings = localStorage.getItem('settings');
    let settings = {};
    
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error parsing settings from localStorage', error);
      }
    }

    localStorage.setItem('settings', JSON.stringify({
      ...settings,
      defaultCodeType: inventorySettings.defaultCodeType
    }));

    // In a real application, save to database here
    // For now, we'll just show a success toast
    toast({
      title: "Company Settings Saved",
      description: "Your company information and inventory settings have been updated",
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

          <div className="grid gap-2 pt-4 border-t">
            <Label>Default Inventory Code Type</Label>
            <RadioGroup 
              value={inventorySettings.defaultCodeType} 
              onValueChange={handleCodeTypeChange}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="default-customer" />
                <label htmlFor="default-customer" className="cursor-pointer">Customer Code</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="type" id="default-type" />
                <label htmlFor="default-type" className="cursor-pointer">Type Code</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="default-company" />
                <label htmlFor="default-company" className="cursor-pointer">Company Code</label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              This setting determines which code type will be selected by default when creating new inventory items
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

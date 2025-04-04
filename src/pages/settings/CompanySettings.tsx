
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface CompanyInfo {
  code: string;
  name: string;
  headerInfo: string;
  footerInfo: string;
}

// Mock initial company data
const initialCompanyData: CompanyInfo = {
  code: "ABC",
  name: "ACME Corporation",
  headerInfo: "ACME Corporation\n123 Main Street\nNew York, NY 10001",
  footerInfo: "Thank you for your business!\nContact: info@acme.com | Phone: (555) 123-4567",
};

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyData);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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

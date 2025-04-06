
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, IndianRupee, Building, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CompanyInfo, Location, Customer } from "@/types";

// Fallback initial company data if none exists in the database or localStorage
const defaultCompanyData: CompanyInfo = {
  code: "ABC",
  name: "ACME Corporation",
  headerText: "ACME Corporation\n123 Main Street\nNew York, NY 10001",
  footerText: "Thank you for your business!\nContact: info@acme.com | Phone: (555) 123-4567",
  baseLocationId: "",
  baseCustomerId: ""
};

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyData);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  // Fetch company info, locations, and customers from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      try {
        // Fetch company info
        const { data: companyData, error: companyError } = await supabase
          .from('company_info')
          .select('*')
          .single();

        if (companyError && companyError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, we handle this by using default data
          console.error('Error fetching company info:', companyError);
          toast({
            title: "Error fetching company information",
            description: companyError.message,
            variant: "destructive",
          });
        }

        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('status', 'active');

        if (locationsError) {
          console.error('Error fetching locations:', locationsError);
          toast({
            title: "Error fetching locations",
            description: locationsError.message,
            variant: "destructive",
          });
        } else {
          setLocations(locationsData || []);
        }

        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .eq('status', 'active');

        if (customersError) {
          console.error('Error fetching customers:', customersError);
          toast({
            title: "Error fetching customers",
            description: customersError.message,
            variant: "destructive",
          });
        } else {
          setCustomers(customersData || []);
        }

        // Set company info from database or fallback to localStorage
        if (companyData) {
          setCompanyInfo(companyData);
        } else {
          // Try loading from localStorage if no data in database
          const savedCompanyInfo = localStorage.getItem('companyInfo');
          if (savedCompanyInfo) {
            try {
              const parsedInfo = JSON.parse(savedCompanyInfo);
              setCompanyInfo(parsedInfo);
            } catch (error) {
              console.error('Error parsing company info from localStorage', error);
              // Fallback to default data
              setCompanyInfo(defaultCompanyData);
            }
          } else {
            // If no data in localStorage either, use default data
            setCompanyInfo(defaultCompanyData);
          }
        }
      } catch (error) {
        console.error('Error in fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate company code
    if (companyInfo.code.length !== 3) {
      toast({
        title: "Invalid Company Code",
        description: "Company code must be exactly 3 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('company_info')
        .upsert(
          {
            code: companyInfo.code,
            name: companyInfo.name,
            headerText: companyInfo.headerText,
            footerText: companyInfo.footerText,
            baseLocationId: companyInfo.baseLocationId,
            baseCustomerId: companyInfo.baseCustomerId
          },
          { onConflict: 'id' }
        )
        .select();

      if (error) {
        throw error;
      }

      // Also save to localStorage as backup
      localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
      
      toast({
        title: "Company Settings Saved",
        description: "Your company information has been updated",
      });
    } catch (error) {
      console.error('Error saving company info:', error);
      toast({
        title: "Error",
        description: "Failed to save company information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading company settings...</p>
      </div>
    );
  }

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
                value={companyInfo.baseLocationId || ""}
                onValueChange={(value) => handleSelectChange('baseLocationId', value)}
              >
                <SelectTrigger id="baseLocationId">
                  <SelectValue placeholder="Select base location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
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
                value={companyInfo.baseCustomerId || ""}
                onValueChange={(value) => handleSelectChange('baseCustomerId', value)}
              >
                <SelectTrigger id="baseCustomerId">
                  <SelectValue placeholder="Select base customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
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
            <Label htmlFor="headerText">Invoice Header Information</Label>
            <Textarea
              id="headerText"
              name="headerText"
              value={companyInfo.headerText}
              onChange={handleInputChange}
              placeholder="Enter header information for invoices"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              This information will appear at the top of your invoices
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="footerText">Invoice Footer Information</Label>
            <Textarea
              id="footerText"
              name="footerText"
              value={companyInfo.footerText}
              onChange={handleInputChange}
              placeholder="Enter footer information for invoices"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              This information will appear at the bottom of your invoices
            </p>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="bg-muted rounded-md p-4">
              <h3 className="font-medium mb-2">Movement Rules</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Rental Calculation:</strong> Applied only for movements between base customer locations</p>
                <p><strong>Delivery Challan:</strong> Generated only for cross-customer movements</p>
                <p className="text-muted-foreground italic">Note: Setting these base values is important for proper rental and challan generation</p>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Company Information"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default CompanySettings;

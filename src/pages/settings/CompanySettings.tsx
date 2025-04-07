import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CompanyInfo, Location, Customer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialCompanyInfo: CompanyInfo = {
  id: "",
  code: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  tax_id: "",
  header_text: "",
  footer_text: "",
  base_location_id: "",
  base_customer_id: ""
};

const CompanySettings = () => {
  const { toast } = useToast();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    tax_id: "",
    header_text: "",
    footer_text: "",
    base_location_id: "",
    base_customer_id: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      setIsLoading(true);
      try {
        const { data: companyData, error: companyError } = await supabase
          .from('company_info')
          .select('*')
          .limit(1);
        
        if (companyError) throw companyError;
        
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('status', 'active');
        
        if (locationsError) throw locationsError;
        
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .eq('status', 'active');
        
        if (customersError) throw customersError;
        
        if (locationsData) {
          setLocations(locationsData as Location[]);
        }
        
        if (customersData) {
          setCustomers(customersData as Customer[]);
        }
        
        if (companyData && companyData.length > 0) {
          setCompanyInfo(companyData[0] as CompanyInfo);
          
          // Set form values
          setFormData({
            code: companyData[0].code || "",
            name: companyData[0].name || "",
            address: companyData[0].address || "",
            phone: companyData[0].phone || "",
            email: companyData[0].email || "",
            website: companyData[0].website || "",
            tax_id: companyData[0].tax_id || "",
            header_text: companyData[0].header_text || "",
            footer_text: companyData[0].footer_text || "",
            base_location_id: companyData[0].base_location_id || "",
            base_customer_id: companyData[0].base_customer_id || ""
          });
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        toast({
          title: "Error",
          description: "Failed to load company information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanyInfo();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveCompanyInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const companyData = {
        code: formData.code,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        tax_id: formData.tax_id,
        header_text: formData.header_text,
        footer_text: formData.footer_text,
        base_location_id: formData.base_location_id,
        base_customer_id: formData.base_customer_id
      };
      
      if (companyInfo.id) {
        // Update existing record
        const { error } = await supabase
          .from('company_info')
          .update(companyData)
          .eq('id', companyInfo.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('company_info')
          .insert([companyData]);
        
        if (error) throw error;
      }
      
      // Update local storage
      localStorage.setItem('companyInfo', JSON.stringify({
        ...companyData,
        id: companyInfo.id
      }));
      
      toast({
        title: "Success",
        description: "Company information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving company info:', error);
      toast({
        title: "Error",
        description: "Failed to save company information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form fields to use correct property names
  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Company Settings</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Manage your company's basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCompanyInfo}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Company Code
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Company Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="base_location_id" className="text-right">
                    Base Location
                  </Label>
                  <Select
                    value={formData.base_location_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, base_location_id: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="base_customer_id" className="text-right">
                    Base Customer
                  </Label>
                  <Select
                    value={formData.base_customer_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, base_customer_id: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="header_text" className="text-right">
                    Header Text
                  </Label>
                  <Textarea
                    id="header_text"
                    name="header_text"
                    value={formData.header_text}
                    onChange={handleInputChange}
                    className="col-span-3"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="footer_text" className="text-right">
                    Footer Text
                  </Label>
                  <Textarea
                    id="footer_text"
                    name="footer_text"
                    value={formData.footer_text}
                    onChange={handleInputChange}
                    className="col-span-3"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input
                      id="tax_id"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettings;

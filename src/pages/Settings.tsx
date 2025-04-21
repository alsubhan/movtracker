import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Barcode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { hasPermission } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DatabaseUtilityContent from "./utilities/DatabaseUtilityContent";
import { Location, Customer } from "@/types";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";

interface Settings {
  id: string;
  company_code: string;
  company_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  header_text: string;
  footer_text: string;
  base_location_id: string;
  base_customer_id: string;
  default_code_type: 'customer' | 'type' | 'company';
  created_at: string;
  updated_at: string;
}

const initialSettings: Settings = {
  id: "",
  company_code: "",
  company_name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  tax_id: "",
  header_text: "",
  footer_text: "",
  base_location_id: "none",
  base_customer_id: "none",
  default_code_type: 'company',
  created_at: "",
  updated_at: ""
};

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [enableManualScanning, setEnableManualScanning] = useState(true);
  const [formData, setFormData] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const tab = location.pathname.split("/").pop() || "company";

  async function fetchSettingsSchema() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      
      console.log('Settings schema:', Object.keys(data));
      return Object.keys(data);
    } catch (error) {
      console.error('Error fetching settings schema:', error);
      throw error;
    }
  }

  useEffect(() => {
    fetchSettingsSchema()
      .then((fields) => {
        console.log('Available fields:', fields);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  // Check current theme and settings on component mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    // Load settings
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .limit(1);
        
        if (settingsError) throw settingsError;
        
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
          const typedLocations = locationsData.map(loc => ({
            id: loc.id,
            name: loc.name,
            status: loc.status as "active" | "inactive"
          }));
          setLocations(typedLocations);
        }
        
        if (customersData) {
          const typedCustomers = customersData.map(cust => ({
            id: cust.id,
            code: cust.code,
            name: cust.name,
            contact_person: cust.contact_person,
            phone: cust.phone,
            email: cust.email,
            status: cust.status as "active" | "inactive",
            created_at: cust.created_at
          }));
          setCustomers(typedCustomers);
        }
        
        if (settingsData && settingsData.length > 0) {
          const settingsRow = settingsData[0] as Settings;
          const typedSettings: Settings = {
            id: settingsRow.id,
            company_code: settingsRow.company_code ?? "MOB",
            company_name: settingsRow.company_name ?? "",
            address: settingsRow.address ?? "",
            phone: settingsRow.phone ?? "",
            email: settingsRow.email ?? "",
            website: settingsRow.website ?? "",
            tax_id: settingsRow.tax_id ?? "",
            header_text: settingsRow.header_text ?? "",
            footer_text: settingsRow.footer_text ?? "",
            base_location_id: settingsRow.base_location_id ?? "none",
            base_customer_id: settingsRow.base_customer_id ?? "none",
            default_code_type: settingsRow.default_code_type ?? 'company',
            created_at: settingsRow.created_at,
            updated_at: settingsRow.updated_at
          };
          setFormData(typedSettings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [toast]);

  // Update theme when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save theme preference to localStorage
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Determine which tab to display based on URL
  useEffect(() => {
    const settings = {
      notifications: enableNotifications,
      autoSave: autoSave,
      manualScanning: enableManualScanning,
      defaultCodeType: formData.default_code_type
    };
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [enableNotifications, autoSave, enableManualScanning, formData.default_code_type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    } as Settings));
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const updateData = {
        company_name: formData.company_name,
        company_code: formData.company_code,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        tax_id: formData.tax_id,
        header_text: formData.header_text,
        footer_text: formData.footer_text,
        base_location_id: formData.base_location_id,
        base_customer_id: formData.base_customer_id,
        default_code_type: formData.default_code_type
      };

      if (formData.id) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('settings')
          .update(updateData)
          .eq('id', formData.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new settings
        const { error: insertError } = await supabase
          .from('settings')
          .insert([updateData]);

        if (insertError) {
          throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Tabs value={tab} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="ui">UI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="company_code">Company Code</Label>
                  <Input
                    id="company_code"
                    name="company_code"
                    value={formData.company_code}
                    onChange={handleInputChange}
                    placeholder="Enter company code"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter company address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="Enter website URL"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                    placeholder="Enter tax ID"
                  />
                </div>
                <div>
                  <Label htmlFor="header_text">Header Text</Label>
                  <Textarea
                    id="header_text"
                    name="header_text"
                    value={formData.header_text}
                    onChange={handleInputChange}
                    placeholder="Enter header text"
                  />
                </div>
                <div>
                  <Label htmlFor="footer_text">Footer Text</Label>
                  <Textarea
                    id="footer_text"
                    name="footer_text"
                    value={formData.footer_text}
                    onChange={handleInputChange}
                    placeholder="Enter footer text"
                  />
                </div>
                <div>
                  <Label>Base Location</Label>
                  <Select
                    value={formData.base_location_id}
                    onValueChange={(value) => 
                      setFormData({ ...formData, base_location_id: value } as Settings)
                    }
                  >
                    <SelectTrigger>
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
                </div>
                <div>
                  <Label>Base Customer</Label>
                  <Select
                    value={formData.base_customer_id}
                    onValueChange={(value) => 
                      setFormData({ ...formData, base_customer_id: value } as Settings)
                    }
                  >
                    <SelectTrigger>
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
                </div>
                <div>
                  <Label>Default Code Type</Label>
                  <Select
                    value={formData.default_code_type}
                    onValueChange={(value) => 
                      setFormData({ ...formData, default_code_type: value } as Settings)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default code type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company Code</SelectItem>
                      <SelectItem value="type">Inventory Type</SelectItem>
                      <SelectItem value="customer">Customer Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="ui" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>UI Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="darkMode"
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
                <Label htmlFor="darkMode">Dark Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications"
                  checked={enableNotifications}
                  onCheckedChange={setEnableNotifications}
                />
                <Label htmlFor="notifications">Enable Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoSave"
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
                <Label htmlFor="autoSave">Auto Save</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="manualScanning"
                  checked={enableManualScanning}
                  onCheckedChange={setEnableManualScanning}
                />
                <Label htmlFor="manualScanning">Enable Manual Scanning</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

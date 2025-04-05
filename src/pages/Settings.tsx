
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Barcode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";

// Import the DatabaseUtility component content
import DatabaseUtilityContent from "./utilities/DatabaseUtilityContent";
// Import company settings component
import CompanySettings from "./settings/CompanySettings";

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [enableManualScanning, setEnableManualScanning] = useState(true); // Default to true
  const [defaultCodeType, setDefaultCodeType] = useState<'customer' | 'type' | 'company'>('company');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // Check current theme and settings on component mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    const settings = localStorage.getItem("settings");
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.notifications !== undefined) 
          setEnableNotifications(parsedSettings.notifications);
        if (parsedSettings.autoSave !== undefined) 
          setAutoSave(parsedSettings.autoSave);
        if (parsedSettings.manualScanning !== undefined) 
          setEnableManualScanning(parsedSettings.manualScanning);
        if (parsedSettings.defaultCodeType) 
          setDefaultCodeType(parsedSettings.defaultCodeType);
        else
          setDefaultCodeType('company'); // Default to company if not set
      } catch (error) {
        console.error("Error parsing settings from localStorage", error);
      }
    }
  }, []);

  // Update theme when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem("settings", JSON.stringify({
      darkMode: isDarkMode,
      notifications: enableNotifications,
      autoSave: autoSave,
      manualScanning: enableManualScanning,
      defaultCodeType: defaultCodeType
    }));

    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated",
    });
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
            {hasPermission(PERMISSIONS.DATABASE_UTILITIES) && (
              <TabsTrigger value="database">Database Utilities</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode" className="text-base font-medium">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications" className="text-base font-medium">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable notifications for inventory movements</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={enableNotifications}
                    onCheckedChange={setEnableNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-save" className="text-base font-medium">Auto Save</Label>
                    <p className="text-sm text-muted-foreground">Automatically save form data</p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <Barcode className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="manual-scanning" className="text-base font-medium">Manual Barcode Scanning</Label>
                      <p className="text-sm text-muted-foreground">Enable when RFID scanner is not available</p>
                    </div>
                  </div>
                  <Switch
                    id="manual-scanning"
                    checked={enableManualScanning}
                    onCheckedChange={setEnableManualScanning}
                  />
                </div>

                <div>
                  <h3 className="text-base font-medium mb-2">Default Code Type</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the default code type for inventory items
                  </p>
                  
                  <RadioGroup 
                    value={defaultCodeType}
                    onValueChange={(value) => setDefaultCodeType(value as 'customer' | 'type' | 'company')}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="default-customer" />
                      <Label htmlFor="default-customer">Customer Code</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="type" id="default-type" />
                      <Label htmlFor="default-type">Type Code</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="company" id="default-company" />
                      <Label htmlFor="default-company">Company Code</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <CompanySettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
              
              <div className="space-y-4">
                {hasPermission(PERMISSIONS.USER_MANAGEMENT) && (
                  <Button variant="outline" onClick={() => navigate("/users")}>
                    Manage Users
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    localStorage.removeItem("isLoggedIn");
                    navigate("/auth");
                    toast({
                      title: "Logged Out",
                      description: "You have been logged out successfully",
                    });
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </TabsContent>

          {hasPermission(PERMISSIONS.DATABASE_UTILITIES) && (
            <TabsContent value="database" className="space-y-6">
              <DatabaseUtilityContent />
            </TabsContent>
          )}
        </Tabs>

        <Button className="flex items-center mt-6" onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </ScrollArea>
  );
};

export default Settings;

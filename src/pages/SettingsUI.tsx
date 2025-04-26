import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SettingsUI = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [enableManualScanning, setEnableManualScanning] = useState(true);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setIsDarkMode(theme === "dark");
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    setEnableNotifications(settings.notifications ?? true);
    setAutoSave(settings.autoSave ?? false);
    setEnableManualScanning(settings.manualScanning ?? true);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const cfg = {
      notifications: enableNotifications,
      autoSave,
      manualScanning: enableManualScanning,
    };
    localStorage.setItem("settings", JSON.stringify(cfg));
  }, [enableNotifications, autoSave, enableManualScanning]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">UI Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>UI Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="darkMode" checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            <Label htmlFor="darkMode">Dark Mode</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="notifications" checked={enableNotifications} onCheckedChange={setEnableNotifications} />
            <Label htmlFor="notifications">Enable Notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="autoSave" checked={autoSave} onCheckedChange={setAutoSave} />
            <Label htmlFor="autoSave">Auto Save</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="manualScanning" checked={enableManualScanning} onCheckedChange={setEnableManualScanning} />
            <Label htmlFor="manualScanning">Enable Manual Scanning</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsUI;

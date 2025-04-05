
import { useState } from "react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import MovementReport from "./reports/MovementReport";
import MissingReport from "./reports/MissingReport";
import RentalReport from "./reports/RentalReport";
import { FileText, AlertCircle, IndianRupee } from "lucide-react";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("movement");

  return (
    <div className="flex-1 space-y-4 p-6 pt-6 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
      </div>

      <Tabs defaultValue="movement" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="movement" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Movement Report</span>
          </TabsTrigger>
          <TabsTrigger value="missing" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Missing Report</span>
          </TabsTrigger>
          <TabsTrigger value="rental" className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            <span>Rental Report</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4 overflow-auto">
          <TabsContent value="movement" className="w-full">
            <MovementReport />
          </TabsContent>
          <TabsContent value="missing" className="w-full">
            <MissingReport />
          </TabsContent>
          <TabsContent value="rental" className="w-full">
            <RentalReport />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Reports;

import { useState } from "react";
import MovementReport from "./reports/MovementReport";
import { FileText } from "lucide-react";

const Reports = () => {
  return (
    <div className="flex-1 space-y-4 p-6 pt-6 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Movement Report</h2>
      </div>

      <div className="mt-4 overflow-auto">
        <MovementReport />
      </div>
    </div>
  );
};

export default Reports;

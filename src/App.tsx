
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import UserMaster from "./pages/masters/UserMaster";
import BinMaster from "./pages/masters/BinMaster";
import GatesMaster from "./pages/masters/GatesMaster";
import RFIDLabelPrinting from "./pages/transactions/RFIDLabelPrinting";
import BinMovement from "./pages/transactions/BinMovement";
import NotFound from "./pages/NotFound";
import BinMovementReport from "./pages/reports/BinMovementReport";
import MissingBinReport from "./pages/reports/MissingBinReport";
import DatabaseUtility from "./pages/utilities/DatabaseUtility";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/masters/user" element={<UserMaster />} />
        <Route path="/masters/bin" element={<BinMaster />} />
        <Route path="/masters/gates" element={<GatesMaster />} />
        <Route path="/transactions/rfid-printing" element={<RFIDLabelPrinting />} />
        <Route path="/transactions/bin-movement" element={<BinMovement />} />
        <Route path="/reports/bin-movement" element={<BinMovementReport />} />
        <Route path="/reports/missing-bins" element={<MissingBinReport />} />
        <Route path="/utilities/database" element={<DatabaseUtility />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

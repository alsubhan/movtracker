import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import RentalReport from './RentalReport';
import InventoryReport from './InventoryReport';

const ReportsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <Tabs defaultValue="rental" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rental">Rental Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
        </TabsList>
        <TabsContent value="rental">
          <RentalReport />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;

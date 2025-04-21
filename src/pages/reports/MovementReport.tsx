import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, ArrowRight, Box, Download } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

export type MovementWithRelations = {
  id: string;
  inventoryCode: string;
  gateName: string;
  movementType: string;
  from: string;
  to: string;
  status: string;
};

const MovementReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [movements, setMovements] = useState<MovementWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMovements = async () => {
      setIsLoading(true);
      try {
        // Fetch movement data with related information
        const { data: movementData, error: movementError } = await supabase
          .from('inventory_movements')
          .select('id, inventory_id, gate_id, movement_type, customer_location_id, previous_location_id')
          .gte('timestamp', dateRange.from.toISOString())
          .lte('timestamp', dateRange.to.toISOString())
          .order('timestamp', { ascending: false });

        if (movementError) throw movementError;

        if (movementData && movementData.length > 0) {
          // Fetch related inventory codes
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('id, rfid_tag, status')  // include status
            .in('id', movementData.map(m => m.inventory_id));

          if (inventoryError) throw inventoryError;

          // Fetch both current and previous locations
          const locationIds = Array.from(new Set([
            ...movementData.map(m => m.customer_location_id),
            ...movementData.map(m => m.previous_location_id)
          ].filter(id => id !== null)));
          const { data: locationData, error: locationError } = await supabase
            .from('customer_locations')
            .select('id, location_name')
            .in('id', locationIds);

          if (locationError) throw locationError;

          // Fetch related gate names
          const { data: gateData, error: gateError } = await supabase
            .from('gates')
            .select('id, name')
            .in('id', movementData.map(m => m.gate_id).filter(id => id !== null));

          if (gateError) throw gateError;

          // Create maps for quick lookup
          const inventoryMap = new Map(
            inventoryData?.map(i => [
              i.id,
              { code: i.rfid_tag, status: (i as any).status }
            ]) || []
          );
          const locationMap = new Map(locationData?.map(l => [l.id, l.location_name]) || []);
          const gateMap = new Map(gateData?.map(g => [g.id, g.name]) || []);

          // Format the data with related information
          const formattedData = movementData.map(movement => {
            const inv = inventoryMap.get(movement.inventory_id as string) || { code: 'Unknown', status: 'Unknown' };
            return {
              id: movement.id,
              inventoryCode: inv.code,
              gateName: gateMap.get(movement.gate_id as string) || 'Unknown',
              movementType: movement.movement_type,
              from: locationMap.get(movement.previous_location_id as string) || 'Unknown',
              to: locationMap.get(movement.customer_location_id as string) || 'Unknown',
              status: inv.status as string
            };
          });

          setMovements(formattedData);
        } else {
          setMovements([]);
        }
      } catch (error) {
        console.error('Error fetching movements:', error);
        toast({
          title: "Error",
          description: "Failed to fetch movements",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovements();
  }, [dateRange, toast]);

  const filteredMovements = movements.filter(movement => 
    movement.inventoryCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by inventory code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <DatePickerWithRange
          date={dateRange}
          setDate={setDateRange}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movement Report</CardTitle>
          <CardDescription>
            Shows all inventory movements within the selected date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inventory ID</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Movement</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.inventoryCode}</TableCell>
                    <TableCell>{movement.gateName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={movement.movementType === 'in' ? 'destructive' : 'secondary'}
                      >
                        {movement.movementType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.from}</TableCell>
                    <TableCell>{movement.to}</TableCell>
                    <TableCell>{movement.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementReport;

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// minimal type for report rows
type InventoryRow = { id: string; location: string; status: string };

const InventoryReport: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<InventoryRow[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryRow[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [allStatuses, setAllStatuses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Pagination
  const PAGE_SIZE = 1000;
  const [page, setPage] = useState(0);

  // Type for location options
  type LocationOption = string;
  const [locations, setLocations] = useState<LocationOption[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        // Fetch all locations
        const { data: allCustomerLocs, error: allCustomerLocError } = await supabase
          .from('customer_locations')
          .select('id, location_name');
        if (allCustomerLocError) throw allCustomerLocError;

        const { data: allDefaultLocs, error: allDefaultLocError } = await supabase
          .from('locations')
          .select('id, name');
        if (allDefaultLocError) throw allDefaultLocError;

        // Combine all locations into a single map and set locations state
        const allLocations = new Map<string, string>([
          ...allCustomerLocs?.map(l => [l.id, l.location_name] as [string, string]) ?? [],
          ...allDefaultLocs?.map(l => [l.id, l.name] as [string, string]) ?? []
        ]);
        
        // Update locations state with all location names
        setLocations(['all', ...Array.from(allLocations.values())]);

        // Define all possible statuses
        const allPossibleStatuses = ['In-Stock', 'In-Transit', 'Received', 'Returned'];

        // Fetch inventory data for status filtering
        const { data: statusInventoryData, error: statusInventoryError } = await supabase
          .from('inventory')
          .select('status');
        if (statusInventoryError) throw statusInventoryError;

        // Fetch inventory data with last_customer_location_id
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('id, last_customer_location_id, status');
        if (inventoryError) throw inventoryError;

        // Fetch customer locations for inventory
        const { data: inventoryCustomerLocs, error: inventoryCustomerLocError } = await supabase
          .from('customer_locations')
          .select('id, location_name');
        if (inventoryCustomerLocError) throw inventoryCustomerLocError;

        // Map customer location IDs to names
        const customerLocMap = new Map(inventoryCustomerLocs.map(loc => [loc.id, loc.location_name]));

        // Update inventory data with location names using last_customer_location_id
        const inventoryWithLocations = inventoryData.map(item => ({
          ...item,
          location: customerLocMap.get(item.last_customer_location_id) || 'Unknown'
        }));

        // Set initial data and extract unique statuses
        setData(inventoryWithLocations);
        setAllStatuses(allStatuses);
        setFilteredData(inventoryWithLocations);

        // Fetch inventory items with RFID, status, and default location
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .select('id, rfid_tag, status, location_id');
        if (invError) throw invError;
        const items = invData || [];

        // Build map of latest movement location per inventory
        const { data: movData, error: movErr } = await supabase
          .from('inventory_movements')
          .select('inventory_id, customer_location_id')
          .order('timestamp', { ascending: false });
        if (movErr) throw movErr;
        const movementMap = new Map<string, string>();
        movData?.forEach(m => {
          if (m.inventory_id && m.customer_location_id && !movementMap.has(m.inventory_id)) {
            movementMap.set(m.inventory_id, m.customer_location_id);
          }
        });

        // Fetch movement-based locations from customer_locations
        const movedLocIds = Array.from(new Set(movementMap.values()));
        const { data: movLocData, error: movLocErr } = await supabase
          .from('customer_locations')
          .select('id, location_name')
          .in('id', movedLocIds);
        if (movLocErr) throw movLocErr;
        // Fetch default locations from locations table
        const defaultLocIds = items
          .map(i => (i as any).location_id)
          .filter((id): id is string => Boolean(id));
        const { data: defLocData, error: defLocErr } = await supabase
          .from('locations')
          .select('id, name')
          .in('id', defaultLocIds);
        if (defLocErr) throw defLocErr;
        // Merge movement and default locations into a typed entries array
        const locEntries: [string, string][] = [
          ...(movLocData?.map(l => [l.id, l.location_name] as [string, string]) ?? []),
          ...(defLocData?.map(l => [l.id, l.name] as [string, string]) ?? [])
        ];
        const locMap = new Map<string, string>(locEntries);

        // Construct rows, falling back to inventory.location_id when no movement exists
        const rows = items.map(item => {
          const locId = movementMap.get(item.id) || (item as any).location_id;
          return {
            id: item.rfid_tag || item.id,
            location: locMap.get(locId) || 'Unknown',
            status: item.status as string
          };
        });
        setData(rows);
        setFilteredData(rows);
      } catch (error: any) {
        console.error('Error fetching inventory:', error);
        toast({
          title: 'Error',
          description: error.message ? `Failed to fetch inventory: ${error.message}` : 'Failed to fetch inventory',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [toast]);

  useEffect(() => {
    let filtered = data;
    if (selectedLocation !== 'all') filtered = filtered.filter(i => 
      i.location?.trim().toLowerCase() === selectedLocation.trim().toLowerCase()
    );
    if (selectedStatus !== 'all') filtered = filtered.filter(i => 
      i.status?.trim().toLowerCase() === selectedStatus.trim().toLowerCase()
    );
    setPage(0);
    setFilteredData(filtered);
  }, [data, selectedLocation, selectedStatus]);

  // Use predefined statuses for the filter
  const allPossibleStatuses = ['In-Stock', 'In-Transit', 'Received', 'Returned'];
  const statuses = ['all', ...allPossibleStatuses];

  // Export filtered report to CSV
  const handleExport = () => {
    const headers = ['Inventory ID', 'Location', 'Status'];
    const rows = filteredData.map(i => [i.id, i.location, i.status]);
    const csvContent = [headers, ...rows]
      .map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventory_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(loc => (
              <SelectItem key={loc} value={loc}>
                {loc === 'all' ? 'All Locations' : loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(st => (
              <SelectItem key={st} value={st}>
                {st === 'all' ? 'All Statuses' : st}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleExport}>Export</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Report</CardTitle>
          <CardDescription>Inventory items by location and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inventory ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.slice(0, (page+1)*PAGE_SIZE).map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'In-Stock' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredData.length > (page+1)*PAGE_SIZE && (
            <div className="flex justify-center py-4">
              <Button onClick={() => setPage(p => p+1)}>Load more</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReport;

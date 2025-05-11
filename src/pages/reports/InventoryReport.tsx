import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileDown } from 'lucide-react';

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  // Pagination
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);

  // Type for location options
  type LocationOption = string;
  const [locations, setLocations] = useState<LocationOption[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (page === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

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
        setAllStatuses(allPossibleStatuses);

        // Build base query
        let query = supabase
          .from('inventory')
          .select('id, rfid_tag, status, location_id, last_customer_location_id', { count: 'exact' });

        // Add status filter if not 'all'
        if (selectedStatus && selectedStatus !== 'all') {
          query = query.eq('status', selectedStatus);
        }

        // First get total count
        const { count, error: countError } = await query;
        if (countError) throw countError;
        setTotalCount(count || 0);

        // Fetch paginated inventory
        const { data: invData, error: invError } = await query
          .order('id', { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (invError) {
          console.error('Error fetching inventory:', invError);
          if (page === 0) {
            setData([]);
            setFilteredData([]);
          }
          return;
        }

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
          .map(i => i.location_id)
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
        const newRows = items.map(item => {
          const locId = movementMap.get(item.id) || item.location_id;
          return {
            id: item.rfid_tag || item.id,
            location: locMap.get(locId) || 'Unknown',
            status: item.status as string
          };
        });

        // Update states
        setData(prevData => {
          const updatedData = page === 0 ? newRows : [...prevData, ...newRows];
          return updatedData;
        });

        // Apply filters to the complete dataset
        const completeData = page === 0 ? newRows : [...data, ...newRows];
        const filtered = applyFilters(completeData, selectedLocation, selectedStatus);
        setFilteredData(filtered);

      } catch (error: any) {
        console.error('Error fetching inventory:', error);
        toast({
          title: 'Error',
          description: error.message ? `Failed to fetch inventory: ${error.message}` : 'Failed to fetch inventory',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };
    fetchInventory();
  }, [page, selectedLocation, selectedStatus, toast]);

  // Helper function to apply filters
  const applyFilters = (data: InventoryRow[], location: string, status: string) => {
    let filtered = data;
    
    if (location && location !== 'all') {
      filtered = filtered.filter(i => 
        i.location?.trim().toLowerCase() === location.trim().toLowerCase()
      );
    }
    
    if (status && status !== 'all') {
      filtered = filtered.filter(i => 
        i.status?.trim().toLowerCase() === status.trim().toLowerCase()
      );
    }
    
    return filtered;
  };

  const loadMoreItems = () => {
    if (totalCount > (page + 1) * PAGE_SIZE) {
      setPage(prev => prev + 1);
    }
  };

  // Handle location change
  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    setPage(0);
    setData([]);
    setFilteredData([]);
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setPage(0);
    setData([]);
    setFilteredData([]);
  };

  // Export filtered report to CSV
  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // Build base query for export
      let query = supabase
        .from('inventory')
        .select('id, rfid_tag, status, location_id, last_customer_location_id', { count: 'exact' });

      // Add status filter if not 'all'
      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      // First get total count
      const { count, error: countError } = await query;
      if (countError) throw countError;

      const totalItems = count || 0;
      const BATCH_SIZE = 1000; // Supabase's default limit
      let allItems: any[] = [];

      // Fetch all items in batches
      for (let offset = 0; offset < totalItems; offset += BATCH_SIZE) {
        const { data: batchData, error: batchError } = await query
          .order('id', { ascending: true })
          .range(offset, offset + BATCH_SIZE - 1);

        if (batchError) throw batchError;
        if (batchData) {
          allItems = [...allItems, ...batchData];
        }
      }

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
      const defaultLocIds = allItems
        .map(i => i.location_id)
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

      // Construct rows for export
      const exportRows = allItems.map(item => {
        const locId = movementMap.get(item.id) || item.location_id;
        return {
          id: item.rfid_tag || item.id,
          location: locMap.get(locId) || 'Unknown',
          status: item.status as string
        };
      });

      // Apply location filter if needed
      const filteredRows = selectedLocation && selectedLocation !== 'all'
        ? exportRows.filter(i => i.location?.trim().toLowerCase() === selectedLocation.trim().toLowerCase())
        : exportRows;

      // Generate CSV
      const headers = ['Inventory ID', 'Location', 'Status'];
      const rows = filteredRows.map(i => [i.id, i.location, i.status]);
      const csvContent = [headers, ...rows]
        .map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredRows.length} items to CSV.`
      });
    } catch (error: any) {
      console.error('Error exporting inventory:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export inventory data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-none p-4 md:p-8 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Inventory Report</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
            <CardDescription>
              View and analyze inventory by location and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Filters: Location and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select value={selectedLocation} onValueChange={handleLocationChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>
                          {loc === 'all' ? 'All Locations' : loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {['all', ...allStatuses].map(st => (
                        <SelectItem key={st} value={st}>
                          {st === 'all' ? 'All Statuses' : st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scrollable Data Section */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-8">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div className="text-sm text-muted-foreground">
                      {filteredData.length} items found
                    </div>
                    {totalCount > (page + 1) * PAGE_SIZE && !isLoadingMore && (
                      <Button 
                        onClick={loadMoreItems} 
                        disabled={isLoadingMore}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    )}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inventory ID</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <p className="text-sm text-muted-foreground">Loading data...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredData.length > 0 ? (
                        filteredData.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'In-Stock' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            No inventory items found matching your criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default InventoryReport;

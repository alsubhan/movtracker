import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to format dates as dd/mm/yyyy hh:mm
const formatDateTime = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export default function Movement() {
  const [searchInput, setSearchInput] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Status");

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      console.log('Searching with status filter:', statusFilter);
      
      let query = supabase
        .from("inventory_movements")
        .select(`
          id,
          inventory_id,
          movement_type,
          previous_location_id,
          customer_location_id,
          timestamp,
          reference_id,
          inventory!inner (
            id,
            rfid_tag,
            code,
            status
          ),
          previous_location:previous_location_id (
            location_name
          ),
          customer_location:customer_location_id (
            location_name
          )
        `)
        .ilike("inventory.rfid_tag", `%${searchInput}%`);

      // Add status filter if not "All Status"
      if (statusFilter !== "All Status") {
        console.log('Applying status filter:', statusFilter);
        // Convert status filter to match the case in the database
        const normalizedStatus = statusFilter.replace(/-/g, ' ').toLowerCase();
        query = query.ilike("inventory.status", normalizedStatus);
      }

      const response = await query;
      console.log('Query response:', response);

      if (response.data) {
        console.log('Filtered data:', response.data);
        setFilteredMovements(response.data);
        setTotalCount(response.data.length);
        setHasMore(response.data.length === 10);
      }
    } catch (error) {
      console.error("Error searching movements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setFilteredMovements([]);
    setTotalCount(0);
    setHasMore(false);
  };

  const loadMoreItems = async () => {
    setIsLoadingMore(true);
    try {
      let query = supabase
        .from("inventory_movements")
        .select(`
          id,
          inventory_id,
          movement_type,
          previous_location_id,
          customer_location_id,
          timestamp,
          reference_id,
          inventory!inner (
            id,
            rfid_tag,
            code,
            status
          ),
          previous_location:previous_location_id (
            location_name
          ),
          customer_location:customer_location_id (
            location_name
          )
        `)
        .ilike("inventory.rfid_tag", `%${searchInput}%`)
        .order("timestamp", { ascending: false })
        .range(filteredMovements.length, filteredMovements.length + 9);

      // Add status filter if not "All Status"
      if (statusFilter !== "All Status") {
        // Convert status filter to match the case in the database
        const normalizedStatus = statusFilter.replace(/-/g, ' ').toLowerCase();
        query = query.ilike("inventory.status", normalizedStatus);
      }

      const response = await query;

      if (response.data) {
        setFilteredMovements([...filteredMovements, ...response.data]);
        setTotalCount(totalCount + response.data.length);
        setHasMore(response.data.length === 10);
      }
    } catch (error) {
      console.error("Error loading more movements:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Update useEffect to include statusFilter dependency
  useEffect(() => {
    handleSearch();
  }, [statusFilter]); // Add statusFilter as a dependency

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Movement History</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
          <CardDescription>
            Track and manage inventory movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-[400px]">
                <Input
                  placeholder="Search Inventory ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearch}
                  className="h-10"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="h-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="In-Transit">In-Transit</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <div className="text-sm text-muted-foreground">
                    {filteredMovements.length} movements found
                  </div>
                  {hasMore && (
                    <Button 
                      onClick={loadMoreItems} 
                      disabled={isLoadingMore}
                      className="flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
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
                      <TableHead>Type</TableHead>
                      <TableHead>From Location</TableHead>
                      <TableHead>To Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No movements found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium">
                            {movement.inventory?.code || movement.inventory?.rfid_tag}
                          </TableCell>
                          <TableCell>
                            <span className="uppercase">{movement.movement_type}</span>
                          </TableCell>
                          <TableCell>{movement.previous_location?.location_name}</TableCell>
                          <TableCell>{movement.customer_location?.location_name}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              movement.inventory?.status === 'In-Transit' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : movement.inventory?.status === 'Received'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {movement.inventory?.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatDateTime(new Date(movement.timestamp))}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
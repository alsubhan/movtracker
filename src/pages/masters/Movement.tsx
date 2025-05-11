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

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await supabase
        .from("movements")
        .select("*")
        .ilike("inventory_id", `%${searchInput}%`);

      if (response.data) {
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
      const response = await supabase
        .from("movements")
        .select("*")
        .ilike("inventory_id", `%${searchInput}%`)
        .order("created_at", { ascending: true })
        .range(filteredMovements.length, filteredMovements.length + 9);

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
            <div className="flex items-center gap-2">
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
                          <TableCell className="font-medium">{movement.inventory_id}</TableCell>
                          <TableCell>{movement.type}</TableCell>
                          <TableCell>{movement.from_location}</TableCell>
                          <TableCell>{movement.to_location}</TableCell>
                          <TableCell>{movement.status}</TableCell>
                          <TableCell>{formatDateTime(new Date(movement.created_at))}</TableCell>
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
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerLocation } from "@/types/index";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LocationSelectorProps {
  userId: string;
  onClose: () => void;
  onLocationSelected?: (locationId: string) => void;
}

export function LocationSelector({ userId, onClose }: LocationSelectorProps) {
  const [locations, setLocations] = useState<CustomerLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    props.onLocationSelected?.(locationId);
    onClose();
  };

  const updateLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ customer_location_id: locationId })
        .eq('id', userId);

      if (error) {
        console.error('Error updating location:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update location",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive"
      });
    }
  };
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('customer_locations')
          .select('location_id, location_name, created_at')
          .order('location_name');

        if (error) {
          console.error('Error fetching locations:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to load locations",
            variant: "destructive"
          });
          throw error;
        }

        const locationsData = data?.map(loc => ({
          id: loc.location_id,
          name: loc.location_name,
          created_at: loc.created_at
        })) || [];

        setLocations(locationsData);
        console.log('Processed locations:', locationsData);
        
        // Also fetch the current location
        fetchCurrentLocation();
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({
          title: "Error",
          description: "Failed to load locations",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [userId]);

  const fetchCurrentLocation = async () => {
    try {
      // Get the current location ID from localStorage if it exists
      const currentLocationId = localStorage.getItem('current_location_id');
      setSelectedLocation(currentLocationId || null);
    } catch (error) {
      console.error('Error fetching current location:', error);
      setSelectedLocation(null);
    }
  };

  const handleLocationChange = async (locationId: string) => {
    try {
      // Just update the selected location in state and localStorage
      setSelectedLocation(locationId);
      localStorage.setItem('current_location_id', locationId);

      setSelectedLocation(locationId);
      localStorage.setItem('current_location_id', locationId);
      toast({
        title: "Success",
        description: "Location updated successfully"
      });
      
      // Close the selector after successful update
      onClose();
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Select
        defaultValue=""
        onValueChange={(value) => {
          setSelectedLocation(value);
          updateLocation(value);
          onClose();
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
          <SelectItem 
            key={location.id} 
            value={location.id}
            className="cursor-pointer"
          >
            {location.name}
          </SelectItem>
        ))}
        </SelectContent>
      </Select>
      <div className="text-sm text-muted-foreground">
        Your current location will be used for all inventory operations
      </div>
    </div>
  );
}

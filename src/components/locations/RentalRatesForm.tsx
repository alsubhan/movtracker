
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RentalRatesFormProps {
  customerId: string;
  locationId: string;
  existingRates?: {[key: string]: number};
  onSave: () => void;
}

const RentalRatesForm = ({ 
  customerId, 
  locationId, 
  existingRates = {}, 
  onSave 
}: RentalRatesFormProps) => {
  const [inventoryTypes, setInventoryTypes] = useState<{id: string, code: string, name: string}[]>([]);
  const [rates, setRates] = useState<{[key: string]: number}>(existingRates);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInventoryTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory_types')
          .select('id, code, name')
          .eq('status', 'active');
          
        if (error) throw error;
        
        if (data) {
          setInventoryTypes(data);
          
          // Initialize rates for all inventory types
          const initialRates = {...rates};
          data.forEach(type => {
            if (!initialRates[type.code]) {
              initialRates[type.code] = 0;
            }
          });
          
          setRates(initialRates);
        }
      } catch (error) {
        console.error('Error fetching inventory types:', error);
        toast({
          title: "Error",
          description: "Failed to load inventory types",
          variant: "destructive",
        });
      }
    };
    
    fetchInventoryTypes();
  }, [customerId, locationId, toast]);

  // Update rates with existing rates when they change
  useEffect(() => {
    setRates(existingRates);
  }, [existingRates]);

  const handleRateChange = (typeCode: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setRates(prev => ({
      ...prev,
      [typeCode]: numericValue
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Get the current customer location
      const { data: locationData, error: locationError } = await supabase
        .from('customer_locations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('location_id', locationId)
        .maybeSingle();
        
      if (locationError && locationError.code !== 'PGRST116') {
        throw locationError;
      }
      
      if (locationData) {
        // Update existing location rates
        const { error: updateError } = await supabase
          .from('customer_locations')
          .update({ rental_rates: rates })
          .eq('id', locationData.id);
          
        if (updateError) throw updateError;
      } else {
        // Get location name
        const { data: locations, error: locError } = await supabase
          .from('locations')
          .select('name')
          .eq('id', locationId)
          .single();
          
        if (locError) throw locError;
        
        // Create new customer location with rates
        const { error: insertError } = await supabase
          .from('customer_locations')
          .insert({
            customer_id: customerId,
            location_id: locationId,
            location_name: locations.name,
            rental_rates: rates
          });
          
        if (insertError) throw insertError;
      }
      
      toast({
        title: "Rates Saved",
        description: "Rental rates have been saved successfully",
      });
      
      onSave();
    } catch (error) {
      console.error('Error saving rental rates:', error);
      toast({
        title: "Error",
        description: "Failed to save rental rates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set hourly rental rates for each inventory type at this location.
          </p>
          
          <div className="grid gap-4">
            {inventoryTypes.map(type => (
              <div key={type.id} className="flex items-center justify-between">
                <Label htmlFor={`rate-${type.code}`} className="flex-1">
                  {type.name} ({type.code})
                </Label>
                <div className="flex items-center w-32">
                  <IndianRupee className="h-4 w-4 mr-1 text-muted-foreground" />
                  <Input
                    id={`rate-${type.code}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={rates[type.code] || 0}
                    onChange={(e) => handleRateChange(type.code, e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Rates"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RentalRatesForm;

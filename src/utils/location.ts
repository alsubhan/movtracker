import { supabase } from "@/integrations/supabase/client";

export const fetchLocations = async () => {
  try {
    const { data, error } = await supabase
      .from('customer_locations')
      // Fetch primary key id and the name column
      .select('id, location_name')
      .order('location_name');

    if (error) throw error;
    
    return data?.map(loc => ({
      id: loc.id,
      name: loc.location_name
    })) || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../../supabase/functions/_shared/cors';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: corsHeaders,
  },
});

// Function to fetch table schema
export async function getTableSchema(tableName: string) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', tableName);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching schema:', error);
    throw error;
  }
}

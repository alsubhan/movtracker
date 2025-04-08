export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bin_movements: {
        Row: {
          bin_id: string
          gate_id: string | null
          id: string
          location: string
          movement_type: string
          previous_location: string | null
          recorded_by: string
          timestamp: string
        }
        Insert: {
          bin_id: string
          gate_id?: string | null
          id?: string
          location: string
          movement_type: string
          previous_location?: string | null
          recorded_by: string
          timestamp?: string
        }
        Update: {
          bin_id?: string
          gate_id?: string | null
          id?: string
          location?: string
          movement_type?: string
          previous_location?: string | null
          recorded_by?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "bin_movements_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
        ]
      }
      bins: {
        Row: {
          created_at: string
          created_by: string
          customer: string
          id: string
          last_scan_gate: string | null
          last_scan_time: string | null
          location: string
          partition: string | null
          project: string | null
          rfid_tag: string
          serial_number: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer: string
          id?: string
          last_scan_gate?: string | null
          last_scan_time?: string | null
          location?: string
          partition?: string | null
          project?: string | null
          rfid_tag: string
          serial_number?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer?: string
          id?: string
          last_scan_gate?: string | null
          last_scan_time?: string | null
          location?: string
          partition?: string | null
          project?: string | null
          rfid_tag?: string
          serial_number?: string | null
          status?: string
        }
        Relationships: []
      }
      company_info: {
        Row: {
          address: string | null
          base_customer_id: string | null
          base_location_id: string | null
          code: string
          created_at: string | null
          email: string | null
          footer_text: string
          header_text: string
          id: string
          name: string
          phone: string | null
          tax_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          base_customer_id?: string | null
          base_location_id?: string | null
          code: string
          created_at?: string | null
          email?: string | null
          footer_text: string
          header_text: string
          id?: string
          name: string
          phone?: string | null
          tax_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          base_customer_id?: string | null
          base_location_id?: string | null
          code?: string
          created_at?: string | null
          email?: string | null
          footer_text?: string
          header_text?: string
          id?: string
          name?: string
          phone?: string | null
          tax_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      customer_locations: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          location_id: string
          location_name: string
          rental_rates: Json | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          location_id: string
          location_name: string
          rental_rates?: Json | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          location_id?: string
          location_name?: string
          rental_rates?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          code: string
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          code: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          code?: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      gate_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      gates: {
        Row: {
          created_at: string | null
          gate_location: string
          id: string
          name: string
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          gate_location: string
          id?: string
          name: string
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          gate_location?: string
          id?: string
          name?: string
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      inventory_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          password: string
          role: string | null
          status: string | null
          username: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          password: string
          role?: string | null
          status?: string | null
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          password?: string
          role?: string | null
          status?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_profiles_rls_policy: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

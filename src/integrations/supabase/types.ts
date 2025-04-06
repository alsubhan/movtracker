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
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

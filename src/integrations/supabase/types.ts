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
      inventory_movements: {
        Row: {
          id: string
          inventory_id: string
          gate_id: string | null
          location: string
          movement_type: string
          previous_location: string | null
          recorded_by: string
          timestamp: string
          customer: string
          project: string
          gate: {
            name: string
          }
          inventory: {
            rfid_tag: string
          }
        }
        Insert: {
          id?: string
          inventory_id: string
          gate_id?: string | null
          location: string
          movement_type: string
          previous_location?: string | null
          recorded_by: string
          timestamp?: string
          customer: string
          project: string
        }
        Update: {
          id?: string
          inventory_id?: string
          gate_id?: string | null
          location?: string
          movement_type?: string
          previous_location?: string | null
          recorded_by?: string
          timestamp?: string
          customer?: string
          project?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "gates"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory: {
        Row: {
          id: string
          rfid_tag: string
          name: string
          description: string | null
          inventory_type_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rfid_tag: string
          name: string
          description?: string | null
          inventory_type_id: string
        }
        Update: {
          id?: string
          rfid_tag?: string
          name?: string
          description?: string | null
          inventory_type_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_inventory_type_id_fkey"
            columns: ["inventory_type_id"]
            isOneToOne: false
            referencedRelation: "inventory_types"
            referencedColumns: ["id"]
          }
        ]
      }
      gates: {
        Row: {
          id: string
          name: string
          location_id: string
          gate_type_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location_id: string
          gate_type_id: string
        }
        Update: {
          id?: string
          name?: string
          location_id?: string
          gate_type_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gates_gate_type_id_fkey"
            columns: ["gate_type_id"]
            isOneToOne: false
            referencedRelation: "gate_types"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          customer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          customer_id: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          customer_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_types: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gate_types: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type DefaultSchema = "public"
export type DefaultTables = Tables<DefaultSchema>
export type DefaultTablesInsert = TablesInsert<DefaultSchema>
export type DefaultTablesUpdate = TablesUpdate<DefaultSchema>
export type DefaultEnums = Enums<DefaultSchema>
export type DefaultCompositeTypes = CompositeTypes<DefaultSchema>

export const Constants = {
  public: {
    Enums: {},
  },
}

export type Tables<S extends keyof Database> = Database[S]["Tables"]
export type TablesInsert<S extends keyof Database> = Database[S]["Tables"]
export type TablesUpdate<S extends keyof Database> = Database[S]["Tables"]
export type Enums<S extends keyof Database> = Database[S]["Enums"]
export type CompositeTypes<S extends keyof Database> = Database[S]["CompositeTypes"]

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          email_cc: string
          email_to: string
          goal_externo: number
          goal_interno: number
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          email_cc?: string
          email_to?: string
          goal_externo?: number
          goal_interno?: number
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          email_cc?: string
          email_to?: string
          goal_externo?: number
          goal_interno?: number
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      discharge_records: {
        Row: {
          asn_divergence_details: string | null
          asn_number: string | null
          broken_pallets_count: number
          carrier_name: string | null
          client_request_id: string | null
          created_at: string
          created_by: string
          created_by_name: string | null
          damaged_products_count: number
          date: string
          divergent_quantity_amount: number
          division: string
          dock_number: string | null
          driver_name: string | null
          entry_divergence_details: string | null
          factory_type: string | null
          fallen_pallets_count: number
          has_quantity_divergence: boolean
          id: string
          invalid_ilpn_count: number
          invoice_number: string | null
          invoice_quantity: number
          license_plate: string | null
          missing_asn: boolean
          missing_asn_quantity: number
          missing_ilpn_shipment_count: number
          missing_standard_label: boolean
          notes: string | null
          operation_type: string | null
          shift_id: string
          status: Database["public"]["Enums"]["record_status"]
          time: string
          total_volumes: number | null
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
          validated_at: string | null
          validated_by: string | null
          vehicle_quantity: number
          version: number
        }
        Insert: {
          asn_divergence_details?: string | null
          asn_number?: string | null
          broken_pallets_count?: number
          carrier_name?: string | null
          client_request_id?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          damaged_products_count?: number
          date: string
          divergent_quantity_amount?: number
          division: string
          dock_number?: string | null
          driver_name?: string | null
          entry_divergence_details?: string | null
          factory_type?: string | null
          fallen_pallets_count?: number
          has_quantity_divergence?: boolean
          id?: string
          invalid_ilpn_count?: number
          invoice_number?: string | null
          invoice_quantity?: number
          license_plate?: string | null
          missing_asn?: boolean
          missing_asn_quantity?: number
          missing_ilpn_shipment_count?: number
          missing_standard_label?: boolean
          notes?: string | null
          operation_type?: string | null
          shift_id: string
          status?: Database["public"]["Enums"]["record_status"]
          time: string
          total_volumes?: number | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          validated_at?: string | null
          validated_by?: string | null
          vehicle_quantity?: number
          version?: number
        }
        Update: {
          asn_divergence_details?: string | null
          asn_number?: string | null
          broken_pallets_count?: number
          carrier_name?: string | null
          client_request_id?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          damaged_products_count?: number
          date?: string
          divergent_quantity_amount?: number
          division?: string
          dock_number?: string | null
          driver_name?: string | null
          entry_divergence_details?: string | null
          factory_type?: string | null
          fallen_pallets_count?: number
          has_quantity_divergence?: boolean
          id?: string
          invalid_ilpn_count?: number
          invoice_number?: string | null
          invoice_quantity?: number
          license_plate?: string | null
          missing_asn?: boolean
          missing_asn_quantity?: number
          missing_ilpn_shipment_count?: number
          missing_standard_label?: boolean
          notes?: string | null
          operation_type?: string | null
          shift_id?: string
          status?: Database["public"]["Enums"]["record_status"]
          time?: string
          total_volumes?: number | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          validated_at?: string | null
          validated_by?: string | null
          vehicle_quantity?: number
          version?: number
        }
        Relationships: []
      }
      logbook_entries: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string
          date: string
          id: string
          notes: string
          shift_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          date: string
          id?: string
          notes?: string
          shift_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string
          shift_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          full_name: string
          id: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          full_name: string
          id: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "ADMINISTRADOR" | "OPERACIONAL" | "VISUALIZADOR"
      record_status: "PENDENTE" | "VALIDADO" | "CANCELADO"
      user_status: "ATIVO" | "INATIVO" | "PENDENTE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMINISTRADOR", "OPERACIONAL", "VISUALIZADOR"],
      record_status: ["PENDENTE", "VALIDADO", "CANCELADO"],
      user_status: ["ATIVO", "INATIVO", "PENDENTE"],
    },
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          guest_token: string | null
          id: string
          ip_address: string | null
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_token?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_token?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      archived_order_items: {
        Row: {
          archived_at: string
          archived_order_id: string
          coffee_name: string
          created_at: string
          id: string
          original_order_item_id: string
          price: number
          quantity: number
          special_instructions: string | null
        }
        Insert: {
          archived_at?: string
          archived_order_id: string
          coffee_name: string
          created_at: string
          id?: string
          original_order_item_id: string
          price: number
          quantity?: number
          special_instructions?: string | null
        }
        Update: {
          archived_at?: string
          archived_order_id?: string
          coffee_name?: string
          created_at?: string
          id?: string
          original_order_item_id?: string
          price?: number
          quantity?: number
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archived_order_items_archived_order_id_fkey"
            columns: ["archived_order_id"]
            isOneToOne: false
            referencedRelation: "archived_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_orders: {
        Row: {
          archived_at: string
          created_at: string
          guest_token: string | null
          id: string
          loyalty_discount_amount: number | null
          loyalty_points_earned: number | null
          loyalty_points_used: number | null
          order_code: string | null
          order_status: string
          original_order_id: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string
          created_at: string
          guest_token?: string | null
          id?: string
          loyalty_discount_amount?: number | null
          loyalty_points_earned?: number | null
          loyalty_points_used?: number | null
          order_code?: string | null
          order_status: string
          original_order_id: string
          total_amount?: number
          updated_at: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string
          created_at?: string
          guest_token?: string | null
          id?: string
          loyalty_discount_amount?: number | null
          loyalty_points_earned?: number | null
          loyalty_points_used?: number | null
          order_code?: string | null
          order_status?: string
          original_order_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      coffee_items: {
        Row: {
          brew_time: string
          created_at: string
          description: string
          difficulty: string
          id: string
          name: string
          price: number
          size: string
          temperature: string
          type: string
          updated_at: string
          volume: string
        }
        Insert: {
          brew_time: string
          created_at?: string
          description: string
          difficulty: string
          id?: string
          name: string
          price: number
          size: string
          temperature: string
          type: string
          updated_at?: string
          volume: string
        }
        Update: {
          brew_time?: string
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          name?: string
          price?: number
          size?: string
          temperature?: string
          type?: string
          updated_at?: string
          volume?: string
        }
        Relationships: []
      }
      coffee_recipes: {
        Row: {
          coffee_item_id: string
          created_at: string
          id: string
          ingredients: string[]
          steps: string[]
          tips: string | null
          updated_at: string
        }
        Insert: {
          coffee_item_id: string
          created_at?: string
          id?: string
          ingredients: string[]
          steps: string[]
          tips?: string | null
          updated_at?: string
        }
        Update: {
          coffee_item_id?: string
          created_at?: string
          id?: string
          ingredients?: string[]
          steps?: string[]
          tips?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coffee_recipes_coffee_item_id_fkey"
            columns: ["coffee_item_id"]
            isOneToOne: false
            referencedRelation: "coffee_items"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          end_date: string
          id: string
          period: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          period: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          period?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_expense_budgets_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      expense_profile: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_transaction_logs: {
        Row: {
          action: string
          category_name: string | null
          changed_fields: string[] | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          performed_at: string
          performed_by: string | null
          transaction_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          category_name?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string | null
          transaction_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          category_name?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string | null
          transaction_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      expense_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string | null
          id: string
          receipt_url: string | null
          tags: string[] | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          receipt_url?: string | null
          tags?: string[] | null
          transaction_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          receipt_url?: string | null
          tags?: string[] | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_expense_transactions_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses_tracker: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          added_by: string
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          added_by: string
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          added_by?: string
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      guest_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          coffee_name: string
          created_at: string
          id: string
          order_id: string
          price: number
          quantity: number
          special_instructions: string | null
        }
        Insert: {
          coffee_name: string
          created_at?: string
          id?: string
          order_id: string
          price: number
          quantity?: number
          special_instructions?: string | null
        }
        Update: {
          coffee_name?: string
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          quantity?: number
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          guest_token: string | null
          id: string
          loyalty_discount_amount: number | null
          loyalty_points_earned: number | null
          loyalty_points_used: number | null
          order_code: string | null
          order_status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_token?: string | null
          id?: string
          loyalty_discount_amount?: number | null
          loyalty_points_earned?: number | null
          loyalty_points_used?: number | null
          order_code?: string | null
          order_status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_token?: string | null
          id?: string
          loyalty_discount_amount?: number | null
          loyalty_points_earned?: number | null
          loyalty_points_used?: number | null
          order_code?: string | null
          order_status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_tracker: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      static_user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_activity: string
          session_token: string
          static_user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string
          session_token: string
          static_user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string
          session_token?: string
          static_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "static_user_sessions_static_user_id_fkey"
            columns: ["static_user_id"]
            isOneToOne: false
            referencedRelation: "static_users"
            referencedColumns: ["id"]
          },
        ]
      }
      static_users: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_orders: {
        Args: { days_old?: number }
        Returns: Json
      }
      authenticate_static_user: {
        Args: { username_param: string; password_param: string }
        Returns: {
          user_id: string
          username: string
          session_token: string
        }[]
      }
      calculate_loyalty_points: {
        Args: { amount: number }
        Returns: number
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_guest_tokens: {
        Args: { days_old?: number }
        Returns: Json
      }
      cleanup_old_sessions: {
        Args: { hours_old?: number }
        Returns: Json
      }
      create_guest_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_or_update_session: {
        Args: {
          user_id_param?: string
          guest_token_param?: string
          session_token_param?: string
          user_agent_param?: string
          ip_address_param?: string
        }
        Returns: string
      }
      create_static_user: {
        Args: { username_param: string; password_param: string }
        Returns: string
      }
      generate_order_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_guest_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_session_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_database_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_groups: {
        Args: { target_user_id?: string }
        Returns: {
          group_id: string
          group_name: string
          group_description: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_expense_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      toggle_admin_status: {
        Args: { target_user_id: string; new_admin_status: boolean }
        Returns: boolean
      }
      update_session_activity: {
        Args: { session_token_param: string }
        Returns: boolean
      }
      validate_guest_token: {
        Args: { token_value: string }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

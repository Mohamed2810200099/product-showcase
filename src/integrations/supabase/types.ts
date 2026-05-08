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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          image: string | null
          name: string
          name_en: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          name: string
          name_en?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          name_en?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          can_stack: boolean
          code: string
          created_at: string
          expires_at: string | null
          first_order_only: boolean
          id: string
          max_uses: number | null
          max_uses_per_customer: number | null
          min_order: number
          source: string
          starts_at: string | null
          type: string
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          can_stack?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          first_order_only?: boolean
          id?: string
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_order?: number
          source?: string
          starts_at?: string | null
          type: string
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          can_stack?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          first_order_only?: boolean
          id?: string
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_order?: number
          source?: string
          starts_at?: string | null
          type?: string
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          created_at: string
          current_month_credits: number
          current_month_key: string | null
          display_name: string | null
          id: string
          lifetime_credits_earned: number
          personal_code: string
          phone: string | null
          updated_at: string
          user_id: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          current_month_credits?: number
          current_month_key?: string | null
          display_name?: string | null
          id?: string
          lifetime_credits_earned?: number
          personal_code: string
          phone?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          current_month_credits?: number
          current_month_key?: string | null
          display_name?: string | null
          id?: string
          lifetime_credits_earned?: number
          personal_code?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          city: string
          coupon_code: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          customer_user_id: string | null
          discount: number
          governorate: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string
          referral_code_used: string | null
          referrer_credit_amount: number
          referrer_credit_status: string
          shipping: number
          status: string
          subtotal: number
          total: number
          updated_at: string
          wallet_redeemed: number
          whatsapp_sent: boolean
        }
        Insert: {
          address: string
          city: string
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          customer_user_id?: string | null
          discount?: number
          governorate: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string
          referral_code_used?: string | null
          referrer_credit_amount?: number
          referrer_credit_status?: string
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          wallet_redeemed?: number
          whatsapp_sent?: boolean
        }
        Update: {
          address?: string
          city?: string
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          customer_user_id?: string | null
          discount?: number
          governorate?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string
          referral_code_used?: string | null
          referrer_credit_amount?: number
          referrer_credit_status?: string
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          wallet_redeemed?: number
          whatsapp_sent?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          arabic_title: string | null
          availability_status: string
          brand: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          dm_price_eur: number | null
          how_to_use: string | null
          id: string
          images: Json
          is_active: boolean
          is_featured: boolean
          is_limited: boolean
          key_benefits: string[] | null
          key_ingredients: string[] | null
          name: string
          name_en: string | null
          order_index: number
          price: number
          product_details: string | null
          product_type: string | null
          rating: number
          reviews_count: number
          short_description: string | null
          sku: string | null
          slug: string
          source_url: string | null
          stock: number
          stock_tracking_enabled: boolean
          sub_category: string | null
          suitable_for: string | null
          tags: string[] | null
          updated_at: string
          warnings: string | null
        }
        Insert: {
          arabic_title?: string | null
          availability_status?: string
          brand?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dm_price_eur?: number | null
          how_to_use?: string | null
          id?: string
          images?: Json
          is_active?: boolean
          is_featured?: boolean
          is_limited?: boolean
          key_benefits?: string[] | null
          key_ingredients?: string[] | null
          name: string
          name_en?: string | null
          order_index?: number
          price: number
          product_details?: string | null
          product_type?: string | null
          rating?: number
          reviews_count?: number
          short_description?: string | null
          sku?: string | null
          slug: string
          source_url?: string | null
          stock?: number
          stock_tracking_enabled?: boolean
          sub_category?: string | null
          suitable_for?: string | null
          tags?: string[] | null
          updated_at?: string
          warnings?: string | null
        }
        Update: {
          arabic_title?: string | null
          availability_status?: string
          brand?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dm_price_eur?: number | null
          how_to_use?: string | null
          id?: string
          images?: Json
          is_active?: boolean
          is_featured?: boolean
          is_limited?: boolean
          key_benefits?: string[] | null
          key_ingredients?: string[] | null
          name?: string
          name_en?: string | null
          order_index?: number
          price?: number
          product_details?: string | null
          product_type?: string | null
          rating?: number
          reviews_count?: number
          short_description?: string | null
          sku?: string | null
          slug?: string
          source_url?: string | null
          stock?: number
          stock_tracking_enabled?: boolean
          sub_category?: string | null
          suitable_for?: string | null
          tags?: string[] | null
          updated_at?: string
          warnings?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_uses: {
        Row: {
          code: string
          created_at: string
          discount_amount: number
          friend_phone: string | null
          friend_user_id: string | null
          id: string
          order_id: string | null
          referrer_user_id: string | null
          reward_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount?: number
          friend_phone?: string | null
          friend_user_id?: string | null
          id?: string
          order_id?: string | null
          referrer_user_id?: string | null
          reward_amount?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number
          friend_phone?: string | null
          friend_user_id?: string | null
          id?: string
          order_id?: string | null
          referrer_user_id?: string | null
          reward_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          friend_discount_pct: number
          id: string
          notes: string | null
          referrer_contact: string
          referrer_name: string
          referrer_reward_pct: number
          status: string
          updated_at: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          friend_discount_pct?: number
          id?: string
          notes?: string | null
          referrer_contact: string
          referrer_name: string
          referrer_reward_pct?: number
          status?: string
          updated_at?: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          friend_discount_pct?: number
          id?: string
          notes?: string | null
          referrer_contact?: string
          referrer_name?: string
          referrer_reward_pct?: number
          status?: string
          updated_at?: string
          uses_count?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          customer_name: string
          id?: string
          product_id: string
          rating: number
        }
        Update: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image: string | null
          name: string
          rating: number
          role: string | null
          sort_order: number
          text: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image?: string | null
          name: string
          rating?: number
          role?: string | null
          sort_order?: number
          text: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          rating?: number
          role?: string | null
          sort_order?: number
          text?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          note: string | null
          order_id: string | null
          related_order_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          order_id?: string | null
          related_order_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          order_id?: string | null
          related_order_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      coupons_public: {
        Row: {
          active: boolean | null
          code: string | null
          id: string | null
          min_order: number | null
          type: string | null
          value: number | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          id?: string | null
          min_order?: number | null
          type?: string | null
          value?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          id?: string | null
          min_order?: number | null
          type?: string | null
          value?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrement_product_stock: { Args: { _items: Json }; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_personal_code: { Args: { _seed: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_used_coupon: {
        Args: { _code: string; _phone: string }
        Returns: boolean
      }
      lookup_referral_owner: { Args: { _code: string }; Returns: string }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "user" | "moderator"
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
    Enums: {
      app_role: ["admin", "customer", "user", "moderator"],
    },
  },
} as const

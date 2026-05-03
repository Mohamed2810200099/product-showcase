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
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order: number
          type: string
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number
          type: string
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number
          type?: string
          used_count?: number
          value?: number
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
          discount: number
          governorate: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string
          shipping: number
          status: string
          subtotal: number
          total: number
          updated_at: string
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
          discount?: number
          governorate: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
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
          discount?: number
          governorate?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          whatsapp_sent?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          arabic_title: string | null
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
          rating: number
          reviews_count: number
          short_description: string | null
          sku: string | null
          slug: string
          source_url: string | null
          stock: number
          sub_category: string | null
          suitable_for: string | null
          tags: string[] | null
          updated_at: string
          warnings: string | null
        }
        Insert: {
          arabic_title?: string | null
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
          rating?: number
          reviews_count?: number
          short_description?: string | null
          sku?: string | null
          slug: string
          source_url?: string | null
          stock?: number
          sub_category?: string | null
          suitable_for?: string | null
          tags?: string[] | null
          updated_at?: string
          warnings?: string | null
        }
        Update: {
          arabic_title?: string | null
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
          rating?: number
          reviews_count?: number
          short_description?: string | null
          sku?: string | null
          slug?: string
          source_url?: string | null
          stock?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const

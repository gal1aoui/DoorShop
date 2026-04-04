export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "received"
  | "confirmed"
  | "constructing"
  | "delivering"
  | "delivered";

export interface Database {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          created_at?: string;
        };
      };
      door_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      door_products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          base_price: number;
          base_height_cm: number;
          base_width_cm: number;
          price_per_extra_cm_height: number;
          price_per_extra_cm_width: number;
          thumbnail_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string | null;
          base_price: number;
          base_height_cm?: number;
          base_width_cm?: number;
          price_per_extra_cm_height?: number;
          price_per_extra_cm_width?: number;
          thumbnail_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          base_price?: number;
          base_height_cm?: number;
          base_width_cm?: number;
          price_per_extra_cm_height?: number;
          price_per_extra_cm_width?: number;
          thumbnail_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      door_product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          public_url: string;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          public_url: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          storage_path?: string;
          public_url?: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      door_delivery_tiers: {
        Row: {
          id: string;
          product_id: string;
          min_quantity: number;
          max_quantity: number | null;
          delivery_days: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          min_quantity: number;
          max_quantity?: number | null;
          delivery_days: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          min_quantity?: number;
          max_quantity?: number | null;
          delivery_days?: number;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          tracking_token: string | null;
          full_name: string;
          phone_number: string;
          phone_number_normalized: string;
          delivery_location: string;
          customer_note: string | null;
          wanted_date: string;
          status: OrderStatus;
          status_updated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tracking_token?: string | null;
          full_name: string;
          phone_number: string;
          phone_number_normalized?: string;
          delivery_location: string;
          customer_note?: string | null;
          wanted_date: string;
          status?: OrderStatus;
          status_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tracking_token?: string | null;
          full_name?: string;
          phone_number?: string;
          phone_number_normalized?: string;
          delivery_location?: string;
          customer_note?: string | null;
          wanted_date?: string;
          status?: OrderStatus;
          status_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          height_cm: number;
          width_cm: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          height_cm: number;
          width_cm: number;
          unit_price?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          height_cm?: number;
          width_cm?: number;
          unit_price?: number;
          created_at?: string;
        };
      };
      order_status_events: {
        Row: {
          id: number;
          order_id: string;
          status: OrderStatus;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: string;
          status: OrderStatus;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          order_id?: string;
          status?: OrderStatus;
          changed_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order_with_items: {
        Args: {
          p_full_name: string;
          p_phone_number: string;
          p_delivery_location: string;
          p_customer_note: string | null;
          p_wanted_date: string;
          p_items: Json;
        };
        Returns: {
          order_id: string;
          tracking_token: string;
        }[];
      };
      get_order_tracking: {
        Args: {
          p_tracking_token: string;
        };
        Returns: {
          order_id: string;
          tracking_token: string;
          full_name: string;
          delivery_location: string;
          customer_note: string | null;
          wanted_date: string;
          status: OrderStatus;
          status_updated_at: string;
          created_at: string;
          items: Json;
          history: Json;
        }[];
      };
    };
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

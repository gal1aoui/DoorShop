import type { Json, OrderStatus } from "./database";

export interface DoorCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export interface DoorDeliveryTier {
  id: string;
  product_id: string;
  min_quantity: number;
  max_quantity: number | null;
  delivery_days: number;
}

export interface DoorProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface DoorProduct {
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
}

export interface CatalogProduct extends DoorProduct {
  door_categories: DoorCategory | null;
  door_delivery_tiers: DoorDeliveryTier[];
  door_product_images: DoorProductImage[];
}

export interface OrderLineInput {
  product_id: string;
  quantity: number;
  height_cm: number;
  width_cm: number;
}

export interface PublicOrderTrackingItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  height_cm: number;
  width_cm: number;
  unit_price: number;
  subtotal: number;
}

export interface PublicOrderTrackingHistory {
  status: OrderStatus;
  created_at: string;
}

export interface PublicOrderTrackingResponse {
  order_id: string;
  tracking_token: string;
  full_name: string;
  delivery_location: string;
  customer_note: string | null;
  rejection_reason: string | null;
  wanted_date: string;
  status: OrderStatus;
  status_updated_at: string;
  created_at: string;
  items: Json;
  history: Json;
}

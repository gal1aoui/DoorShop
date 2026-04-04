import type { OrderStatus } from "./database";
import type { CatalogProduct, DoorCategory } from "./domain";

export interface AdminOrderItem {
  id: string;
  quantity: number;
  height_cm: number;
  width_cm: number;
  unit_price: number;
  subtotal: number;
  door_products: {
    name: string;
  } | null;
}

export interface AdminOrder {
  id: string;
  tracking_token: string | null;
  full_name: string;
  phone_number: string;
  delivery_location: string;
  customer_note: string | null;
  wanted_date: string;
  status: OrderStatus;
  status_updated_at: string;
  created_at: string;
  order_items: AdminOrderItem[];
}

export interface AdminOrdersFilters {
  searchTerm?: string;
  statusFilter?: "all" | OrderStatus;
}

export interface AnalyticsOrderItem {
  quantity: number;
  subtotal: number;
  door_products: { name: string } | null;
}

export interface AnalyticsOrder {
  status: OrderStatus;
  created_at: string;
  order_items: AnalyticsOrderItem[];
}

export interface ProductAggregate {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
}

export interface CreateDeliveryTierInput {
  min_quantity: number;
  max_quantity: number | null;
  delivery_days: number;
}

export interface CreateProductInput {
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  base_price: number;
  base_height_cm: number;
  base_width_cm: number;
  price_per_extra_cm_height: number;
  price_per_extra_cm_width: number;
  thumbnail_url?: string | null;
  delivery_tiers: CreateDeliveryTierInput[];
}

export interface AdminCatalogData {
  categories: DoorCategory[];
  products: CatalogProduct[];
}

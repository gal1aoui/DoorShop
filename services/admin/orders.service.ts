import { getSupabaseClient } from "@/services/supabase/client";
import type { AdminOrder, AdminOrdersFilters } from "@/types/admin";
import type { OrderStatus } from "@/types/database";
import { fail, ok, type ServiceResult } from "@/types/service";

function normalizeAdminOrder(raw: unknown): AdminOrder {
  const payload = raw as Record<string, unknown>;
  const items = Array.isArray(payload.order_items)
    ? (payload.order_items as Array<Record<string, unknown>>)
    : [];

  return {
    id: String(payload.id ?? ""),
    tracking_token: (payload.tracking_token as string | null) ?? null,
    full_name: String(payload.full_name ?? ""),
    phone_number: String(payload.phone_number ?? ""),
    delivery_location: String(payload.delivery_location ?? ""),
    customer_note: (payload.customer_note as string | null) ?? null,
    wanted_date: String(payload.wanted_date ?? ""),
    status: payload.status as OrderStatus,
    status_updated_at: String(payload.status_updated_at ?? ""),
    created_at: String(payload.created_at ?? ""),
    order_items: items.map((item) => {
      const relation = item.door_products;
      const product = Array.isArray(relation)
        ? ((relation[0] ?? null) as Record<string, unknown> | null)
        : ((relation ?? null) as Record<string, unknown> | null);

      return {
        id: String(item.id ?? ""),
        quantity: Number(item.quantity ?? 0),
        height_cm: Number(item.height_cm ?? 0),
        width_cm: Number(item.width_cm ?? 0),
        unit_price: Number(item.unit_price ?? 0),
        subtotal: Number(item.subtotal ?? 0),
        door_products: product?.name ? { name: String(product.name) } : null,
      };
    }),
  };
}

export async function fetchAdminOrders(
  filters: AdminOrdersFilters,
): Promise<ServiceResult<AdminOrder[]>> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("orders")
    .select(
      `
        id,
        tracking_token,
        full_name,
        phone_number,
        delivery_location,
        customer_note,
        wanted_date,
        status,
        status_updated_at,
        created_at,
        order_items (
          id,
          quantity,
          height_cm,
          width_cm,
          unit_price,
          subtotal,
          door_products ( name )
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (filters.statusFilter && filters.statusFilter !== "all") {
    query = query.eq("status", filters.statusFilter);
  }

  const trimmedSearch = filters.searchTerm?.trim();
  if (trimmedSearch) {
    const escaped = trimmedSearch.replaceAll(",", " ");
    query = query.or(
      `full_name.ilike.%${escaped}%,phone_number.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return fail(error.message);
  }

  return ok(((data ?? []) as unknown[]).map(normalizeAdminOrder));
}

export async function updateAdminOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<ServiceResult<null>> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);

  if (error) {
    return fail(error.message);
  }

  return ok(null);
}

export function subscribeToAdminOrders(onChange: () => void): () => void {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel("admin-orders-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

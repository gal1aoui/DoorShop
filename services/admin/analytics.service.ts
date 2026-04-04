import { getSupabaseClient } from "@/services/supabase/client";
import type { AnalyticsOrder } from "@/types/admin";
import { fail, ok, type ServiceResult } from "@/types/service";

function normalizeAnalyticsOrder(raw: unknown): AnalyticsOrder {
  const payload = raw as Record<string, unknown>;
  const items = Array.isArray(payload.order_items)
    ? (payload.order_items as Array<Record<string, unknown>>)
    : [];

  return {
    status: payload.status as AnalyticsOrder["status"],
    created_at: String(payload.created_at ?? ""),
    order_items: items.map((item) => {
      const relation = item.door_products;
      const product = Array.isArray(relation)
        ? ((relation[0] ?? null) as Record<string, unknown> | null)
        : ((relation ?? null) as Record<string, unknown> | null);

      return {
        quantity: Number(item.quantity ?? 0),
        subtotal: Number(item.subtotal ?? 0),
        door_products: product?.name ? { name: String(product.name) } : null,
      };
    }),
  };
}

export async function fetchAnalyticsOrders(): Promise<
  ServiceResult<AnalyticsOrder[]>
> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        status,
        created_at,
        order_items (
          quantity,
          subtotal,
          door_products ( name )
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return fail(error.message);
  }

  return ok(((data ?? []) as unknown[]).map(normalizeAnalyticsOrder));
}

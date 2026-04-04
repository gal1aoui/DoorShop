import { getSupabaseClient } from "@/services/supabase/client";
import type { CatalogProduct, DoorCategory } from "@/types/domain";
import { fail, ok, type ServiceResult } from "@/types/service";

const catalogProductSelect = `
  id,
  category_id,
  name,
  slug,
  description,
  base_price,
  base_height_cm,
  base_width_cm,
  price_per_extra_cm_height,
  price_per_extra_cm_width,
  thumbnail_url,
  is_active,
  door_categories (
    id,
    name,
    slug,
    description,
    is_active
  ),
  door_delivery_tiers (
    id,
    product_id,
    min_quantity,
    max_quantity,
    delivery_days
  ),
  door_product_images (
    id,
    product_id,
    storage_path,
    public_url,
    alt_text,
    sort_order
  )
`;

function withSortedImages(products: CatalogProduct[]): CatalogProduct[] {
  return products.map((product) => ({
    ...product,
    door_product_images: [...(product.door_product_images ?? [])].sort(
      (left, right) => left.sort_order - right.sort_order,
    ),
  }));
}

function normalizeCatalogProduct(raw: unknown): CatalogProduct {
  const payload = raw as Record<string, unknown>;
  const categoryRelation = payload.door_categories;
  const category = Array.isArray(categoryRelation)
    ? ((categoryRelation[0] ?? null) as Record<string, unknown> | null)
    : ((categoryRelation ?? null) as Record<string, unknown> | null);
  const tiers = Array.isArray(payload.door_delivery_tiers)
    ? (payload.door_delivery_tiers as Array<Record<string, unknown>>)
    : [];
  const images = Array.isArray(payload.door_product_images)
    ? (payload.door_product_images as Array<Record<string, unknown>>)
    : [];

  return {
    id: String(payload.id ?? ""),
    category_id: String(payload.category_id ?? ""),
    name: String(payload.name ?? ""),
    slug: String(payload.slug ?? ""),
    description: (payload.description as string | null) ?? null,
    base_price: Number(payload.base_price ?? 0),
    base_height_cm: Number(payload.base_height_cm ?? 0),
    base_width_cm: Number(payload.base_width_cm ?? 0),
    price_per_extra_cm_height: Number(payload.price_per_extra_cm_height ?? 0),
    price_per_extra_cm_width: Number(payload.price_per_extra_cm_width ?? 0),
    thumbnail_url: (payload.thumbnail_url as string | null) ?? null,
    is_active: Boolean(payload.is_active),
    door_categories: category
      ? {
          id: String(category.id ?? ""),
          name: String(category.name ?? ""),
          slug: String(category.slug ?? ""),
          description: (category.description as string | null) ?? null,
          is_active: Boolean(category.is_active),
        }
      : null,
    door_delivery_tiers: tiers.map((tier) => ({
      id: String(tier.id ?? ""),
      product_id: String(tier.product_id ?? ""),
      min_quantity: Number(tier.min_quantity ?? 0),
      max_quantity:
        tier.max_quantity === null ? null : Number(tier.max_quantity),
      delivery_days: Number(tier.delivery_days ?? 0),
    })),
    door_product_images: images.map((image) => ({
      id: String(image.id ?? ""),
      product_id: String(image.product_id ?? ""),
      storage_path: String(image.storage_path ?? ""),
      public_url: String(image.public_url ?? ""),
      alt_text: (image.alt_text as string | null) ?? null,
      sort_order: Number(image.sort_order ?? 0),
    })),
  };
}

export async function fetchCatalogData(): Promise<
  ServiceResult<{
    categories: DoorCategory[];
    products: CatalogProduct[];
  }>
> {
  const supabase = getSupabaseClient();
  const [categoryResult, productsResult] = await Promise.all([
    supabase
      .from("door_categories")
      .select("id, name, slug, description, is_active")
      .order("name", { ascending: true }),
    supabase
      .from("door_products")
      .select(catalogProductSelect)
      .order("created_at", { ascending: false }),
  ]);

  if (categoryResult.error) {
    return fail(categoryResult.error.message);
  }

  if (productsResult.error) {
    return fail(productsResult.error.message);
  }

  return ok({
    categories: (categoryResult.data ?? []) as DoorCategory[],
    products: withSortedImages(
      ((productsResult.data ?? []) as unknown[]).map(normalizeCatalogProduct),
    ),
  });
}

export async function fetchCatalogProductById(
  productId: string,
): Promise<ServiceResult<CatalogProduct>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("door_products")
    .select(catalogProductSelect)
    .eq("id", productId)
    .single();

  if (error) {
    return fail(error.message);
  }

  const product = normalizeCatalogProduct(data);
  return ok({
    ...product,
    door_product_images: [...(product.door_product_images ?? [])].sort(
      (left, right) => left.sort_order - right.sort_order,
    ),
  });
}

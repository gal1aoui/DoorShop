import { getSupabaseClient } from "@/services/supabase/client";
import type {
  AdminCatalogData,
  CreateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/admin";
import type {
  CatalogProduct,
  DoorCategory,
  DoorProductImage,
} from "@/types/domain";
import { fail, ok, type ServiceResult } from "@/types/service";

const PRODUCT_IMAGES_BUCKET = "door-product-images";

const productSelect = `
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

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

function isPositiveFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function validateDeliveryTiers(
  tiers: Array<{
    min_quantity: number;
    max_quantity: number | null;
    delivery_days: number;
  }>,
): string | null {
  for (const tier of tiers) {
    if (
      !isPositiveFiniteNumber(tier.min_quantity) ||
      !isPositiveFiniteNumber(tier.delivery_days)
    ) {
      return "ERR_TIER_MIN_OR_DAYS_INVALID: Delivery tiers need positive min quantity and delivery days.";
    }

    if (tier.max_quantity !== null) {
      if (!isPositiveFiniteNumber(tier.max_quantity)) {
        return "ERR_TIER_MAX_INVALID: Delivery tier max quantity must be positive when provided.";
      }

      if (tier.max_quantity < tier.min_quantity) {
        return "ERR_TIER_RANGE_INVALID: Delivery tier max quantity must be greater than or equal to min quantity.";
      }
    }
  }

  return null;
}

function validateProductInput(
  input: Pick<
    CreateProductInput,
    | "category_id"
    | "name"
    | "slug"
    | "base_price"
    | "base_height_cm"
    | "base_width_cm"
    | "price_per_extra_cm_height"
    | "price_per_extra_cm_width"
    | "delivery_tiers"
  >,
): string | null {
  if (!input.category_id.trim()) {
    return "ERR_PRODUCT_CATEGORY_REQUIRED: Category is required.";
  }

  if (!input.name.trim()) {
    return "ERR_PRODUCT_NAME_REQUIRED: Product name is required.";
  }

  if (!input.slug.trim()) {
    return "ERR_PRODUCT_SLUG_REQUIRED: Product slug is required.";
  }

  if (!isNonNegativeFiniteNumber(input.base_price)) {
    return "ERR_PRODUCT_BASE_PRICE_INVALID: Base price must be a valid non-negative number.";
  }

  if (!isPositiveFiniteNumber(input.base_height_cm)) {
    return "ERR_PRODUCT_BASE_HEIGHT_INVALID: Base height must be a valid positive number.";
  }

  if (!isPositiveFiniteNumber(input.base_width_cm)) {
    return "ERR_PRODUCT_BASE_WIDTH_INVALID: Base width must be a valid positive number.";
  }

  if (!isNonNegativeFiniteNumber(input.price_per_extra_cm_height)) {
    return "ERR_PRODUCT_HEIGHT_PRICE_INVALID: Height extra price must be a valid non-negative number.";
  }

  if (!isNonNegativeFiniteNumber(input.price_per_extra_cm_width)) {
    return "ERR_PRODUCT_WIDTH_PRICE_INVALID: Width extra price must be a valid non-negative number.";
  }

  return validateDeliveryTiers(input.delivery_tiers);
}

export async function fetchAdminCatalogData(): Promise<
  ServiceResult<AdminCatalogData>
> {
  const supabase = getSupabaseClient();
  const [categoryResult, productResult] = await Promise.all([
    supabase
      .from("door_categories")
      .select("id, name, slug, description, is_active")
      .order("name", { ascending: true }),
    supabase
      .from("door_products")
      .select(productSelect)
      .order("created_at", { ascending: false }),
  ]);

  if (categoryResult.error) {
    return fail(categoryResult.error.message);
  }

  if (productResult.error) {
    return fail(productResult.error.message);
  }

  return ok({
    categories: (categoryResult.data ?? []) as DoorCategory[],
    products: withSortedImages(
      ((productResult.data ?? []) as unknown[]).map(normalizeCatalogProduct),
    ),
  });
}

export async function createDoorCategory(
  input: CreateCategoryInput,
): Promise<ServiceResult<{ id: string }>> {
  const normalizedName = input.name.trim();
  const normalizedSlug = input.slug.trim();

  if (!normalizedName) {
    return fail("ERR_CATEGORY_NAME_REQUIRED: Category name is required.");
  }

  if (!normalizedSlug) {
    return fail("ERR_CATEGORY_SLUG_REQUIRED: Category slug is required.");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("door_categories")
    .insert({
      name: normalizedName,
      slug: normalizedSlug,
      description: input.description?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return fail(error?.message ?? "Failed to create category.");
  }

  return ok({ id: data.id });
}

export async function createDoorProductWithTiers(
  input: CreateProductInput,
): Promise<ServiceResult<{ id: string }>> {
  const validationError = validateProductInput(input);
  if (validationError) {
    return fail(validationError);
  }

  const supabase = getSupabaseClient();
  const { data: insertedProduct, error: productError } = await supabase
    .from("door_products")
    .insert({
      category_id: input.category_id.trim(),
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() || null,
      base_price: input.base_price,
      base_height_cm: input.base_height_cm,
      base_width_cm: input.base_width_cm,
      price_per_extra_cm_height: input.price_per_extra_cm_height,
      price_per_extra_cm_width: input.price_per_extra_cm_width,
      thumbnail_url: input.thumbnail_url ?? null,
    })
    .select("id")
    .single();

  if (productError || !insertedProduct) {
    return fail(productError?.message ?? "Failed to create product.");
  }

  const normalizedTiers = input.delivery_tiers;

  if (normalizedTiers.length > 0) {
    const { error: tierError } = await supabase
      .from("door_delivery_tiers")
      .insert(
        normalizedTiers.map((tier) => ({
          product_id: insertedProduct.id,
          min_quantity: tier.min_quantity,
          max_quantity: tier.max_quantity,
          delivery_days: tier.delivery_days,
        })),
      );

    if (tierError) {
      return fail(
        `Product created but delivery tiers failed: ${tierError.message}`,
      );
    }
  }

  return ok({ id: insertedProduct.id });
}

export async function updateDoorProductWithTiers(
  input: UpdateProductInput,
): Promise<ServiceResult<void>> {
  const normalizedInput: CreateProductInput = {
    category_id: input.category_id,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    base_price: input.base_price,
    base_height_cm: input.base_height_cm,
    base_width_cm: input.base_width_cm,
    price_per_extra_cm_height: input.price_per_extra_cm_height,
    price_per_extra_cm_width: input.price_per_extra_cm_width,
    delivery_tiers: input.delivery_tiers,
    thumbnail_url: null,
  };
  const validationError = validateProductInput(normalizedInput);
  if (validationError) {
    return fail(validationError);
  }

  const supabase = getSupabaseClient();

  const { error: productError } = await supabase
    .from("door_products")
    .update({
      category_id: input.category_id.trim(),
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() || null,
      base_price: input.base_price,
      base_height_cm: input.base_height_cm,
      base_width_cm: input.base_width_cm,
      price_per_extra_cm_height: input.price_per_extra_cm_height,
      price_per_extra_cm_width: input.price_per_extra_cm_width,
    })
    .eq("id", input.id);

  if (productError) {
    return fail(productError.message);
  }

  const { error: deleteTiersError } = await supabase
    .from("door_delivery_tiers")
    .delete()
    .eq("product_id", input.id);

  if (deleteTiersError) {
    return fail(deleteTiersError.message);
  }

  const normalizedTiers = input.delivery_tiers;

  if (normalizedTiers.length > 0) {
    const { error: tierError } = await supabase
      .from("door_delivery_tiers")
      .insert(
        normalizedTiers.map((tier) => ({
          product_id: input.id,
          min_quantity: tier.min_quantity,
          max_quantity: tier.max_quantity,
          delivery_days: tier.delivery_days,
        })),
      );

    if (tierError) {
      return fail(tierError.message);
    }
  }

  return ok(undefined);
}

export async function deleteDoorProduct(
  productId: string,
): Promise<ServiceResult<void>> {
  const normalizedProductId = productId.trim();
  if (!normalizedProductId) {
    return fail("Product id is required.");
  }

  const supabase = getSupabaseClient();

  const { data: imageRows, error: imageSelectError } = await supabase
    .from("door_product_images")
    .select("storage_path")
    .eq("product_id", normalizedProductId);

  if (imageSelectError) {
    return fail(imageSelectError.message);
  }

  const paths = (imageRows ?? [])
    .map((row) => row.storage_path as string)
    .filter(Boolean);

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(paths);

    if (storageError) {
      return fail(
        `Could not remove images from storage: ${storageError.message}`,
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("door_products")
    .delete()
    .eq("id", normalizedProductId);

  if (deleteError) {
    return fail(deleteError.message);
  }

  return ok(undefined);
}

export async function uploadDoorProductImages(params: {
  productId: string;
  productSlug: string;
  files: File[];
}): Promise<ServiceResult<DoorProductImage[]>> {
  const normalizedProductId = params.productId.trim();
  const normalizedProductSlug = params.productSlug.trim();

  if (!normalizedProductId || !normalizedProductSlug) {
    return fail("Product id and slug are required for image upload.");
  }

  if (!params.files.length) {
    return ok([]);
  }

  if (params.files.some((file) => !file.type.startsWith("image/"))) {
    return fail("Only image files are allowed.");
  }

  const supabase = getSupabaseClient();
  const uploadedRows: Array<{
    product_id: string;
    storage_path: string;
    public_url: string;
    alt_text: string | null;
    sort_order: number;
  }> = [];

  for (let index = 0; index < params.files.length; index += 1) {
    const file = params.files[index];
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const randomSuffix = crypto.randomUUID().slice(0, 8);
    const fileName = safeFileName(
      `${Date.now()}-${index + 1}-${randomSuffix}.${extension}`,
    );
    const storagePath = `${normalizedProductSlug}/${normalizedProductId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      if (uploadedRows.length) {
        await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .remove(uploadedRows.map((item) => item.storage_path));
      }

      return fail(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(storagePath);

    uploadedRows.push({
      product_id: normalizedProductId,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      alt_text: null,
      sort_order: index,
    });
  }

  const { data: insertedImages, error: insertError } = await supabase
    .from("door_product_images")
    .insert(uploadedRows)
    .select(
      "id, product_id, storage_path, public_url, alt_text, sort_order, created_at, updated_at",
    );

  if (insertError) {
    await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(uploadedRows.map((item) => item.storage_path));

    return fail(insertError.message);
  }

  const firstImageUrl = uploadedRows[0]?.public_url;
  if (firstImageUrl) {
    await supabase
      .from("door_products")
      .update({ thumbnail_url: firstImageUrl })
      .eq("id", normalizedProductId);
  }

  return ok((insertedImages ?? []) as DoorProductImage[]);
}

import type { DoorDeliveryTier, DoorProduct } from "@/types/domain";

export function calculateUnitPriceForDimensions(
  product: Pick<
    DoorProduct,
    | "base_price"
    | "base_height_cm"
    | "base_width_cm"
    | "price_per_extra_cm_height"
    | "price_per_extra_cm_width"
  >,
  heightCm: number,
  widthCm: number,
): number {
  const extraHeight = Math.max(heightCm - product.base_height_cm, 0);
  const extraWidth = Math.max(widthCm - product.base_width_cm, 0);

  return (
    product.base_price +
    extraHeight * product.price_per_extra_cm_height +
    extraWidth * product.price_per_extra_cm_width
  );
}

export function getDeliveryDaysForQuantity(
  tiers: DoorDeliveryTier[],
  quantity: number,
): number | null {
  if (!tiers.length) {
    return null;
  }

  const sorted = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);
  const matched = sorted.find((tier) => {
    if (tier.max_quantity === null) {
      return quantity >= tier.min_quantity;
    }
    return quantity >= tier.min_quantity && quantity <= tier.max_quantity;
  });

  if (matched) {
    return matched.delivery_days;
  }

  return sorted[sorted.length - 1]?.delivery_days ?? null;
}

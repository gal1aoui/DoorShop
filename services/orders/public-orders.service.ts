import { getSupabaseClient } from "@/services/supabase/client";
import type {
  OrderLineInput,
  PublicOrderTrackingResponse,
} from "@/types/domain";
import { fail, ok, type ServiceResult } from "@/types/service";

const TRACKING_TOKEN_PATTERN = /^[a-z0-9_-]{6,128}$/i;

function isPositiveFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function normalizeText(value: string): string {
  return value.trim();
}

function isValidFutureOrTodayDate(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed >= today;
}

export interface CreatePublicOrderInput {
  fullName: string;
  phoneNumber: string;
  deliveryLocation: string;
  customerNote: string | null;
  wantedDate: string;
  items: OrderLineInput[];
}

export async function createPublicOrder(
  input: CreatePublicOrderInput,
): Promise<ServiceResult<{ orderId: string; trackingToken: string }>> {
  const fullName = normalizeText(input.fullName);
  const phoneNumber = normalizeText(input.phoneNumber);
  const deliveryLocation = normalizeText(input.deliveryLocation);
  const customerNote = normalizeText(input.customerNote ?? "") || null;

  if (!fullName || !phoneNumber || !deliveryLocation) {
    return fail(
      "ERR_ORDER_CUSTOMER_REQUIRED: Provide customer name, phone, and delivery location.",
    );
  }

  if (!isValidFutureOrTodayDate(input.wantedDate)) {
    return fail(
      "ERR_ORDER_WANTED_DATE_INVALID: Wanted date must be a valid date from today onward.",
    );
  }

  if (!input.items.length) {
    return fail(
      "ERR_ORDER_ITEMS_REQUIRED: At least one valid order item is required.",
    );
  }

  const normalizedItems: OrderLineInput[] = [];
  for (const item of input.items) {
    const productId = normalizeText(item.product_id);
    if (
      !productId ||
      !isPositiveFiniteNumber(item.quantity) ||
      !Number.isInteger(item.quantity) ||
      !isPositiveFiniteNumber(item.height_cm) ||
      !isPositiveFiniteNumber(item.width_cm)
    ) {
      return fail(
        "ERR_ORDER_ITEMS_INVALID: Item quantity and dimensions must be positive values.",
      );
    }

    normalizedItems.push({
      product_id: productId,
      quantity: item.quantity,
      height_cm: item.height_cm,
      width_cm: item.width_cm,
    });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("create_order_with_items", {
    p_full_name: fullName,
    p_phone_number: phoneNumber,
    p_delivery_location: deliveryLocation,
    p_customer_note: customerNote,
    p_wanted_date: input.wantedDate.trim(),
    p_items: normalizedItems,
  });

  if (error) {
    return fail(error.message);
  }

  const firstRow = data?.[0];
  if (!firstRow?.tracking_token || !firstRow?.order_id) {
    return fail(
      "ERR_ORDER_RESPONSE_INCOMPLETE: Order was created but response is incomplete.",
    );
  }

  return ok({
    orderId: firstRow.order_id,
    trackingToken: firstRow.tracking_token,
  });
}

export async function fetchOrderTrackingByToken(
  trackingToken: string,
): Promise<ServiceResult<PublicOrderTrackingResponse>> {
  const normalizedToken = trackingToken.trim().toLowerCase();
  if (!TRACKING_TOKEN_PATTERN.test(normalizedToken)) {
    return fail("ERR_TRACK_TOKEN_INVALID: Tracking token format is invalid.");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_order_tracking", {
    p_tracking_token: normalizedToken,
  });

  if (error) {
    return fail(error.message);
  }

  if (!data?.length) {
    return fail("ERR_TRACK_ORDER_NOT_FOUND: No order found for this token.");
  }

  const firstRow = data[0] as Partial<PublicOrderTrackingResponse> | undefined;
  if (!firstRow?.order_id || !firstRow?.tracking_token) {
    return fail(
      "ERR_TRACK_RESPONSE_INCOMPLETE: Tracking response is incomplete.",
    );
  }

  return ok(firstRow as PublicOrderTrackingResponse);
}

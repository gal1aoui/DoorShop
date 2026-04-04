import { getSupabaseClient } from "@/services/supabase/client";
import type {
  OrderLineInput,
  PublicOrderTrackingResponse,
} from "@/types/domain";
import { fail, ok, type ServiceResult } from "@/types/service";

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
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("create_order_with_items", {
    p_full_name: input.fullName,
    p_phone_number: input.phoneNumber,
    p_delivery_location: input.deliveryLocation,
    p_customer_note: input.customerNote,
    p_wanted_date: input.wantedDate,
    p_items: input.items,
  });

  if (error) {
    return fail(error.message);
  }

  const firstRow = data?.[0];
  if (!firstRow?.tracking_token || !firstRow?.order_id) {
    return fail("Order was created but response is incomplete.");
  }

  return ok({
    orderId: firstRow.order_id,
    trackingToken: firstRow.tracking_token,
  });
}

export async function fetchOrderTrackingByToken(
  trackingToken: string,
): Promise<ServiceResult<PublicOrderTrackingResponse>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_order_tracking", {
    p_tracking_token: trackingToken,
  });

  if (error) {
    return fail(error.message);
  }

  if (!data?.length) {
    return fail("No order found for this tracking token.");
  }

  return ok(data[0] as PublicOrderTrackingResponse);
}

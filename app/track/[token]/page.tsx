"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import OrderStatusChip from "@/components/order-status-chip";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import { fetchOrderTrackingByToken } from "@/services/orders/public-orders.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type {
  PublicOrderTrackingHistory,
  PublicOrderTrackingItem,
  PublicOrderTrackingResponse,
} from "@/types/domain";
import { formatDate, formatMoney } from "@/utils/formatters";
import { ORDER_STATUS_LABELS } from "@/utils/order-status";

function parseItems(value: unknown): PublicOrderTrackingItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as PublicOrderTrackingItem[];
}

function parseHistory(value: unknown): PublicOrderTrackingHistory[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as PublicOrderTrackingHistory[];
}

export default function TrackOrderByTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [order, setOrder] = useState<PublicOrderTrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      if (!isSupabaseConfigured()) {
        if (!mounted) return;
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const result = await fetchOrderTrackingByToken(token);

      if (!mounted) return;

      if (result.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      if (!result.data) {
        setErrorMessage("Tracking response is empty.");
        setIsLoading(false);
        return;
      }

      setOrder(result.data);
      setIsLoading(false);
    }

    void loadOrder();

    return () => {
      mounted = false;
    };
  }, [token]);

  const items = useMemo(() => parseItems(order?.items), [order?.items]);
  const history = useMemo(() => parseHistory(order?.history), [order?.history]);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.subtotal), 0),
    [items],
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2.5}>
        {!isSupabaseConfigured() ? <SupabaseConfigAlert /> : null}

        {isLoading ? (
          <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!isLoading && order ? (
          <>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Order Tracking
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Token: {order.tracking_token}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Current status:</Typography>
                    <OrderStatusChip status={order.status} />
                  </Stack>
                  <Typography variant="body2">
                    Customer: {order.full_name}
                  </Typography>
                  <Typography variant="body2">
                    Delivery location: {order.delivery_location}
                  </Typography>
                  <Typography variant="body2">
                    Wanted date: {formatDate(order.wanted_date)}
                  </Typography>
                  <Typography variant="body2">
                    Ordered on: {formatDate(order.created_at)}
                  </Typography>
                  {order.customer_note ? (
                    <Typography variant="body2">
                      Notes: {order.customer_note}
                    </Typography>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Ordered Items
                </Typography>
                <Stack spacing={1.2}>
                  {items.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {item.product_name}
                      </Typography>
                      <Typography variant="body2">
                        Qty {item.quantity} | {item.height_cm}cm x{" "}
                        {item.width_cm}
                        cm
                      </Typography>
                      <Typography variant="body2">
                        {formatMoney(Number(item.unit_price))} each
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatMoney(Number(item.subtotal))}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Total: {formatMoney(total)}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Status Timeline
                </Typography>
                <Stack spacing={1}>
                  {history.length ? (
                    history.map((event, index) => (
                      <Typography
                        key={`${event.status}-${index}`}
                        variant="body2"
                      >
                        {formatDate(event.created_at)} -{" "}
                        {ORDER_STATUS_LABELS[event.status]}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No status events recorded yet.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </>
        ) : null}
      </Stack>
    </Container>
  );
}

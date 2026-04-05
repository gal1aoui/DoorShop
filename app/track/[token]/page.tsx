"use client";

import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import {
  Alert,
  Box,
  Button,
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

const TRACKING_TOKEN_PATTERN = /^[a-z0-9_-]{6,128}$/i;

function mapUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function normalizeTrackingToken(
  rawToken: string | string[] | undefined,
): string | null {
  const firstToken = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  if (!firstToken) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(firstToken).trim().toLowerCase();
    return TRACKING_TOKEN_PATTERN.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

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
  const params = useParams();
  const token = useMemo(() => normalizeTrackingToken(params?.token), [params]);

  const [order, setOrder] = useState<PublicOrderTrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      if (!token) {
        if (!mounted) return;
        setOrder(null);
        setErrorMessage("Tracking token format is invalid.");
        setIsLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        if (!mounted) return;
        setOrder(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const result = await fetchOrderTrackingByToken(token);

      if (!mounted) return;

      if (result.error) {
        setOrder(null);
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      if (!result.data) {
        setOrder(null);
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
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                  >
                    <Typography variant="body2">
                      Delivery location: {order.delivery_location}
                    </Typography>
                    <Button
                      component="a"
                      href={mapUrl(order.delivery_location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      variant="outlined"
                      startIcon={<MapOutlinedIcon fontSize="small" />}
                    >
                      Open map
                    </Button>
                  </Stack>
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
                  {order.status === "rejected" && order.rejection_reason ? (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      Rejection reason: {order.rejection_reason}
                    </Alert>
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

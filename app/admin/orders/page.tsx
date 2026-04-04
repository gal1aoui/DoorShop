"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/admin/admin-guard";
import AdminNav from "@/components/admin/admin-nav";
import OrderStatusChip from "@/components/order-status-chip";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import {
  fetchAdminOrders,
  subscribeToAdminOrders,
  updateAdminOrderStatus,
} from "@/services/admin/orders.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { AdminOrder } from "@/types/admin";
import type { OrderStatus } from "@/types/database";
import { formatDate, formatMoney } from "@/utils/formatters";
import { ORDER_STATUSES } from "@/utils/order-status";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  const fetchOrders = useCallback(async () => {
    if (!supabaseConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await fetchAdminOrders({ searchTerm, statusFilter });
    if (result.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
      return;
    }

    setOrders(result.data ?? []);
    setIsLoading(false);
  }, [searchTerm, statusFilter, supabaseConfigured]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToAdminOrders(() => {
      void fetchOrders();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchOrders, supabaseConfigured]);

  async function handleStatusUpdate(orderId: string, nextStatus: OrderStatus) {
    if (!supabaseConfigured) {
      return;
    }

    setIsUpdatingStatus(orderId);
    const result = await updateAdminOrderStatus(orderId, nextStatus);
    if (result.error) {
      setErrorMessage(result.error);
      setIsUpdatingStatus(null);
      return;
    }

    setIsUpdatingStatus(null);
    await fetchOrders();
  }

  const hasOrders = useMemo(() => orders.length > 0, [orders.length]);

  return (
    <AdminGuard>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminNav />
        {!supabaseConfigured ? <SupabaseConfigAlert /> : null}

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                label="Search by customer name or phone"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | OrderStatus)
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="all">All statuses</MenuItem>
                {ORDER_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => void fetchOrders()}
              >
                Refresh
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {isLoading ? (
          <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!isLoading && !hasOrders ? (
          <Alert severity="info">
            No orders found for your current search and filters.
          </Alert>
        ) : null}

        <Stack spacing={2}>
          {orders.map((order) => {
            const orderTotal = order.order_items.reduce(
              (sum, item) => sum + Number(item.subtotal),
              0,
            );

            return (
              <Card key={order.id} variant="outlined">
                <CardContent>
                  <Stack spacing={1.2}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                      spacing={1}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {order.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.phone_number} | {order.delivery_location}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <OrderStatusChip status={order.status} />
                        <TextField
                          select
                          size="small"
                          value={order.status}
                          onChange={(event) =>
                            void handleStatusUpdate(
                              order.id,
                              event.target.value as OrderStatus,
                            )
                          }
                          disabled={isUpdatingStatus === order.id}
                          sx={{ minWidth: 180 }}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      Ordered on {formatDate(order.created_at)} | Wanted by{" "}
                      {formatDate(order.wanted_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tracking token: {order.tracking_token ?? "N/A"}
                    </Typography>

                    {order.customer_note ? (
                      <Typography variant="body2">
                        Customer note: {order.customer_note}
                      </Typography>
                    ) : null}

                    <Box
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      {order.order_items.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 1.5,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-child": { borderBottom: "none" },
                          }}
                        >
                          <Typography sx={{ fontWeight: 700 }}>
                            {item.door_products?.name ?? "Unknown product"}
                          </Typography>
                          <Typography variant="body2">
                            Qty {item.quantity} | {item.height_cm}cm x{" "}
                            {item.width_cm}cm
                          </Typography>
                          <Typography variant="body2">
                            {formatMoney(Number(item.unit_price))} each |{" "}
                            {formatMoney(Number(item.subtotal))}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Order total: {formatMoney(orderTotal)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Container>
    </AdminGuard>
  );
}

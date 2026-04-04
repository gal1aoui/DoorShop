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
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/admin/admin-guard";
import AdminNav from "@/components/admin/admin-nav";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import { fetchAnalyticsOrders } from "@/services/admin/analytics.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { AnalyticsOrder, ProductAggregate } from "@/types/admin";
import type { OrderStatus } from "@/types/database";
import { formatMoney } from "@/utils/formatters";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/utils/order-status";

export default function AdminAnalyticsPage() {
  const supabaseConfigured = isSupabaseConfigured();
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!supabaseConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await fetchAnalyticsOrders();
    if (result.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
      return;
    }

    setOrders(result.data ?? []);
    setIsLoading(false);
  }, [supabaseConfigured]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const totals = useMemo(() => {
    const totalOrders = orders.length;
    let totalUnits = 0;
    let totalRevenue = 0;
    const statusBreakdown: Record<OrderStatus, number> = {
      received: 0,
      confirmed: 0,
      constructing: 0,
      delivering: 0,
      delivered: 0,
    };
    const productMap = new Map<string, ProductAggregate>();

    orders.forEach((order) => {
      statusBreakdown[order.status] += 1;

      order.order_items.forEach((item) => {
        totalUnits += Number(item.quantity);
        totalRevenue += Number(item.subtotal);
        const key = item.door_products?.name ?? "Unknown product";
        const current = productMap.get(key);

        if (current) {
          current.quantity += Number(item.quantity);
          current.revenue += Number(item.subtotal);
        } else {
          productMap.set(key, {
            name: key,
            quantity: Number(item.quantity),
            revenue: Number(item.subtotal),
          });
        }
      });
    });

    const topProducts = [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    return {
      totalOrders,
      totalUnits,
      totalRevenue,
      statusBreakdown,
      topProducts,
    };
  }, [orders]);

  return (
    <AdminGuard>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminNav />
        {!supabaseConfigured ? <SupabaseConfigAlert /> : null}

        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void fetchAnalytics()}
          >
            Refresh
          </Button>
        </Stack>

        {isLoading ? (
          <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!isLoading ? (
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
              }}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary">Total Orders</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {totals.totalOrders}
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary">Units Sold</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {totals.totalUnits}
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary">Total Revenue</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {formatMoney(totals.totalRevenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Order Status Breakdown
                </Typography>
                <Stack spacing={0.75}>
                  {ORDER_STATUSES.map((status) => (
                    <Typography key={status} variant="body2">
                      {ORDER_STATUS_LABELS[status]}:{" "}
                      {totals.statusBreakdown[status]}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Top Selling Products
                </Typography>
                <Stack spacing={1}>
                  {totals.topProducts.length ? (
                    totals.topProducts.map((product) => (
                      <Box
                        key={product.name}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          pb: 1,
                          "&:last-child": { borderBottom: "none", pb: 0 },
                        }}
                      >
                        <Typography>{product.name}</Typography>
                        <Typography>
                          {product.quantity} units |{" "}
                          {formatMoney(product.revenue)}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No sales data yet.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : null}
      </Container>
    </AdminGuard>
  );
}

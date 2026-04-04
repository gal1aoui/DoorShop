"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    <>
      {!supabaseConfigured ? <SupabaseConfigAlert /> : null}

      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              mb: 1,
              color: "var(--on-surface)",
            }}
          >
            Analytics Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "var(--on-surface-variant)",
              fontSize: "0.875rem",
            }}
          >
            Real-time insights into sales performance, product trends, and
            production metrics.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => void fetchAnalytics()}
        >
          Refresh
        </Button>
      </Box>

      {/* Loading State */}
      {isLoading ? (
        <Box sx={{ minHeight: 400, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : null}

      {/* Error Alert */}
      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      ) : null}

      {!isLoading ? (
        <Stack spacing={4}>
          {/* KPI Grid */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: "var(--outline-variant)",
                  backgroundColor: "var(--surface-container-low)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <CardContent>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Total Revenue
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 800,
                      my: 1.5,
                      color: "var(--primary)",
                    }}
                  >
                    {formatMoney(totals.totalRevenue)}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TrendingUpIcon
                      sx={{
                        fontSize: "16px",
                        color: "var(--success)",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      From {totals.totalOrders} orders
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: "var(--outline-variant)",
                  backgroundColor: "var(--surface-container-low)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Doors Produced
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 800,
                      my: 1.5,
                      color: "var(--tertiary)",
                    }}
                  >
                    {totals.totalUnits}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Custom units manufactured
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: "var(--outline-variant)",
                  backgroundColor: "var(--surface-container-low)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Active Orders
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 800,
                      my: 1.5,
                      color: "var(--warning)",
                    }}
                  >
                    {totals.statusBreakdown.constructing +
                      totals.statusBreakdown.delivering}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    In production or transit
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: "var(--outline-variant)",
                  backgroundColor: "var(--surface-container-low)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Completion Rate
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 800,
                      my: 1.5,
                      color: "var(--success)",
                    }}
                  >
                    {totals.totalOrders > 0
                      ? Math.round(
                          (totals.statusBreakdown.delivered /
                            totals.totalOrders) *
                            100,
                        )
                      : 0}
                    %
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    {totals.statusBreakdown.delivered} delivered
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Status Breakdown */}
          <Card
            variant="outlined"
            sx={{ borderColor: "var(--outline-variant)" }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  mb: 3,
                  fontSize: "1rem",
                }}
              >
                Order Status Distribution
              </Typography>

              <Stack spacing={2.5}>
                {ORDER_STATUSES.map((status) => {
                  const count = totals.statusBreakdown[status];
                  const percentage =
                    totals.totalOrders > 0
                      ? Math.round((count / totals.totalOrders) * 100)
                      : 0;

                  let statusColor = "var(--outline)";
                  if (status === "received" || status === "confirmed")
                    statusColor = "var(--warning)";
                  if (status === "constructing")
                    statusColor = "var(--tertiary)";
                  if (status === "delivering") statusColor = "var(--warning)";
                  if (status === "delivered") statusColor = "var(--success)";

                  return (
                    <Box key={status}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "var(--on-surface)",
                          }}
                        >
                          {ORDER_STATUS_LABELS[status]}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "var(--on-surface-variant)",
                          }}
                        >
                          {count} ({percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: "8px",
                          borderRadius: "4px",
                          backgroundColor: "var(--surface-container-high)",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: statusColor,
                            borderRadius: "4px",
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card
            variant="outlined"
            sx={{ borderColor: "var(--outline-variant)" }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  mb: 2,
                  fontSize: "1rem",
                }}
              >
                Top Selling Products
              </Typography>

              {totals.topProducts.length > 0 ? (
                <Stack spacing={2}>
                  {totals.topProducts.map((product, index) => (
                    <Box
                      key={product.name}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        backgroundColor:
                          index === 0
                            ? "var(--surface-container-high)"
                            : "transparent",
                        borderRadius: "0.5rem",
                        borderLeft:
                          index === 0
                            ? "3px solid var(--primary)"
                            : "3px solid transparent",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "var(--on-surface)",
                          }}
                        >
                          {index + 1}. {product.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--on-surface-variant)",
                          }}
                        >
                          {product.quantity} units sold
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: '"Manrope", sans-serif',
                          fontWeight: 800,
                          color: "var(--primary)",
                        }}
                      >
                        {formatMoney(product.revenue)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No sales data yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      ) : null}
    </>
  );
}

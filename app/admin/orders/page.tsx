"use client";

import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => {
      return (
        sum +
        order.order_items.reduce((sum, item) => sum + Number(item.subtotal), 0)
      );
    }, 0);

    const pending = orders.filter(
      (o) => o.status === "received" || o.status === "confirmed",
    ).length;
    const inProduction = orders.filter(
      (o) => o.status === "constructing",
    ).length;
    const completed = orders.filter((o) => o.status === "delivered").length;

    return { totalRevenue, pending, inProduction, completed };
  }, [orders]);

  return (
    <>
      {!supabaseConfigured ? <SupabaseConfigAlert /> : null}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontWeight: 800,
            mb: 1,
            color: "var(--on-surface)",
          }}
        >
          Orders Management
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "var(--on-surface-variant)",
            fontSize: "0.875rem",
          }}
        >
          Track customer orders, update production status, and manage
          fulfillment.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
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
                Total Revenue
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  my: 1,
                  color: "var(--primary)",
                }}
              >
                {formatMoney(stats.totalRevenue)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--on-surface-variant)" }}
              >
                {orders.length} order{orders.length !== 1 ? "s" : ""}
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
                Pending Orders
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  my: 1,
                  color: "var(--tertiary)",
                }}
              >
                {stats.pending}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--on-surface-variant)" }}
              >
                Awaiting production
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
                In Production
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  my: 1,
                  color: "var(--warning)",
                }}
              >
                {stats.inProduction}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--on-surface-variant)" }}
              >
                Currently manufacturing
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
                Completed
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  my: 1,
                  color: "var(--success)",
                }}
              >
                {stats.completed}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--on-surface-variant)" }}
              >
                Ready or delivered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Card
        variant="outlined"
        sx={{
          borderColor: "var(--outline-variant)",
          backgroundColor: "var(--surface-container-lowest)",
          mb: 3,
        }}
      >
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              size="small"
              variant="outlined"
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  style: { fontSize: "0.875rem" },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: "1.25rem" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              label="Filter by Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | OrderStatus)
              }
              size="small"
              variant="outlined"
              sx={{ minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterListIcon sx={{ fontSize: "1.25rem" }} />
                    </InputAdornment>
                  ),
                },
              }}
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
              size="small"
            >
              Refresh
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      ) : null}

      {/* Loading State */}
      {isLoading ? (
        <Box sx={{ minHeight: 400, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : null}

      {/* Empty State */}
      {!isLoading && !hasOrders ? (
        <Alert severity="info">
          No orders found for your current search and filters.
        </Alert>
      ) : null}

      {/* Orders Table */}
      {!isLoading && hasOrders ? (
        <Card variant="outlined" sx={{ borderColor: "var(--outline-variant)" }}>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ backgroundColor: "var(--surface-container-low)" }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Customer
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Contact
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Items
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Total
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Ordered
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Wanted By
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => {
                  const orderTotal = order.order_items.reduce(
                    (sum, item) => sum + Number(item.subtotal),
                    0,
                  );

                  return (
                    <TableRow
                      key={order.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: "var(--surface-container-high)",
                        },
                        borderBottom: "1px solid var(--outline-variant)",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {order.full_name}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "0.875rem",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {order.phone_number}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>
                        {order.order_items.length} items
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          fontFamily: '"Manrope", sans-serif',
                          color: "var(--primary)",
                        }}
                      >
                        {formatMoney(orderTotal)}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "0.75rem",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "0.75rem",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {formatDate(order.wanted_date)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusChip status={order.status} />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>
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
                          sx={{ minWidth: 160 }}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : null}
    </>
  );
}

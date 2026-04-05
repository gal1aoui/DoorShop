"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import OrderStatusChip from "@/components/order-status-chip";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import {
  deleteAdminOrder,
  fetchAdminOrders,
  subscribeToAdminOrders,
  updateAdminOrderStatus,
} from "@/services/admin/orders.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { AdminOrder } from "@/types/admin";
import type { OrderStatus } from "@/types/database";
import { formatDate, formatMoney } from "@/utils/formatters";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/utils/order-status";

type OrdersViewMode = "table" | "items";

function mapUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function orderTotal(order: AdminOrder): number {
  return order.order_items.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0,
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<OrdersViewMode>("table");
  const [deleteTarget, setDeleteTarget] = useState<AdminOrder | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [rejectionDrafts, setRejectionDrafts] = useState<
    Record<string, string>
  >({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, OrderStatus>>(
    {},
  );

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

    const rows = result.data ?? [];
    setOrders(rows);
    setRejectionDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const order of rows) {
        next[order.id] = prev[order.id] ?? order.rejection_reason ?? "";
      }
      return next;
    });
    setStatusDrafts((prev) => {
      const next: Record<string, OrderStatus> = {};
      for (const order of rows) {
        next[order.id] = prev[order.id] ?? order.status;
      }
      return next;
    });
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

    const rejectionReason = rejectionDrafts[orderId] ?? "";
    if (nextStatus === "rejected" && !rejectionReason.trim()) {
      setErrorMessage(
        "ERR_REJECTION_REASON_REQUIRED: Add a reason before rejecting.",
      );
      return;
    }

    setIsUpdatingStatus(orderId);
    setErrorMessage(null);
    const result = await updateAdminOrderStatus(
      orderId,
      nextStatus,
      rejectionReason,
    );
    if (result.error) {
      setErrorMessage(result.error);
      setStatusDrafts((prev) => ({
        ...prev,
        [orderId]:
          orders.find((order) => order.id === orderId)?.status ??
          prev[orderId] ??
          nextStatus,
      }));
      setIsUpdatingStatus(null);
      return;
    }

    setIsUpdatingStatus(null);
    await fetchOrders();
  }

  function handleRejectionDraftChange(orderId: string, value: string) {
    setRejectionDrafts((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  }

  async function handleStatusSelect(orderId: string, nextStatus: OrderStatus) {
    setStatusDrafts((prev) => ({
      ...prev,
      [orderId]: nextStatus,
    }));

    if (nextStatus === "rejected") {
      return;
    }

    await handleStatusUpdate(orderId, nextStatus);
  }

  async function confirmDeleteOrder() {
    if (!deleteTarget || !supabaseConfigured) {
      return;
    }

    setDeleteSubmitting(true);
    setErrorMessage(null);
    const result = await deleteAdminOrder(deleteTarget.id);
    setDeleteSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      setDeleteTarget(null);
      return;
    }

    setDeleteTarget(null);
    await fetchOrders();
  }

  const hasOrders = useMemo(() => orders.length > 0, [orders.length]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + orderTotal(order),
      0,
    );
    const incoming = orders.filter(
      (order) => order.status === "received" || order.status === "confirmed",
    ).length;
    const inProduction = orders.filter(
      (order) =>
        order.status === "constructing" || order.status === "delivering",
    ).length;
    const rejected = orders.filter(
      (order) => order.status === "rejected",
    ).length;

    return { totalRevenue, incoming, inProduction, rejected };
  }, [orders]);

  return (
    <>
      {!supabaseConfigured ? <SupabaseConfigAlert /> : null}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Orders Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review orders by table or item cards, track customer deliveries, and
          handle rejections with reasons.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {formatMoney(stats.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Incoming
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {stats.incoming}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                In Progress
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {stats.inProduction}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Rejected
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {stats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", lg: "center" }}
            >
              <TextField
                placeholder="Search by customer name or phone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                sx={{ flex: 1 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | OrderStatus)
                }
                sx={{ minWidth: { lg: 220 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterListIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              >
                <MenuItem value="all">All statuses</MenuItem>
                {ORDER_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
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

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_event, value: OrdersViewMode | null) => {
                if (value) setViewMode(value);
              }}
              size="small"
            >
              <ToggleButton value="table">
                <TableRowsIcon sx={{ mr: 1 }} fontSize="small" />
                Table view
              </ToggleButton>
              <ToggleButton value="items">
                <ViewModuleIcon sx={{ mr: 1 }} fontSize="small" />
                Items view
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      ) : null}

      {isLoading ? (
        <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!isLoading && !hasOrders ? (
        <Alert severity="info">No orders found for current filters.</Alert>
      ) : null}

      {!isLoading && hasOrders && viewMode === "table" ? (
        <Card variant="outlined">
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Update</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => {
                  const selectedStatus = statusDrafts[order.id] ?? order.status;
                  const isRejectedSelected = selectedStatus === "rejected";
                  const rejectionReason = rejectionDrafts[order.id] ?? "";
                  const isSaving = isUpdatingStatus === order.id;

                  return (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>
                          {order.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ordered {formatDate(order.created_at)} | wanted{" "}
                          {formatDate(order.wanted_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.phone_number}</TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <Typography variant="body2" sx={{ maxWidth: 220 }}>
                            {order.delivery_location}
                          </Typography>
                          <IconButton
                            size="small"
                            component="a"
                            href={mapUrl(order.delivery_location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open location in maps"
                          >
                            <MapOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatMoney(orderTotal(order))}
                      </TableCell>
                      <TableCell>
                        <OrderStatusChip status={order.status} />
                      </TableCell>
                      <TableCell sx={{ minWidth: 260 }}>
                        <Stack spacing={1}>
                          <TextField
                            select
                            size="small"
                            value={selectedStatus}
                            onChange={(event) =>
                              void handleStatusSelect(
                                order.id,
                                event.target.value as OrderStatus,
                              )
                            }
                            disabled={isSaving}
                          >
                            {ORDER_STATUSES.map((status) => (
                              <MenuItem key={status} value={status}>
                                {ORDER_STATUS_LABELS[status]}
                              </MenuItem>
                            ))}
                          </TextField>
                          {isRejectedSelected ? (
                            <>
                              <TextField
                                size="small"
                                label="Rejection reason"
                                value={rejectionReason}
                                onChange={(event) =>
                                  handleRejectionDraftChange(
                                    order.id,
                                    event.target.value,
                                  )
                                }
                                placeholder="Required when status is rejected"
                                disabled={isSaving}
                              />
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  void handleStatusUpdate(order.id, "rejected")
                                }
                                disabled={isSaving || !rejectionReason.trim()}
                              >
                                {isSaving ? "Saving..." : "Save rejection"}
                              </Button>
                            </>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {order.tracking_token ? (
                            <Button
                              component={Link}
                              href={`/track/${encodeURIComponent(order.tracking_token)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNewIcon fontSize="small" />}
                            >
                              Track
                            </Button>
                          ) : null}
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon fontSize="small" />}
                            onClick={() => setDeleteTarget(order)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : null}

      {!isLoading && hasOrders && viewMode === "items" ? (
        <Stack spacing={2}>
          {orders.map((order) => {
            const selectedStatus = statusDrafts[order.id] ?? order.status;
            const isRejectedSelected = selectedStatus === "rejected";
            const rejectionReason = rejectionDrafts[order.id] ?? "";
            const isSaving = isUpdatingStatus === order.id;

            return (
              <Card key={order.id} variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {order.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.phone_number}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <OrderStatusChip status={order.status} />
                        <Typography sx={{ fontWeight: 700 }}>
                          {formatMoney(orderTotal(order))}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        select
                        size="small"
                        label="Status"
                        value={selectedStatus}
                        onChange={(event) =>
                          void handleStatusSelect(
                            order.id,
                            event.target.value as OrderStatus,
                          )
                        }
                        disabled={isSaving}
                        sx={{ minWidth: { md: 220 } }}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {ORDER_STATUS_LABELS[status]}
                          </MenuItem>
                        ))}
                      </TextField>
                      {isRejectedSelected ? (
                        <>
                          <TextField
                            size="small"
                            label="Rejection reason"
                            value={rejectionReason}
                            onChange={(event) =>
                              handleRejectionDraftChange(
                                order.id,
                                event.target.value,
                              )
                            }
                            placeholder="Required when status is rejected"
                            sx={{ flex: 1 }}
                            disabled={isSaving}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              void handleStatusUpdate(order.id, "rejected")
                            }
                            disabled={isSaving || !rejectionReason.trim()}
                          >
                            {isSaving ? "Saving..." : "Save rejection"}
                          </Button>
                        </>
                      ) : null}
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        component="a"
                        href={mapUrl(order.delivery_location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        startIcon={<MapOutlinedIcon />}
                      >
                        Open location
                      </Button>
                      {order.tracking_token ? (
                        <Button
                          component={Link}
                          href={`/track/${encodeURIComponent(order.tracking_token)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          variant="outlined"
                          startIcon={<OpenInNewIcon />}
                        >
                          Track page
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => setDeleteTarget(order)}
                      >
                        Delete order
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : null}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (!deleteSubmitting ? setDeleteTarget(null) : undefined)}
      >
        <DialogTitle>Delete order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `This will permanently delete order ${deleteTarget.id} and all linked items/status history.`
              : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleteSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteSubmitting}
            onClick={() => void confirmDeleteOrder()}
          >
            {deleteSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

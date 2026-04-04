"use client";

import { Chip } from "@mui/material";
import type { OrderStatus } from "@/types/database";
import { ORDER_STATUS_LABELS } from "@/utils/order-status";

function statusColor(
  status: OrderStatus,
): "default" | "info" | "primary" | "warning" | "success" {
  if (status === "received") return "info";
  if (status === "confirmed") return "primary";
  if (status === "constructing") return "warning";
  if (status === "delivering") return "warning";
  return "success";
}

export default function OrderStatusChip({ status }: { status: OrderStatus }) {
  return (
    <Chip
      label={ORDER_STATUS_LABELS[status]}
      color={statusColor(status)}
      variant={status === "delivered" ? "filled" : "outlined"}
      size="small"
    />
  );
}

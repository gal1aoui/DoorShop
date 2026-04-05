import type { OrderStatus } from "@/types/database";

export const ORDER_STATUSES: OrderStatus[] = [
  "received",
  "confirmed",
  "constructing",
  "delivering",
  "delivered",
  "rejected",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Received",
  confirmed: "Confirmed",
  constructing: "Constructing",
  delivering: "Delivering",
  delivered: "Delivered",
  rejected: "Rejected",
};

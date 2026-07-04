// src/types/adminOrders.ts
//
// Admin back-office order types — mirror the C# contracts in
// Contracts/AdminOrderContracts.cs (camelCased by the API's JSON options).
//
// Fulfillment model: the checkpoint an order sits at is derived from which
// timestamps are set, precedence Returned > Delivered > Shipped > Received
// (= paidAt). Payment `status` is a separate axis.

import type { OrderDto, OrderStatus } from "./customer";

export type AdminOrderListItem = {
  orderId:       number;
  status:        OrderStatus;
  amountCents:   number;
  itemCount:     number;
  customerName:  string;
  customerEmail: string;
  createdAt:     string;
  paidAt:        string | null;
  cancelledAt:   string | null;
  shippedAt:     string | null;
  deliveredAt:   string | null;
  returnedAt:    string | null;
};

/** OrderDto plus the fulfillment timestamps the admin endpoints select. */
export type AdminOrderDto = OrderDto & {
  shippedAt:   string | null;
  deliveredAt: string | null;
  returnedAt:  string | null;
};

export type AdminOrderDetail = {
  order:         AdminOrderDto;
  customerName:  string;
  customerEmail: string;
};

export type OrderCheckpoint = "shipped" | "delivered" | "returned";

/** Derived display checkpoint for a paid order (list + detail agree on this). */
export function fulfillmentLabel(o: {
  status: OrderStatus;
  returnedAt: string | null;
  deliveredAt: string | null;
  shippedAt: string | null;
}): string | null {
  if (o.status !== "Paid") return null; // payment status tells the story
  if (o.returnedAt)  return "Returned";
  if (o.deliveredAt) return "Delivered";
  if (o.shippedAt)   return "Shipped";
  return "Received";
}

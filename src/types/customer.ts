// src/types/customer.ts
//
// Customer-facing DTOs mirroring LinenLady.API/Contracts/CustomerContracts.cs.
// Fields are camelCase here because the API serializes that way (default
// System.Text.Json policy).
//
// Reservation status collapsed to two values in the basket migration —
// historical orders carry the OLD set on the API side as legacy data, but
// the frontend never sees them in the new world; the messages tab is the
// only place a stale value could leak through and it's display-only there.

export type ReservationDto = {
  reservationId:  number;
  customerId:     number;
  inventoryId:    number;
  status:         "Active" | "Expired";
  reservedAt:     string;
  expiresAt:      string;
  customerNotes:  string | null;

  // Inventory snapshot — denormalized for the basket UI
  itemName:        string | null;
  itemSku:         string | null;
  itemPublicId:    string | null;
  thumbnailUrl:    string | null;
  unitPriceCents:  number;

  // True only for Expired rows where the underlying piece is still
  // purchasable AND nobody else has it on hold. Computed server-side so
  // the "Try Again" button is honest about availability without the UI
  // having to do its own check.
  canReAdd:        boolean;
};

// ── Order ──────────────────────────────────────────────────────────────

export type OrderStatus = "PaymentPending" | "Paid" | "Cancelled" | "Failed";

export type OrderDto = {
  orderId:                number;
  customerId:             number;
  status:                 OrderStatus;
  amountCents:            number;
  squarePaymentLinkUrl:   string | null;
  squareOrderId:          string | null;

  // Shipping snapshot at checkout time
  shipLabel:    string | null;
  shipStreet1:  string | null;
  shipStreet2:  string | null;
  shipCity:     string | null;
  shipState:    string | null;
  shipZip:      string | null;
  shipCountry:  string | null;

  customerNotes: string | null;
  createdAt:     string;
  paidAt:        string | null;
  cancelledAt:   string | null;

  items: OrderItemDto[];
};

export type OrderItemDto = {
  orderItemId:    number;
  orderId:        number;
  reservationId:  number;
  inventoryId:    number;
  itemName:       string;
  itemSku:        string | null;
  unitPriceCents: number;
  itemPublicId:   string | null;
  thumbnailUrl:   string | null;
};

// ── Customer ─────────────────────────────────────────────────────────────

export type CustomerDto = {
  customerId:      number;
  clerkUserId:     string;
  email:           string;
  firstName:       string | null;
  lastName:        string | null;
  phone:           string | null;
  isEmailVerified: boolean;
  createdAt:       string;
};

export type CustomerAddressDto = {
  addressId:  number;
  customerId: number;
  label:      string;
  street1:    string;
  street2:    string | null;
  city:       string;
  state:      string;
  zip:        string;
  country:    string;
  isDefault:  boolean;
};

export type CustomerPreferenceDto = {
  preferenceId: number;
  customerId:   number;
  category:     string;
  notifyOnNew:  boolean;
};

// ── Messages ────────────────────────────────────────────────────────────

export type MessageDto = {
  messageId:     number;
  customerId:    number;
  reservationId: number | null;
  orderId:       number | null;   // NEW: order-level anchors
  direction:     "Inbound" | "Outbound";
  body:          string;
  isRead:        boolean;
  sentAt:        string;
};

export type ConversationSummaryDto = {
  firstName:            string;
  lastName:             string;
  email:                string;
  customerId:           number;
  totalMessages:        number;
  unreadInboundCount:   number;
  lastMessageAt:        string | null;
  lastMessageDirection: "Inbound" | "Outbound";
  lastMessageBody:      string;
};

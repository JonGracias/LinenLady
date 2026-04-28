// src/types/customer.ts

export type ReservationDto = {
  reservationId:        number;
  customerId:           number;
  inventoryId:          number;
  status:               "Pending" | "Confirmed" | "PaymentSent" | "Completed" | "Expired" | "Cancelled";
  reservedAt:           string;
  expiresAt:            string;
  paymentSentAt:        string | null;
  completedAt:          string | null;
  customerNotes:        string | null;
  squarePaymentLinkUrl: string | null;
  amountCents:          number;
  // Denormalized
  itemName:     string | null;
  itemSku:      string | null;
  itemPublicId: string | null;
  thumbnailUrl: string | null;
};

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

export type MessageDto = {
  messageId:     number;
  customerId:    number;
  reservationId: number | null;
  direction:     "Inbound" | "Outbound";
  body:          string;
  isRead:        boolean;
  sentAt:        string;
};

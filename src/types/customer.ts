// src/types/customer.ts

export type ReservationDto = {
  ReservationId:       number;
  CustomerId:          number;
  InventoryId:         number;
  Status:              "Pending" | "Confirmed" | "PaymentSent" | "Completed" | "Expired" | "Cancelled";
  ReservedAt:          string;
  ExpiresAt:           string;
  PaymentSentAt:       string | null;
  CompletedAt:         string | null;
  CustomerNotes:       string | null;
  SquarePaymentLinkUrl: string | null;
  AmountCents:         number;
  // Denormalized
  ItemName:   string | null;
  ItemSku:    string | null;
  ItemPublicId: string | null;
  ThumbnailUrl: string | null;
};

export type CustomerDto = {
  CustomerId:      number;
  ClerkUserId:     string;
  Email:           string;
  FirstName:       string | null;
  LastName:        string | null;
  Phone:           string | null;
  IsEmailVerified: boolean;
  CreatedAt:       string;
};

export type CustomerAddressDto = {
  AddressId:  number;
  CustomerId: number;
  Label:      string;
  Street1:    string;
  Street2:    string | null;
  City:       string;
  State:      string;
  Zip:        string;
  Country:    string;
  IsDefault:  boolean;
};

export type CustomerPreferenceDto = {
  PreferenceId: number;
  CustomerId:   number;
  Category:     string;
  NotifyOnNew:  boolean;
};

export type MessageDto = {
  MessageId:     number;
  CustomerId:    number;
  ReservationId: number | null;
  Direction:     "Inbound" | "Outbound";
  Body:          string;
  IsRead:        boolean;
  SentAt:        string;
};
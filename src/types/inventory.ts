export type InventoryItem = {
  InventoryId: number;
  Sku: string;
  Name: string;
  Description?: string | null;
  QuantityOnHand: number;
  UnitPriceCents: number;
  PublicId: string;
  IsActive: boolean;
  IsDraft: boolean;
  IsDeleted: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  Images?: {
    ImageId: number;
    ImagePath: string;
    IsPrimary: boolean;
    SortOrder: number;
  }[];
};

export type InventoryImage = {
  ImageId: number;
  InventoryId?: number;
  ImagePath: string;
  IsPrimary: boolean;
  SortOrder: number;
  ReadUrl?: string | null;
};

export type DraftUpload = {
  Index: number;
  BlobName: string;
  UploadUrl: string;
  Method: "PUT";
  RequiredHeaders: Record<string, string>;
  ContentType: string;
};

export type CreateDraftRequest = {
  titleHint?: string;
  notes?: string;
  files: { fileName: string; contentType: string }[];
};

export type CreateDraftResponse = {
  InventoryId: number;
  PublicId: string;
  Sku: string;
  Container: string;
  ExpiresOnUtc: string;
  Uploads: Array<{
    Index: number;
    BlobName: string;
    UploadUrl: string;
    Method: "PUT";
    RequiredHeaders: Record<string, string>;
    ContentType: string;
  }>;
};
// src/types/inventory.ts

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
  IsFeatured: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  /** Raw JSON string from inv.InventoryAiMeta. Parse to access condition[], materials[], era[], etc. */
  KeywordsJson?: string | null;
  Images?: {
    ImageId: number;
    ImagePath: string;
    IsPrimary: boolean;
    SortOrder: number;
  }[];
};

export type Filter = "all" | "drafts" | "published" | "featured";

export type Category =
  | "tablecloth"
  | "napkin"
  | "bed linen"
  | "runner"
  | "placemat"
  | "towel"
  | "lace"
  | "doily"
  | "curtain"
  | "drape"
  | "quilt"
  | "blanket";

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "tablecloth", label: "Tablecloths" },
  { value: "napkin",     label: "Napkins"     },
  { value: "bed linen",  label: "Bed Linens"  },
  { value: "runner",     label: "Runners"     },
  { value: "placemat",   label: "Placemats"   },
  { value: "towel",      label: "Towels"      },
  { value: "lace",       label: "Lace"        },
  { value: "doily",      label: "Doilies"     },
  { value: "curtain",    label: "Curtains"    },
  { value: "drape",      label: "Drapes"      },
  { value: "quilt",      label: "Quilts"      },
  { value: "blanket",    label: "Blankets"    },
];

export type Counts = {
  all: number;
  drafts: number;
  published: number;
};

export type InventoryContextValue = {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;

  // paging
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  counts: Counts;

  // controls
  setPage: (n: number) => void;
  setPageSize: (n: number) => void;
  setFilter: (f: Filter) => void;
  filter: Filter;

  // category filter
  category: Category | null;
  setCategory: (c: Category | null) => void;

  sorted: InventoryItem[];

  getThumbnailUrl: (InventoryId: number) => string | null;
  ensureThumbnail: (InventoryId: number, ttlMinutes?: number) => void;

  getImages: (InventoryId: number) => InventoryImage[] | null;
  ensureImages: (InventoryId: number, ttlMinutes?: number) => void;
  refreshImages: (InventoryId: number, ttlMinutes?: number) => Promise<InventoryImage[]>;

  invalidateCache: () => void;
  invalidateFilterCache: (filter?: Filter) => void;
  reloadItems: () => void;
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

export type GetItemsResponse = {
  items: InventoryItem[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  status: string;
};

export type CreateDraftRequest = {
  TitleHint?: string;
  Notes?: string;
  Files: { FileName: string; ContentType: string }[];
};

export type CreateDraftResponse = {
  InventoryId: number;
  PublicId: string;
  Sku: string;
  Container: string;
  ExpiresOnUtc: string;
  Uploads: DraftUpload[];
};

export type AiPrefillRequest = {
  InventoryId: number;
  Overwrite?: boolean;
  MaxImages?: number;
  ImageIds?: number[];
  TitleHint?: string;
  Notes?: string;
};

export type EmbeddingsRequest = {
  InventoryId: number;
  Opts?: { Purpose?: string; Force?: number };
};

export type DraftPipelineOptions = {
  Keys?: { TitleHint?: string; Notes?: string; Files?: string };
  RunAiVision?: boolean;
  RunAiEmbeddings?: boolean;
  RunAiKeywords?: boolean;
  AiVision?: { Overwrite?: boolean; MaxImages?: number };
};

export type DraftPipelineResult = {
  Draft: CreateDraftResponse;
  BlobUploadResult: unknown;
  AiVisionResult?: unknown;
  AiEmbeddingsResult?: unknown;
  AiKeywordsResult?: unknown;
};
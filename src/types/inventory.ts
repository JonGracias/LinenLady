// src/types/inventory.ts
//
// Casing convention:
//   - PascalCase = request body shapes sent TO the C# backend (must match C# DTO property names)
//   - camelCase  = everything else (responses from C#, internal TS types)
// test

export type InventoryItem = {
  inventoryId: number;
  sku: string;
  name: string;
  description?: string | null;
  quantityOnHand: number;
  unitPriceCents: number;
  publicId: string;
  isActive: boolean;
  isDraft: boolean;
  isDeleted: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  keywordsJson?: string | null;
  images?: {
    imageId: number;
    imagePath: string;
    isPrimary: boolean;
    sortOrder: number;
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

  getThumbnailUrl: (inventoryId: number) => string | null;
  ensureThumbnail: (inventoryId: number, ttlMinutes?: number) => void;

  getImages: (inventoryId: number) => InventoryImage[] | null;
  ensureImages: (inventoryId: number, ttlMinutes?: number) => void;
  refreshImages: (inventoryId: number, ttlMinutes?: number) => Promise<InventoryImage[]>;

  invalidateCache: () => void;
  invalidateFilterCache: (filter?: Filter) => void;
  reloadItems: () => void;
};

export type InventoryImage = {
  imageId: number;
  inventoryId?: number;
  imagePath: string;
  isPrimary: boolean;
  sortOrder: number;
  readUrl?: string | null;
};

// Response from C# — camelCase
export type DraftUpload = {
  index: number;
  blobName: string;
  uploadUrl: string;
  method: "PUT";
  requiredHeaders: Record<string, string>;
  contentType: string;
};

// Response from C# — camelCase
export type GetItemsResponse = {
  items: InventoryItem[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  status: string;
};

// REQUEST to C# — PascalCase to match C# DTO property names
export type CreateDraftRequest = {
  TitleHint?: string;
  Notes?: string;
  Files: { FileName: string; ContentType: string }[];
};

// Response from C# — camelCase
export type CreateDraftResponse = {
  inventoryId: number;
  publicId: string;
  sku: string;
  container: string;
  expiresOnUtc: string;
  uploads: DraftUpload[];
};

// REQUEST to C# — PascalCase to match C# DTO property names
export type AiPrefillRequest = {
  InventoryId: number;
  Overwrite?: boolean;
  MaxImages?: number;
  ImageIds?: number[];
  TitleHint?: string;
  Notes?: string;
};

// REQUEST to C# — PascalCase to match C# DTO property names
export type EmbeddingsRequest = {
  InventoryId: number;
  Opts?: { Purpose?: string; Force?: number };
};

// REQUEST to C# — PascalCase to match C# DTO property names
export type DraftPipelineOptions = {
  Keys?: { TitleHint?: string; Notes?: string; Files?: string };
  RunAiVision?: boolean;
  RunAiEmbeddings?: boolean;
  RunAiKeywords?: boolean;
  AiVision?: { Overwrite?: boolean; MaxImages?: number };
};

// Response from C# — camelCase
export type DraftPipelineResult = {
  draft: CreateDraftResponse;
  blobUploadResult: unknown;
  aiVisionResult?: unknown;
  aiEmbeddingsResult?: unknown;
  aiKeywordsResult?: unknown;
};

export type ItemUpdatedFields = {
  name: string;
  description: string;
  priceCents: number;
  quantity: number;
  isFeatured: boolean;
};

export type InventoryProps = {
  item:            InventoryItem;
  onPublishToggle: () => void;
  onDeleteOpen:    () => void;
  onItemUpdated:   (fields: ItemUpdatedFields) => Promise<void>;
};

// Response from C# — camelCase
export type SimilarItem = {
  inventoryId: number;
  publicId: string;
  name: string;
  description: string | null;
  unitPriceCents: number;
  isActive: boolean;
  isDraft: boolean;
  score: number;
};

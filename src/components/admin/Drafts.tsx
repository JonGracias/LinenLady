// src/components/admin/Drafts.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ImageCarousel from "@/components/admin/SlideShow";
import { DeleteModal } from "@/components/admin/modals/DeleteModal";
import { ImageEditorModal } from "@/components/admin/modals/ImageEditorModal";
import { ThumbnailStrip } from "@/components/admin/ThumbnailStrip";
import { ItemInfoBar } from "@/components/admin/ItemInfoBar";
import { ItemDetailsCard } from "@/components/admin/ItemDetailsCard";
import type { InventoryItem, InventoryImage } from "@/types/inventory";

type DraftProps = { inventoryId: number };

export default function Draft({ inventoryId }: DraftProps) {
  const router = useRouter();

  const [item, setItem]               = useState<InventoryItem | null>(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [itemError, setItemError]     = useState<string | null>(null);

  const [images, setImages]               = useState<InventoryImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen]         = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [settingPrimary, setSettingPrimary] = useState<number | null>(null);
  const [editorOpen, setEditorOpen]         = useState(false);
  const [addingPhotos, setAddingPhotos]     = useState(false);
  const [uploadError, setUploadError]       = useState<string | null>(null);

  const swiperRef = useRef<any>(null);
  const isValidId = Number.isFinite(inventoryId) && inventoryId > 0;

  /* ── Load item ── */
  useEffect(() => {
    if (!isValidId) return;
    let cancelled = false;

    async function load() {
      setItemLoading(true);
      setItemError(null);
      try {
        const res = await fetch(`/admin/api/items/${inventoryId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text() || `Failed (${res.status})`);
        const data = await res.json() as InventoryItem;
        if (!cancelled) setItem(data);
      } catch (e: unknown) {
        if (!cancelled) { setItem(null); setItemError(e instanceof Error ? e.message : "Failed to load item."); }
      } finally {
        if (!cancelled) setItemLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [inventoryId, isValidId]);

  /* ── Load images ── */
  useEffect(() => {
    if (!isValidId) return;
    let cancelled = false;

    async function loadImages() {
      try {
        const res = await fetch(`/admin/api/items/${inventoryId}/images?ttlMinutes=60`);
        if (!res.ok) return;
        const data = await res.json() as InventoryImage[];
        if (!cancelled) {
          const loaded = Array.isArray(data) ? data : [];
          setImages(loaded);
          const primary = loaded.find((x) => x.isPrimary);
          setActiveImageId(primary?.imageId ?? loaded[0]?.imageId ?? null);
        }
      } catch { /* non-fatal */ }
    }

    void loadImages();
    return () => { cancelled = true; };
  }, [inventoryId, isValidId]);

  /* ── PATCH helper ── */
  const patchItem = useCallback(async (body: Record<string, unknown>) => {
    try {
      const res = await fetch(`/admin/api/items/${inventoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return false;
      const updated = await res.json() as Partial<InventoryItem>;
      setItem((prev) => prev ? { ...prev, ...updated } : prev);
      return true;
    } catch { return false; }
  }, [inventoryId]);

  /* ── Item updated (from ItemDetailsCard / AiMetaPanel) ── */
  const handleItemUpdated = useCallback(async (fields: {
    name: string;
    description: string;
    priceCents: number;
    quantity: number;
    isFeatured: boolean;
  }) => {
    await patchItem({
      name:           fields.name,
      description:    fields.description,
      unitPriceCents: fields.priceCents,
      quantityOnHand: fields.quantity,
      isFeatured:     fields.isFeatured,
    });
  }, [patchItem]);

  /* ── Delete item ── */
  const handleDelete = useCallback(async () => {
    if (!item) return;
    setDeleting(true);
    try {
      const res = await fetch(`/admin/api/items/${inventoryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text() || `Delete failed (${res.status})`);
      router.push("/admin/items");
      router.refresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete item.");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }, [inventoryId, item, router]);

  /* ── Primary image ── */
  const primaryImageId = images.find((x) => x.isPrimary)?.imageId ?? null;

  const handleSetPrimary = useCallback(async (imageId: number) => {
    if (settingPrimary !== null || imageId === primaryImageId) return;
    setSettingPrimary(imageId);
    try {
      const res = await fetch(`/admin/api/items/${inventoryId}/images/${imageId}/primary`, { method: "PATCH" });
      if (!res.ok) return;
      setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.imageId === imageId })));
    } catch { /* non-fatal */ }
    finally { setSettingPrimary(null); }
  }, [inventoryId, primaryImageId, settingPrimary]);

  /* ── Save edited image ── */
  const handleSaveEditedImage = useCallback(async (blob: Blob) => {
    if (!activeImageId) return;
    const formData = new FormData();
    formData.append("file", blob, "edited.jpg");
    const res = await fetch(
      `/admin/api/items/${inventoryId}/images/${activeImageId}/replace`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const { readUrl } = await res.json() as { readUrl: string | null };
    if (readUrl) {
      setImages((prev) =>
        prev.map((img) => img.imageId === activeImageId ? { ...img, readUrl } : img)
      );
    }
  }, [inventoryId, activeImageId]);

  /* ── Add photos ── */
  const handleAddPhotos = useCallback(async (files: FileList) => {
    if (!files.length) return;
    setAddingPhotos(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) formData.append("file", file);

      const res = await fetch(`/admin/api/items/${inventoryId}/images/add`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "") || `Upload failed (${res.status})`);

      const { images: freshImages } = await res.json() as { images: InventoryImage[] };
      if (Array.isArray(freshImages) && freshImages.length > 0) {
        setImages(freshImages);
        setActiveImageId(freshImages[freshImages.length - 1].imageId);
      }
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setAddingPhotos(false);
    }
  }, [inventoryId]);

  /* ── Delete image ── */
  const handleDeleteImage = useCallback(async (imageId: number) => {
    try {
      const res = await fetch(`/admin/api/items/${inventoryId}/images/${imageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text().catch(() => "") || `Delete failed (${res.status})`);
      setImages((prev) => {
        const next = prev.filter((img) => img.imageId !== imageId);
        if (activeImageId === imageId) setActiveImageId(next[0]?.imageId ?? null);
        return next;
      });
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Delete failed.");
    }
  }, [inventoryId, activeImageId]);

  /* ── Thumbnail click ── */
  const slidesWithUrl = useMemo(
    () => images.filter((img): img is InventoryImage & { readUrl: string } =>
      typeof img.readUrl === "string" && img.readUrl.length > 0),
    [images],
  );

  const handleThumbnailClick = useCallback((imageId: number) => {
    setActiveImageId(imageId);
    const idx = slidesWithUrl.findIndex((img) => img.imageId === imageId);
    if (idx !== -1 && swiperRef.current) swiperRef.current.slideTo(idx);
  }, [slidesWithUrl]);

  /* ── Loading / error states ── */
  if (itemLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
        <p className="text-gray-500 dark:text-gray-400">Loading item...</p>
      </div>
    </div>
  );

  if (itemError) return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-gray-800 p-8 text-center">
      <div className="mb-4 text-5xl">⚠️</div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Error Loading Item</h2>
      <p className="text-red-600 dark:text-red-400">{itemError}</p>
    </div>
  );

  if (!item) return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-gray-800 p-8 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Item Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400">No item exists with ID {inventoryId}.</p>
    </div>
  );

  const activeImage = slidesWithUrl.find((img) => img.imageId === activeImageId) ?? null;

  return (
    <>
      {/* Carousel */}
      <div className="swiper-fill my-3 aspect-video overflow-hidden rounded-xl bg-black">
        <ImageCarousel images={images} onSwiper={(swiper: any) => { swiperRef.current = swiper; }} />
      </div>

      {/* Thumbnail strip */}
      <ThumbnailStrip
        images={images}
        activeImageId={activeImageId}
        primaryImageId={primaryImageId}
        addingPhotos={addingPhotos}
        uploadError={uploadError}
        settingPrimary={settingPrimary}
        onThumbnailClick={handleThumbnailClick}
        onSetPrimary={handleSetPrimary}
        onEditImage={() => setEditorOpen(true)}
        onAddPhotos={handleAddPhotos}
        onDeleteImage={handleDeleteImage}
      />

      {/* Info bar */}
      <ItemInfoBar item={item} />

      {/* Details card */}
      <ItemDetailsCard
        item={item}
        onPublishToggle={() => patchItem({ isActive: !item.isActive })}
        onDeleteOpen={() => setDeleteOpen(true)}
        onItemUpdated={handleItemUpdated}
      />

      {/* Delete item modal */}
      <DeleteModal
        open={deleteOpen}
        itemName={item.name}
        deleting={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      {/* Image editor modal */}
      {activeImage && (
        <ImageEditorModal
          open={editorOpen}
          imageUrl={activeImage.readUrl}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveEditedImage}
        />
      )}
    </>
  );
}
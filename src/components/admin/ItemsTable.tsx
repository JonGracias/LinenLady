// src/components/admin/ItemsTable.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useInventoryContext } from "@/context/InventoryContext";
import type { InventoryItem } from "@/types/inventory";
import { AdminPagination } from "./Pagination";

function money(cents: number) {
  const dollars = (cents ?? 0) / 100;
  return dollars.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function AdminItemsTable() {
  const {
    items,
    loading,
    error,
    ensureThumbnail,
    getThumbnailUrl,
    pageSize,
    page,
    totalCount
  } = useInventoryContext();

  useEffect(() => {
    for (const x of items) {
      ensureThumbnail(x.inventoryId);
    }
  }, [items, ensureThumbnail]);

  const ROW_HEIGHT    = 102;
  const HEADER_HEIGHT = 56;
  const tableBodyHeight = ROW_HEIGHT * pageSize;
  const emptyRowsCount  = Math.max(0, pageSize - items.length);
  const emptyRows       = Array.from({ length: emptyRowsCount }, (_, i) => i);

  // const gridColsDesktop = "50px 80px 1fr 120px 100px 120px";
  // const gridColsMobile  = "40px 60px 1fr";

  const gridColsDesktop =
    "40px 80px minmax(0, 2fr) 120px 80px 120px";
  const gridColsMobile =
    "40px 64px minmax(0, 1fr)";
  const gridHeaderDesktop =
    "40px 80px minmax(0, 2fr) 120px 80px 120px 10px";
  const gridHeaderMobile =
    "40px 64px minmax(0, 1fr) 5px";

  const headerCell = "flex items-center justify-center px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";
  const itemCell   = "px-4 py-4 text-gray-700 dark:text-gray-300 flex items-center justify-center";
  
  function DesktopHeader() {
    return (
      <div
        className="md:grid hidden bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
        style={{ gridTemplateColumns: gridHeaderDesktop, height: `${HEADER_HEIGHT}px` }}
      >
        <div className={headerCell}>#</div>
        <div className={headerCell}>Thumb</div>
        <div className={headerCell}>Name</div>
        <div className={headerCell}>Status</div>
        <div className={headerCell}>Qty</div>
        <div className={headerCell}>Price</div>
        <div className={headerCell}></div>
      </div>
    );
  }

  function MobileHeader() {
    return (
      <div
        className="grid md:hidden bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
        style={{ gridTemplateColumns: gridHeaderMobile, height: `${HEADER_HEIGHT}px` }}
      >
        <div className={headerCell}>#</div>
        <div className={headerCell}>Thumb</div>
        <div className={headerCell}>Name</div>
        <div className={headerCell}></div>
      </div>
    );
  }

  function DesktopRow({ x, rowNum }: { x: InventoryItem; rowNum: number }) {
    const status = x.isDraft ? "Draft" : x.isActive ? "Published" : "Unpublished";
    const statusColor = x.isDraft
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
      : x.isActive
        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
        : "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300";
    const thumbUrl = getThumbnailUrl(x.inventoryId);

    return (
      <Link href={`/admin/drafts/${x.inventoryId}`} className="block">
        <div className="grid border-b border-gray-100 dark:border-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
             style={{ gridTemplateColumns: gridColsDesktop, height: `${ROW_HEIGHT}px` }}>

          <div className={itemCell}>
            {rowNum}
          </div>

          <div className={itemCell}>
            {thumbUrl ? (
              <img src={thumbUrl} alt="" className="h-12 w-12 rounded border border-gray-200 dark:border-gray-600 object-cover" loading="lazy" />
            ) : (
              <div className="h-12 w-12 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" />
            )}
          </div>

          <div className={itemCell}>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap w-full font-medium justify-start items-start">
              {x.name}
            </div>
          </div>

          <div className={itemCell}>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
              {status}
            </span>
          </div>

          <div className={itemCell}>
            {x.quantityOnHand}
          </div>

          <div className={itemCell}>
            <div className="font-semibold">
              {money(x.unitPriceCents)}
            </div>
          </div>

        </div>
      </Link>
    );
  }

  function MobileRow({ x, rowNum }: { x: InventoryItem; rowNum: number }) {
    const status = x.isDraft ? "Draft" : x.isActive ? "Published" : "Unpublished";
    const statusColor = x.isDraft
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
      : x.isActive
        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
        : "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300";
    const thumbUrl = getThumbnailUrl(x.inventoryId);

    return (
      <Link href={`/admin/drafts/${x.inventoryId}`} className="block">
        <div
          className="grid border-b border-gray-100 dark:border-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
          style={{ gridTemplateColumns: gridColsMobile, height: `${ROW_HEIGHT}px` }}
        >
          <div className="px-2 py-3 text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center">
            {rowNum}
          </div>
          <div className="px-3 py-3 flex items-center justify-center">
            {thumbUrl ? (
              <img src={thumbUrl} alt="" className="h-12 w-12 rounded border border-gray-200 dark:border-gray-600 object-cover" loading="lazy" />
            ) : (
              <div className="h-12 w-12 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" />
            )}
          </div>
          <div className="px-3 py-3 flex flex-col justify-center">
            <div className="font-medium text-gray-900 dark:text-gray-100 overflow-hidden text-ellipsis whitespace-nowrap">
              {x.name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>
                {status}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{money(x.unitPriceCents)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // --- LOADING ---
  if (loading) {
    return (
      <div className="w-full h-full rounded-t-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <DesktopHeader />
        <MobileHeader />
        <div className="flex items-center justify-center" style={{ height: `${tableBodyHeight}px` }}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading items...</p>
        </div>
      </div>
    );
  }

  // --- ERROR ---
  if (error) {
    return (
      <div className="w-full h-full rounded-t-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 shadow-sm">
        <DesktopHeader />
        <MobileHeader />
        <div className="flex items-center justify-center" style={{ height: `${tableBodyHeight}px` }}>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // --- LIST ---
  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex-shrink-0">
        <DesktopHeader />
        <MobileHeader />
      </div>

      <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {/* No Items */}
        {items.length === 0 ? (
          <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 py-12">
            No items found for this filter.
          </div>
        ) : (

          <>
            {/* Items */}
            <div className="hidden md:block">
              {items.map((x, i) => <DesktopRow key={x.inventoryId} x={x} rowNum={totalCount - (page - 1) * pageSize - i} />)}
              {emptyRows.map((i) => (
                <div
                  key={`empty-${i}`}
                  className="grid border-b border-transparent"
                  style={{ gridTemplateColumns: gridColsDesktop, height: `${ROW_HEIGHT}px` }}
                >
                  {/* Empty Rows for consistent Height */}
                  <div /><div /><div /><div /><div /><div />
                </div>
              ))}
            </div>
            <div className="md:hidden">
              {items.map((x, i) => <MobileRow key={x.inventoryId} x={x} rowNum={totalCount - (page - 1) * pageSize - i} />)}
            </div>
          </>

        )}
      </div>

      <div className="flex-shrink-0">
        <AdminPagination />
      </div>
    </div>
  );
}
// src/components/admin/ItemsTable.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useInventoryContext } from "@/context/InventoryContext";
import type { InventoryItem } from "@/types/inventory";

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
  } = useInventoryContext();

  // Fetch thumbs for the items on the current page (only)
  useEffect(() => {
    for (const x of items) {
      ensureThumbnail(x.InventoryId);
    }
  }, [items, ensureThumbnail]);

  // Fixed row height in pixels
  const ROW_HEIGHT = 72; // Height of each table row
  const HEADER_HEIGHT = 56; // Height of the table header
  
  // Calculate fixed table body height based on pageSize
  const tableBodyHeight = ROW_HEIGHT * pageSize;
  const totalTableHeight = HEADER_HEIGHT + tableBodyHeight;

  // Create empty rows to fill remaining space if needed
  const emptyRowsCount = Math.max(0, pageSize - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

  // Grid template columns - Desktop view (no ID or actions column)
  const gridColsDesktop = "80px 1fr 120px 100px 120px";
  // Mobile view - just thumb and name
  const gridColsMobile = "60px 1fr";


  // LOADING
  if (loading) {
    return (
      <div 
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        style={{ height: `${totalTableHeight}px` }}
      >
        {/* Header - Desktop */}
        <div 
          className="hidden md:grid bg-gray-100 border-b border-gray-200"
          style={{ 
            gridTemplateColumns: gridColsDesktop,
            height: `${HEADER_HEIGHT}px`
          }}
        >
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Thumb</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-left flex items-center">Name</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Status</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Quantity</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Price</div>
        </div>

        {/* Header - Mobile */}
        <div 
          className="grid md:hidden bg-gray-100 border-b border-gray-200"
          style={{ 
            gridTemplateColumns: gridColsMobile,
            height: `${HEADER_HEIGHT}px`
          }}
        >
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Thumb</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-left flex items-center">Name</div>
        </div>
        
        {/* Loading Body */}
        <div 
          className="flex items-center justify-center"
          style={{ height: `${tableBodyHeight}px` }}
        >
          <p className="text-sm text-gray-600">Loading items...</p>
        </div>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div 
        className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm"
        style={{ height: `${totalTableHeight}px` }}
      >
        {/* Header - Desktop */}
        <div 
          className="hidden md:grid bg-gray-100 border-b border-gray-200"
          style={{ 
            gridTemplateColumns: gridColsDesktop,
            height: `${HEADER_HEIGHT}px`
          }}
        >
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Thumb</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-left flex items-center">Name</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Status</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Quantity</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Price</div>
        </div>

        {/* Header - Mobile */}
        <div 
          className="grid md:hidden bg-gray-100 border-b border-gray-200"
          style={{ 
            gridTemplateColumns: gridColsMobile,
            height: `${HEADER_HEIGHT}px`
          }}
        >
          <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Thumb</div>
          <div className="px-4 py-4 font-semibold text-gray-700 text-left flex items-center">Name</div>
        </div>
        
        {/* Error Body */}
        <div 
          className="flex items-center justify-center"
          style={{ height: `${tableBodyHeight}px` }}
        >
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // List
  return (
    <div 
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:h-auto"
      style={{ height: totalTableHeight }}
    >
      {/* Header - Desktop */}
      <div 
        className="hidden md:grid bg-gray-100 border-b border-gray-200"
        style={{ 
          gridTemplateColumns: gridColsDesktop,
          height: `${HEADER_HEIGHT}px`
        }}
      >
        <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Thumb</div>
        <div className="px-4 py-4 font-semibold text-gray-700 text-left flex items-center">Name</div>
        <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Status</div>
        <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Quantity</div>
        <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Price</div>
      </div>

      {/* Header - Mobile */}
      <div 
        className="grid md:hidden bg-gray-100 border-b border-gray-200 sticky top-0 z-10"
        style={{ 
          gridTemplateColumns: gridColsMobile,
          height: `${HEADER_HEIGHT}px`
        }}
      >
        <div className="px-4 py-4 font-semibold text-gray-700 text-center flex items-center justify-center">Thumb</div>
        <div className="px-4 py-4 font-semibold text-gray-700 text-left flex items-center">Name</div>
      </div>

      {/* Body - Desktop (fixed height) */}
      <div className="hidden md:block" style={{ height: `${tableBodyHeight}px` }}>
        {items.length === 0 ? (
          <div 
            className="flex items-center justify-center text-gray-500"
            style={{ height: `${tableBodyHeight}px` }}
          >
            No items found for this filter.
          </div>
        ) : (
          <>
            {items.map((x: InventoryItem) => {
              const status = x.IsDraft ? "Draft" : x.IsActive ? "Published" : "Unpublished";
              const statusColor = x.IsDraft
                ? "bg-yellow-100 text-yellow-800"
                : x.IsActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800";

              const thumbUrl = getThumbnailUrl(x.InventoryId);

              return (
                <Link
                  key={x.InventoryId}
                  href={`/admin/drafts/${x.InventoryId}`}
                  className="block"
                >
                  <div
                    className="grid border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
                    style={{ 
                      gridTemplateColumns: gridColsDesktop,
                      height: `${ROW_HEIGHT}px`
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="px-4 py-3 flex items-center justify-center">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt=""
                          className="h-12 w-12 rounded border object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded border bg-gray-100" />
                      )}
                    </div>

                    {/* Name */}
                    <div className="px-4 py-4 font-medium text-gray-900 flex items-center">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                        {x.Name}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="px-4 py-4 flex items-center justify-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                        {status}
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="px-4 py-4 text-gray-900 flex items-center justify-center">
                      {x.QuantityOnHand}
                    </div>

                    {/* Price */}
                    <div className="px-4 py-4 font-semibold text-gray-900 flex items-center justify-center">
                      {money(x.UnitPriceCents)}
                    </div>
                  </div>
                </Link>
              );
            })}
            
            {/* Empty rows to maintain consistent height */}
            {emptyRows.map((i) => (
              <div
                key={`empty-${i}`}
                className="grid border-b border-transparent"
                style={{ 
                  gridTemplateColumns: gridColsDesktop,
                  height: `${ROW_HEIGHT}px`
                }}
              >
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Body - Mobile (scrollable) */}
      <div className="md:hidden overflow-y-auto" style={{ maxHeight: `calc(100dvh - 350px)` }}>
        {items.length === 0 ? (
          <div 
            className="flex items-center justify-center text-gray-500 py-12"
          >
            No items found for this filter.
          </div>
        ) : (
          <>
            {items.map((x: InventoryItem) => {
              const status = x.IsDraft ? "Draft" : x.IsActive ? "Published" : "Unpublished";
              const statusColor = x.IsDraft
                ? "bg-yellow-100 text-yellow-800"
                : x.IsActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800";

              const thumbUrl = getThumbnailUrl(x.InventoryId);

              return (
                <Link
                  key={x.InventoryId}
                  href={`/admin/drafts/${x.InventoryId}`}
                  className="block"
                >
                  <div
                    className="grid border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
                    style={{ 
                      gridTemplateColumns: gridColsMobile,
                      height: `${ROW_HEIGHT}px`
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="px-3 py-3 flex items-center justify-center">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt=""
                          className="h-12 w-12 rounded border object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded border bg-gray-100" />
                      )}
                    </div>

                    {/* Name with Status and Price below */}
                    <div className="px-3 py-3 flex flex-col justify-center">
                      <div className="font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
                        {x.Name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>
                          {status}
                        </span>
                        <span className="text-xs text-gray-600">
                          {money(x.UnitPriceCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
// src/components/admin/AdminItemsTable.tsx
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
    sorted: items,
    loading,
    error,
    ensureThumbnail,
    getThumbnailUrl,
  } = useInventoryContext();

  // Fetch thumbs for the items on the current page (only)
  useEffect(() => {
    for (const x of items) {
      ensureThumbnail(x.InventoryId);
    }
  }, [items, ensureThumbnail]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-600 shadow-sm">
        Loading items...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-sm text-red-700 shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr className="[&>th]:px-6 [&>th]:py-4 [&>th]:font-semibold [&>th]:text-gray-700">
            <th>Thumb</th>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Quantity</th>
            <th>Price</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <tr>
              <td className="px-6 py-12 text-center text-gray-500" colSpan={8}>
                No items found for this filter.
              </td>
            </tr>
          ) : (
            items.map((x: InventoryItem) => {
              const status = x.IsDraft ? "Draft" : x.IsActive ? "Published" : "Unpublished";
              const statusColor = x.IsDraft
                ? "bg-yellow-100 text-yellow-800"
                : x.IsActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800";

              const thumbUrl = getThumbnailUrl(x.InventoryId);

              return (
                <tr key={x.InventoryId} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="h-10 w-10 rounded border object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded border bg-gray-100" />
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{x.InventoryId}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{x.Name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{x.QuantityOnHand}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{money(x.UnitPriceCents)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/drafts/${x.InventoryId}`}
                      className="inline-flex rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

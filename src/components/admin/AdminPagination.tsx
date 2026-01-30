// src/components/admin/AdminPagination.tsx
"use client";

import { useInventoryContext } from "@/context/InventoryContext";

export function AdminPagination() {
  const { currentPage, setCurrentPage, totalPages, visibleItems, pageSize } =
    useInventoryContext();

  // No items: render nothing (keeps UI clean and avoids "Showing 1 to 0 of 0")
  if (visibleItems.length === 0) return null;

  // One page: render nothing (same as before)
  if (totalPages <= 1) return null;

  const offset = (currentPage - 1) * pageSize;

  // Clamp to avoid weirdness if currentPage is briefly out of range
  const startItem = Math.min(offset + 1, visibleItems.length);
  const endItem = Math.min(offset + pageSize, visibleItems.length);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 rounded-lg">
      {/* Mobile pagination */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          onClick={() => canPrev && setCurrentPage(currentPage - 1)}
          className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
            !canPrev ? "pointer-events-none text-gray-400" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => canNext && setCurrentPage(currentPage + 1)}
          className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
            !canNext ? "pointer-events-none text-gray-400" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Next
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{visibleItems.length}</span> items
          </p>
        </div>

        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => canPrev && setCurrentPage(currentPage - 1)}
              className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 ${
                !canPrev
                  ? "pointer-events-none text-gray-400 bg-gray-100"
                  : "text-gray-900 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 ${
                  p === currentPage
                    ? "z-10 bg-blue-600 text-white ring-blue-600"
                    : "text-gray-900 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => canNext && setCurrentPage(currentPage + 1)}
              className={`relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 ${
                !canNext
                  ? "pointer-events-none text-gray-400 bg-gray-100"
                  : "text-gray-900 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useInventoryContext } from "@/context/InventoryContext";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AdminPagination() {
  const { page, setPage, totalPages, pageSize, setPageSize, totalCount } =
    useInventoryContext();

  const [pageSizeDraft, setPageSizeDraft] = useState(String(pageSize));

  useEffect(() => {
    setPageSizeDraft(String(pageSize));
  }, [pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Fixed number of page buttons to show (always 5)
  const MAX_VISIBLE_PAGES = 5;
  
  function getVisiblePages() {
    const pages: number[] = [];
    
    if (totalPages <= MAX_VISIBLE_PAGES) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      // Fill remaining slots with null to maintain fixed width
      while (pages.length < MAX_VISIBLE_PAGES) {
        pages.push(0); // 0 represents empty slot
      }
    } else {
      // Show window around current page
      let start = Math.max(1, page - Math.floor(MAX_VISIBLE_PAGES / 2));
      let end = start + MAX_VISIBLE_PAGES - 1;
      
      if (end > totalPages) {
        end = totalPages;
        start = end - MAX_VISIBLE_PAGES + 1;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  const visiblePages = getVisiblePages();

  function goToPage(p: number) {
    if (p >= 1 && p <= totalPages) setPage(p);
  }

  function commitPageSize() {
    const n = Number(pageSizeDraft);
    if (!Number.isFinite(n)) {
      setPageSizeDraft(String(pageSize));
      return;
    }
    const next = clamp(Math.trunc(n), 1, 200);

    if (next !== pageSize) {
      setPageSize(next);
      setPage(1);
    } else {
      setPageSizeDraft(String(pageSize));
    }
  }

  function onPageSizeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitPageSize();
    }
  }

  if (totalCount === 0) return null;
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 rounded-lg">
      {/* Info row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">{startItem}</span> - {" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalCount}</span>
        </p>

        {/* Page size input */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Per page</label>
          <input
            value={pageSizeDraft}
            onChange={(e) => setPageSizeDraft(e.target.value)}
            onKeyDown={onPageSizeKeyDown}
            onBlur={commitPageSize}
            inputMode="numeric"
            className="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Fixed-width pagination bar */}
      <div className="flex items-center justify-center gap-2">
        {/* Previous button - fixed position */}
        <button
          type="button"
          onClick={() => canPrev && setPage(page - 1)}
          disabled={!canPrev}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
            canPrev
              ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
          }`}
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Fixed number of page buttons */}
        <div className="flex items-center gap-1">
          {visiblePages.map((pageNum, idx) => {
            // Empty slot to maintain fixed width
            if (pageNum === 0) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="w-10 h-10"
                  aria-hidden="true"
                />
              );
            }

            const isCurrent = pageNum === page;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => goToPage(pageNum)}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border font-medium text-sm transition-colors ${
                  isCurrent
                    ? "border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500 text-white"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button - fixed position */}
        <button
          type="button"
          onClick={() => canNext && setPage(page + 1)}
          disabled={!canNext}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
            canNext
              ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
          }`}
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Optional: Page indicator for small screens */}
      <div className="mt-3 text-center md:hidden">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>
      </div>
    </div>
  );
}
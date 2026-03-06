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
  const endItem   = Math.min(page * pageSize, totalCount);

  function getVisiblePages(max: number) {
    const pages: number[] = [];
    if (totalPages <= max) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - Math.floor(max / 2));
      let end   = start + max - 1;
      if (end > totalPages) {
        end   = totalPages;
        start = end - max + 1;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  const mobilePages  = getVisiblePages(3);
  const desktopPages = getVisiblePages(5);

  function goToPage(p: number) {
    if (p >= 1 && p <= totalPages) setPage(p);
  }

  function commitPageSize() {
    const n = Number(pageSizeDraft);
    if (!Number.isFinite(n)) { setPageSizeDraft(String(pageSize)); return; }
    const next = clamp(Math.trunc(n), 1, 200);
    if (next !== pageSize) { setPageSize(next); setPage(1); }
    else setPageSizeDraft(String(pageSize));
  }

  function onPageSizeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); commitPageSize(); }
  }

  if (totalCount === 0) return null;
  if (totalPages <= 1)  return null;

  const navBtn = (enabled: boolean) =>
    `flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 ${
      enabled
        ? "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white active:scale-95"
        : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
    }`;

  return (
    <div className="w-full border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl px-4 py-3">
      <div className="flex items-center justify-between">

        {/* Count */}
        <span className="text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
          {startItem}–{endItem} of {totalCount}
        </span>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => canPrev && setPage(page - 1)}
            disabled={!canPrev}
            className={navBtn(canPrev)}
            aria-label="Previous page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobile: 3 pages */}
          <div className="flex md:hidden items-center gap-0.5">
            {mobilePages.map((pageNum) => {
              const isCurrent = pageNum === page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => goToPage(pageNum)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isCurrent
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white active:scale-95"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          {/* Desktop: 5 pages */}
          <div className="hidden md:flex items-center gap-0.5">
            {desktopPages.map((pageNum) => {
              const isCurrent = pageNum === page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => goToPage(pageNum)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isCurrent
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white active:scale-95"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => canNext && setPage(page + 1)}
            disabled={!canNext}
            className={navBtn(canNext)}
            aria-label="Next page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Per page */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-gray-400 dark:text-gray-500">per page</label>
          <input
            value={pageSizeDraft}
            onChange={(e) => setPageSizeDraft(e.target.value)}
            onKeyDown={onPageSizeKeyDown}
            onBlur={commitPageSize}
            inputMode="numeric"
            className="w-10 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-600 dark:text-gray-300 text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
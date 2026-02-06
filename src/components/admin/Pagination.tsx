"use client";

import { useEffect, useMemo, useState } from "react";
import { useInventoryContext } from "@/context/InventoryContext";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AdminPagination() {
  const { page, setPage, totalPages, pageSize, setPageSize, totalCount } =
    useInventoryContext();

  // Hooks must run on every render (no early returns before these)
  const [pageSizeDraft, setPageSizeDraft] = useState(String(pageSize));

  // Keep draft in sync if pageSize changes elsewhere
  useEffect(() => {
    setPageSizeDraft(String(pageSize));
  }, [pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const pageNumbers = useMemo(() => {
    const delta = 2; // show +/- 1 around current
    const range: (number | string)[] = [];
    const out: (number | string)[] = [];

    range.push(1);

    for (let i = page - delta; i <= page + delta; i++) {
      if (i > 1 && i < totalPages) range.push(i);
    }

    if (totalPages > 1) range.push(totalPages);

    let prev = 0;
    for (const x of range) {
      if (typeof x === "number") {
        if (prev && x - prev > 1) out.push("...");
        out.push(x);
        prev = x;
      }
    }
    return out;
  }, [page, totalPages]);

  function goToPage(p: number) {
    if (p >= 1 && p <= totalPages) setPage(p);
  }

  function commitPageSize() {
    const n = Number(pageSizeDraft);
    if (!Number.isFinite(n)) {
      setPageSizeDraft(String(pageSize)); // revert
      return;
    }
    const next = clamp(Math.trunc(n), 1, 200);

    if (next !== pageSize) {
      setPageSize(next);
      setPage(1); // safe: avoids landing on an out-of-range page after size change
    } else {
      setPageSizeDraft(String(pageSize)); // normalize formatting
    }
  }

  function onPageSizeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitPageSize();
    }
  }

  // Early returns AFTER hooks
  if (totalCount === 0) return null;
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{startItem}</span> - {" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalCount}</span>
        </p>

        {/* Page size: requires Enter to apply */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Per page</label>
          <input
            value={pageSizeDraft}
            onChange={(e) => setPageSizeDraft(e.target.value)}
            onKeyDown={onPageSizeKeyDown}
            inputMode="numeric"
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

      </div>

      <div className="flex items-center justify-left">
        <nav
          className="isolate inline-flex -space-x-px rounded-md shadow-sm"
          aria-label="Pagination">


          <div>
            <button
              type="button"
              onClick={() => canPrev && setPage(page - 1)}
              disabled={!canPrev}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                !canPrev ? "cursor-not-allowed bg-gray-100" : "bg-white"
              }`}>
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => canNext && setPage(page + 1)}
              disabled={!canNext}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                !canNext ? "cursor-not-allowed bg-gray-100" : "bg-white"
              }`}>
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>











          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 bg-white"
                >
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isCurrent = pageNum === page;

            return (
             < button
                key={pageNum}
                type="button"
                onClick={() => goToPage(pageNum)}
                aria-current={isCurrent ? "page" : undefined}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${
                  isCurrent
                    ? "z-10 bg-blue-600 text-white ring-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    : "bg-white text-gray-900 hover:bg-gray-50"
                }`}>
                {pageNum}
              </button>
            );
          })}


        </nav>




      </div>
    </div>
  );
}

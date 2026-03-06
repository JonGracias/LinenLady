// src/components/admin/modals/ManualEditModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface ManualEditModalProps {
  open: boolean;
  name: string;
  description: string;
  priceCents: number;
  onClose: () => void;
  onSave: (fields: { name: string; description: string; priceCents: number }) => void;
}

function centsFromInput(val: string): number | null {
  const n = parseFloat(val);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function ManualEditModal({
  open, name, description, priceCents, onClose, onSave,
}: ManualEditModalProps) {
  const [draftName,  setDraftName]  = useState(name);
  const [draftDesc,  setDraftDesc]  = useState(description);
  const [draftPrice, setDraftPrice] = useState((priceCents / 100).toFixed(2));
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraftName(name);
      setDraftDesc(description);
      setDraftPrice((priceCents / 100).toFixed(2));
    }
  }, [open, name, description, priceCents]);

  if (!open) return null;

  const handleSave = () => {
    const cents = centsFromInput(draftPrice);
    onSave({
      name:        draftName,
      description: draftDesc,
      priceCents:  cents ?? priceCents,
    });
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="w-full sm:max-w-lg rounded-t-xl sm:rounded-xl border border-gray-700 bg-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-3.5 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-base font-semibold text-gray-100">Edit Item</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 transition-colors hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">
              Title
            </label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Item title…"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">
              Description
            </label>
            <textarea
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              rows={6}
              className="w-full resize-y rounded-lg border border-gray-600 bg-gray-700/50 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Item description…"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draftPrice}
              onChange={(e) => setDraftPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-3.5 py-2.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-700 px-5 py-4 sticky bottom-0 bg-gray-800">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
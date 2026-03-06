"use client";

import { useRef } from "react";

interface DeleteModalProps {
  open: boolean;
  itemName: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ open, itemName, deleting, onClose, onConfirm }: DeleteModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="w-full sm:max-w-md rounded-t-xl sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-5 py-3.5">
          <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Delete Item</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5 h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-200 text-sm leading-relaxed">
              This will <span className="font-semibold text-red-600 dark:text-red-400">delete</span>{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">&ldquo;{itemName}&rdquo;</span>.
              The item will no longer appear on the site.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 px-5 py-4">
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            )}
            {deleting ? "Deleting…" : "Delete Forever"}
          </button>
        </div>
      </div>
    </div>
  );
}
// src/app/admin/page.tsx
"use client";

import Link from "next/link";
import { AdminFilters } from "@/components/admin/Filters";
import { AdminPagination } from "@/components/admin/Pagination";
import { AdminItemsTable } from "@/components/admin/ItemsTable";

export default function AdminPage() {
  return (
    <main className="
          flex flex-col items-center justify-center text-center
          h-auto
          w-full
          overflow-hidden">

      <div className="mx-auto mt-[4dvh] max-w-7xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-2 text-base">Manage your inventory items</p>
          </div>

          <Link
            href="/admin/intake"
            className="rounded-lg bg-blue-600 px-5 py-2.5 
                       text-sm font-semibold text-white
                       shadow-sm hover:bg-blue-700
                       transition-colors"
          >
            + New Intake
          </Link>
        </div>

        <div className="mt-8">
          <AdminFilters />
        </div>

        <div className="mt-6">
          <AdminItemsTable />
        </div>

        <AdminPagination />
      </div>
    </main>
  );
}

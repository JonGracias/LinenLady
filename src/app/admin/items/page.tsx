import Link from "next/link";
import { AdminFilters } from "@/components/admin/Filters";
import { AdminItemsTable } from "@/components/admin/ItemsTable";

export default function AdminPage() {
  return (
    <main className="w-full h-[92dvh] px-4 md:px-8 flex flex-col overflow-hidden">


      {/* Filters */}
      <div className="flex items-center justify-between w-full mt-4 flex-shrink-0">
        <AdminFilters />
      </div>

      {/*  AdminPage.tsx */}
      <div className="mt-5 flex-1 min-h-0">
        <AdminItemsTable />
      </div>

      {/* Mobile only - New Intake button below pagination */}
      <div className="md:hidden flex-shrink-0 mt-4 mb-4  overflow-hidden rounded-b-xl">
        <Link
          href="/admin/intake"
          className="flex items-center justify-center w-full rounded-xl
                     bg-blue-600 px-4 py-4 text-base font-bold text-white
                     shadow-lg hover:bg-blue-700 active:bg-blue-800
                     transition-colors"
        >
          + New Intake
        </Link>
      </div>

    </main>
  );
}
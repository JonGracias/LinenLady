// src/app/admin/layout.tsx
import AdminHeader from "@/components/admin/AdminHeader";
import { InventoryProvider } from "@/context/InventoryContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <InventoryProvider>
      <div className="min-h-dvh bg-white text-black dark:bg-gray-900 dark:text-gray-100">
        <div className="p-3 sm:p-4 md:p-6 sm:mx-8">
          <div className="mx-auto max-w-3xl">
            <AdminHeader />
            {children}
          </div>
        </div>
      </div>
    </InventoryProvider>
  );
}
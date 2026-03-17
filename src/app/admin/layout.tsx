// src/app/admin/layout.tsx
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-3 bg-white text-black dark:bg-gray-900 dark:text-gray-100 sm:p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <AdminHeader />
        {children}
      </div>
    </div>
  );
}
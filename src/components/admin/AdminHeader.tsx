// src/components/admin/AdminHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinenLadyLogo } from "@/components/admin/Logo";

const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";

const NAV = [
  { href: "/admin/items",  label: "Inventory" },
  { href: "/admin/hero",   label: "Banner"      },
  { href: "/admin/media",  label: "Media"     },
];

const AdminHeader = () => {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between gap-6 px-4 md:px-8 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Wordmark */}
      <Link href={`${base}/admin`} className="flex items-center gap-2 shrink-0">
        <span className="text-xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">
          <LinenLadyLogo />
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {NAV.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={[
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminHeader;
import Link from "next/link";
import { LinenLadyLogo } from "@/components/admin/Logo";

const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";

const AdminHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <Link href={`${base}/admin/items`} className="flex items-center gap-2">
        <span className="text-xl font-semibold tracking-tight text-gra text-gray-800 dark:text-white">
          <LinenLadyLogo/>
        </span>
      </Link>
    </div>
  );
};

export default AdminHeader;
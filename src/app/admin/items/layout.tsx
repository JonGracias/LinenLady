import Link from "next/link";
import ContextProvider from "@/context/ContextProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ContextProvider>
      <div className="min-h-screen">
        <div className="mx-auto max-w-5xl">{children}</div>
      </div>
    </ContextProvider>
  );
}

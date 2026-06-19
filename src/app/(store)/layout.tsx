// src/app/(store)/layout.tsx
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] h-dvh overflow-hidden">
      <div className="sm:mx-8 h-full">
        <div className="flex flex-col h-full mx-auto max-w-7xl">
          <div className="shrink-0">
            <Header />
          </div>
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
}
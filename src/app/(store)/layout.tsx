// src/app/(store)/layout.tsx
import Header from "@/components/storefront/Header";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/storefront/Footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col h-screen overflow-hidden mx-auto max-w-7xl"
    >
      {/* ── Sticky top ── */}
      <div className="shrink-0">
        <Header />
      </div>

      {/* ── Scrollable content ── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
        <Footer />
      </main>
    </div>
  );
}
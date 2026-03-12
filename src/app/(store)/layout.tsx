import Header from "@/components/storefront/Header";
import CookieBanner from "@/components/CookieBanner";
import BorderMotif from "@/components/storefront/BorderMotif";
import Footer from "@/components/storefront/Footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Sticky top ── */}
      <div className="shrink-0">
        <BorderMotif />
        <Header />
      </div>

      {/* ── Scrollable content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
        <BorderMotif />
        <Footer />
      </main>

      {/* ── Fixed bottom ── */}
      <CookieBanner />

    </div>
  );
}
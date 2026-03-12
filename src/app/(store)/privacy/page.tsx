"use client";
import Link from "next/link";

// ── Shared layout ─────────────────────────────────────────────

function LegalLayout({ title, updated, children }: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ll-texture-overlay min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <div className="ll-texture-overlay pointer-events-none fixed inset-0 z-0" />

      <div className="h-3 w-full opacity-60" style={{ background: `repeating-linear-gradient(90deg,#b07878 0px,#b07878 8px,transparent 8px,transparent 16px,#8fad94 16px,#8fad94 24px,transparent 24px,transparent 32px,#ecdcdc 32px,#ecdcdc 40px,transparent 40px,transparent 48px)` }} />

      <nav className="relative z-10 flex items-center justify-between border-b px-12 py-5" style={{ borderColor: "var(--linen)", backgroundColor: "var(--cream)" }}>
        <Link href="/" className="ll-display text-lg italic" style={{ color: "var(--brown)", textDecoration: "none" }}>
          Noemi <span style={{ fontStyle: "normal", color: "var(--rose-deep)" }}>· The Linen Lady</span>
        </Link>
        <Link href="/shop" className="ll-label text-[0.72rem] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Shop</Link>
      </nav>

      <div className="relative z-[1] mx-auto max-w-3xl px-8 py-20">
        <div className="ll-label mb-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]" style={{ color: "var(--sage-deep)" }}>
          Last updated {updated}
        </div>
        <h1 className="ll-display mb-12 font-normal" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", color: "var(--ink)" }}>
          {title}
        </h1>
        {children}
        <div className="mt-16 border-t pt-8" style={{ borderColor: "var(--linen)" }}>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="ll-label text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: "var(--sage-deep)", textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="/terms"   className="ll-label text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: "var(--sage-deep)", textDecoration: "none" }}>Terms of Sale</Link>
            <Link href="/"        className="ll-label text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>← Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section helper ────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="ll-display mb-4 text-xl font-normal" style={{ color: "var(--ink)" }}>{title}</h2>
      <div className="ll-body text-base font-light leading-[1.85]" style={{ color: "var(--ink-soft)" }}>
        {children}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="January 1, 2025">
      <Section title="Who We Are">
        <p>
          This website is operated by Noemi · The Linen Lady, a sole proprietorship based in
          Washington, D.C. We sell antique and vintage linens, textiles, and related goods through
          this website and at the Georgetown Flea Market. Questions about this policy can be sent to{" "}
          <a href="mailto:noemi@linenlady.net" style={{ color: "var(--rose-deep)" }}>noemi@linenlady.net</a>.
        </p>
      </Section>

      <Section title="What Information We Collect">
        <p className="mb-3">When you create an account or make a reservation, we collect:</p>
        <ul className="ml-6 list-disc space-y-1.5">
          <li>Your name and email address (provided during sign-up via Clerk)</li>
          <li>Your shipping address (if you choose to save one)</li>
          <li>Messages you send to us through the site</li>
          <li>Reservation and order history</li>
        </ul>
        <p className="mt-3">
          We do <strong>not</strong> collect or store payment card information. All payments are
          processed by Square, Inc. under their own privacy policy.
        </p>
      </Section>

      <Section title="Cookies">
        <p className="mb-3">We use a small number of cookies:</p>
        <ul className="ml-6 list-disc space-y-1.5">
          <li><strong>Session cookies</strong> — required for sign-in, managed by Clerk.</li>
          <li><strong>Preference cookies</strong> — remember your cookie consent choice.</li>
        </ul>
        <p className="mt-3">
          We do not use advertising cookies, tracking pixels, or third-party analytics.
          You can decline non-essential cookies using the banner at the bottom of the page.
        </p>
      </Section>

      <Section title="How We Use Your Information">
        <ul className="ml-6 list-disc space-y-1.5">
          <li>To process and manage your reservations</li>
          <li>To send reservation confirmations and payment links via email</li>
          <li>To send new-arrival notifications for categories you have opted into</li>
          <li>To respond to messages you send us</li>
        </ul>
        <p className="mt-3">
          We do <strong>not</strong> sell, rent, or share your personal information with third
          parties for marketing purposes.
        </p>
      </Section>

      <Section title="Data Retention">
        <p>
          We retain your account information for as long as your account is active. Order and
          reservation records are retained for 7 years for accounting purposes. You may request
          deletion of your account and personal data at any time by emailing us.
        </p>
      </Section>

      <Section title="Your Rights">
        <p className="mb-3">
          Depending on your location, you may have the right to access, correct, or delete the
          personal information we hold about you. To exercise any of these rights, contact us at{" "}
          <a href="mailto:noemi@linenlady.net" style={{ color: "var(--rose-deep)" }}>noemi@linenlady.net</a>.
        </p>
        <p>
          If you are located in the European Economic Area, you have rights under GDPR including
          access, rectification, erasure, and the right to lodge a complaint with a supervisory
          authority. For California residents, CCPA rights apply including the right to know what
          personal information is collected and the right to delete it.
        </p>
      </Section>

      <Section title="Third-Party Services">
        <ul className="ml-6 list-disc space-y-1.5">
          <li><strong>Clerk</strong> — handles authentication and email verification.{" "}
            <a href="https://clerk.com/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--rose-deep)" }}>Clerk Privacy Policy</a>
          </li>
          <li><strong>Square</strong> — processes payments.{" "}
            <a href="https://squareup.com/us/en/legal/general/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--rose-deep)" }}>Square Privacy Policy</a>
          </li>
          <li><strong>Microsoft Azure</strong> — hosts our servers and database in the United States.</li>
        </ul>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this policy from time to time. Changes will be posted on this page with a
          revised date. Continued use of the site after changes constitutes acceptance of the
          updated policy.
        </p>
      </Section>
    </LegalLayout>
  );
}
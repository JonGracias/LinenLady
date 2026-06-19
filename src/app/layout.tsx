// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ContextProvider from "@/context/ContextProvider";
import { ThemeProvider } from "next-themes";
import CookieBanner from "@/components/CookieBanner";
import { ClerkProvider } from '@clerk/nextjs'


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://noemithelinenlady.net"),
  title: { default: "The Linen Lady — Antique & Vintage Linens", template: "%s | The Linen Lady" },
  description: "Curated antique and vintage linens from Noemi, serving collectors since 1994.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "The Linen Lady",
    images: ["/og-default.jpg"], // 1200×630, drop in /public
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={`${process.env.NEXT_PUBLIC_CLERK_ACCOUNT_URL}/sign-in`}
      signUpUrl={`${process.env.NEXT_PUBLIC_CLERK_ACCOUNT_URL}/sign-up`}
      signInFallbackRedirectUrl="/welcome"
      signUpFallbackRedirectUrl="/welcome"
    >
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ContextProvider>
              {children}
            </ContextProvider>
            <CookieBanner />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
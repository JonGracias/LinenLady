// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ContextProvider from "@/context/ContextProvider";
import { ThemeProvider } from "next-themes";
import CookieBanner from "@/components/CookieBanner";
import { ClerkProvider } from '@clerk/nextjs'


export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_STORE_NAME,
  description: "Inventory management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={`${process.env.NEXT_PUBLIC_CLERK_ACCOUNT_URL}/sign-in`}
      signUpUrl={`${process.env.NEXT_PUBLIC_CLERK_ACCOUNT_URL}/sign-up`}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ContextProvider>
              <div className="sm:mx-8">{children}</div>
            </ContextProvider>
            <CookieBanner />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
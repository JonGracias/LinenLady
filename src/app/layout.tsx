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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
          <ClerkProvider>
            <ThemeProvider>
              <ContextProvider>
                  {children}
              </ContextProvider>
              <CookieBanner />
            </ThemeProvider>
          </ClerkProvider>
      </body>
    </html>
  );
}
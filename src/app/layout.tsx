import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ShoshaMart",
    template: "%s | ShoshaMart",
  },
  description: "B2B Marketplace for ShoshaMart",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

import { Toaster } from "sonner";
import { getSession } from "@/lib/auth/session";
import ProductTour from "@/components/dashboard/ProductTour";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  let hasCompletedTour = false;
  if (session?.id) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
      columns: {
        hasCompletedTour: true,
      }
    });
    hasCompletedTour = user?.hasCompletedTour ?? false;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProductTour
          hasCompletedTour={hasCompletedTour}
          userRole={session?.role}
        />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

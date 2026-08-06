import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ProfileProvider } from "@/context/ProfileContext";
import { SITE_CONFIG, META_CONSTANTS } from "@/lib/metaConstant";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: META_CONSTANTS.dashboard.fullTitle,
    template: `%s | Super Admin – Ticketing Platform`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "Super Admin",
    "Ticketing Platform",
    "Tenant Management",
    "Admin Control Panel",
    "Platform Dashboard",
    "Subscription Renewals",
    "License Management",
  ],
  authors: [{ name: "Ticketing Platform Admin Team" }],
  creator: "Ticketing Platform",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_CONFIG.name,
    title: META_CONSTANTS.dashboard.fullTitle,
    description: SITE_CONFIG.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full`}>
      <body style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <ToastProvider>
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

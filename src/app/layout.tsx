import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Goalie Card | Elite Athlete Tracking",
    template: "%s | Goalie Card",
  },
  description: "Next-gen athlete session tracking, performance insights, and training journals. Built for goalies, coaches, and parents.",
  keywords: ["goalie", "athlete tracking", "training journal", "sports technology", "performance insights", "goalie card"],
  authors: [{ name: "GoalieGuard" }],
  creator: "GoalieGuard",
  metadataBase: new URL("https://goalie-cardv11start.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://goalie-cardv11start.vercel.app",
    siteName: "Goalie Card",
    title: "Goalie Card | Elite Athlete Tracking",
    description: "Next-gen athlete session tracking, performance insights, and training journals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Goalie Card - Elite Athlete Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Goalie Card | Elite Athlete Tracking",
    description: "Next-gen athlete session tracking, performance insights, and training journals.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
  other: {
    "theme-color": "#09090B",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // exposes env(safe-area-inset-*) on iOS
};


import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { ToastProvider } from "@/context/ToastContext";

import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <ErrorBoundary>
              <AppProvider>
                {children}
              </AppProvider>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

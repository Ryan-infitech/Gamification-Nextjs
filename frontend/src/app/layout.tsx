import type { Metadata, Viewport } from "next/types";
import { Inter, VT323, Press_Start_2P } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "@/providers/providers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const pixelBody = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pixel-body",
});

const pixelHeading = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pixel-heading",
});

export const metadata: Metadata = {
  title: {
    default: "Gamifikasi Computer Science",
    template: "%s | Gamifikasi CS",
  },
  description:
    "Platform belajar ilmu komputer dengan gamifikasi, membuat proses belajar menjadi lebih menyenangkan dan efektif",
  keywords: [
    "computer science",
    "programming",
    "coding",
    "gamification",
    "learning",
    "education",
    "game-based learning",
    "Indonesia",
  ],
  authors: [{ name: "Gamifikasi CS Team" }],
  creator: "Gamifikasi CS Team",
  publisher: "Gamifikasi CS",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://gamifikasi-cs.vercel.app",
    title: "Gamifikasi Computer Science",
    description: "Platform belajar ilmu komputer dengan gamifikasi",
    siteName: "Gamifikasi CS",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gamifikasi CS Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gamifikasi Computer Science",
    description: "Platform belajar ilmu komputer dengan gamifikasi",
    images: ["/images/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1F2F6" },
    { media: "(prefers-color-scheme: dark)", color: "#2F3542" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${pixelBody.variable} ${pixelHeading.variable} font-sans bg-background min-h-screen text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Skip to content
            </a>

            <div id="main-content" className="min-h-screen flex flex-col">
              {children}
            </div>

            <div id="portal-root"></div>
          </Providers>

          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

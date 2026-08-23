import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Fito - AI Kişisel Fitness ve Beslenme Koçunuz",
    template: "%s | Fito",
  },
  description: "Yapay zeka destekli, sana özel antrenman ve beslenme planlarıyla hedeflerine ulaş. Bilim temelli, sürdürülebilir ve keyifli bir dönüşüm deneyimi.",
  keywords: ["fitness", "beslenme", "antrenman", "sağlıklı yaşam", "AI koç", "kişisel plan", "kilo verme", "kas yapma"],
  authors: [{ name: "Fito Team" }],
  creator: "Fito",
  publisher: "Fito",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://fito.app",
    siteName: "Fito",
    title: "Fito - AI Kişisel Fitness ve Beslenme Koçunuz",
    description: "Yapay zeka destekli, sana özel antrenman ve beslenme planlarıyla hedeflerine ulaş.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fito - AI Fitness Koçu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fito - AI Kişisel Fitness ve Beslenme Koçunuz",
    description: "Yapay zeka destekli, sana özel antrenman ve beslenme planlarıyla hedeflerine ulaş.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
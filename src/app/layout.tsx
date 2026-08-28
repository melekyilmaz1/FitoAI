import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
    { media: "(prefers-color-scheme: light)", color: "#141414" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
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
    <html lang="tr" className={`${sora.variable} h-full antialiased font-sora`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-full flex flex-col bg-[#141414] text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
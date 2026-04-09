import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SalesAgent from "@/components/agent/SalesAgent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tapicascos-next-git-main-adriangar333s-projects.vercel.app"),
  title: "Tapicascos Barranquilla | Personalización Premium de Cascos",
  description:
    "Tapizado, pintura personalizada, repuestos y accesorios para cascos de moto en Barranquilla. Más de 10 años transformando tu casco.",
  keywords:
    "tapicascos, cascos, barranquilla, tapizado, pintura personalizada, motos, accesorios",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Tapicascos Barranquilla | Personalización Premium de Cascos",
    description:
      "Tapizado, pintura y accesorios premium para tu casco en Barranquilla.",
    type: "website",
    locale: "es_CO",
    siteName: "Tapicascos Barranquilla",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Tapicascos Barranquilla",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tapicascos Barranquilla",
    description: "Personalización premium de cascos de moto.",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-[#0A0E1A] text-white font-[var(--font-inter)]">
        {children}
        <SalesAgent />
      </body>
    </html>
  );
}

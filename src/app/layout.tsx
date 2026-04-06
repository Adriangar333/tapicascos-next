import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tapicascos Barranquilla | Personalización Premium de Cascos",
  description: "Tapizado, pintura personalizada, repuestos y accesorios para cascos de moto en Barranquilla. Más de 10 años de experiencia transformando tu casco.",
  keywords: "tapicascos, cascos, barranquilla, tapizado, pintura personalizada, motos, accesorios",
  openGraph: {
    title: "Tapicascos Barranquilla",
    description: "Personalización premium de cascos de moto",
    type: "website",
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
      </body>
    </html>
  );
}

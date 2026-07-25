import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diagnóstico de Marketing — Creativa Balam",
  description:
    "Diagnóstico gratuito de marketing para tu negocio, hecho por Creativa Balam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-inter), Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

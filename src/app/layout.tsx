import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planorte — Find out what's holding your business back",
  description:
    "AI-powered business diagnostics. Analyze your marketing and digital presence, get a clear action plan. By Creativa Balam.",
  icons: {
    icon: "/planorte-logo.png",
  },
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

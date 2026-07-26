import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ponexo — Find out what's holding your business back",
  description:
    "AI-powered business diagnostics. Analyze your marketing and digital presence, get a clear action plan. By Creativa Balam.",
  icons: {
    icon: "/ponexo-logo.png",
  },
};

// viewportFit "cover" habilita env(safe-area-inset-*) -- necesario porque la
// landing pública se navega como pantallas completas tipo app (ver
// landing-page.tsx) y los controles fijos (botón, puntos) no deben quedar
// debajo del notch/home indicator cuando esto corra dentro de un wrapper
// nativo (WebView) o como PWA a pantalla completa.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090B0F",
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

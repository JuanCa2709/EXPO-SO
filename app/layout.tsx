import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { InspectGuard } from "@/components/InspectGuard";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DEADLOCK / 06 — Filósofos comensales",
  description:
    "Una experiencia interactiva que hace visible un sistema concurrente: cinco procesos, cinco recursos y el ciclo que los bloquea.",
};

export const viewport: Viewport = {
  themeColor: "#05070B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <body>
        <a
          href="#contenido"
          className="label sr-only z-[90] rounded bg-bg-3 px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Saltar al contenido
        </a>
        <InspectGuard />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

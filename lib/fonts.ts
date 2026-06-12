import { Fraunces, Inter } from "next/font/google";

// Display serif editorial — Fraunces italic 300 (titres)
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["italic", "normal"],
});

// Corps de texte — Inter
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Classe à poser sur <html> pour exposer les variables de police. */
export const fontVariables = `${fraunces.variable} ${inter.variable}`;

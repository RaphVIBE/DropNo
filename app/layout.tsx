import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Display serif editorial — Fraunces italic 300 (titres)
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["italic", "normal"],
});

// Corps de texte — Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drop No. — Drops scellés pour montres premium",
  description:
    "Une maison de drops scellés dédiée à l'horlogerie premium. Offre cachée, prix unique à la révélation.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  // Accorde la barre d'URL mobile au fond off-white warm-tinted (--background).
  themeColor: "#f6f3ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="skip-link">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

import { fontVariables } from "@/lib/fonts";
import { PostHogScript } from "@/components/analytics/PostHogScript";
import { PageviewTracker } from "@/components/analytics/PageviewTracker";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("title"), description: t("description") };
}

export const viewport: Viewport = {
  colorScheme: "light",
  // Accorde la barre d'URL mobile au fond off-white warm-tinted (--background).
  themeColor: "#f6f3ec",
};

/**
 * Racine HTML unique. `lang` est dérivé de la locale courante (getLocale) :
 * `en` sous /en/*, `fr` partout ailleurs (vitrine FR + back-office non localisé).
 * NextIntlClientProvider hérite locale + messages du contexte serveur (v4) et
 * les rend disponibles aux composants client (ex. le sélecteur de langue).
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const t = await getTranslations("common");

  return (
    <html lang={locale} className={fontVariables}>
      <body className="min-h-screen antialiased">
        <PostHogScript />
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
        <a href="#main-content" className="skip-link">
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

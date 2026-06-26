import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

import { fontVariables } from "@/lib/fonts";
import { PostHogScript } from "@/components/analytics/PostHogScript";
import { PageviewTracker } from "@/components/analytics/PageviewTracker";
import { CookieConsent } from "@/components/consent/cookie-consent";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultOgImage, siteUrl } from "@/lib/i18n/metadata";
import {
  organizationJsonLd,
  webSiteJsonLd,
} from "@/lib/seo/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const locale = await getLocale();
  const title = t("title");
  const description = t("description");
  const ogLocale = locale === "en" ? "en_US" : "fr_FR";

  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "Drop No.",
      title,
      description,
      url: siteUrl(),
      locale: ogLocale,
      images: [
        {
          url: defaultOgImage(),
          width: 1200,
          height: 630,
          alt: "Drop No.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage()],
      // TODO(owner): renseigner le handle X officiel, p. ex. site: "@dropno"
    },
  };
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
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />
        <PostHogScript />
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
        <a href="#main-content" className="skip-link">
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          {children}
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

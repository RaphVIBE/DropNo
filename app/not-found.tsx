import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ErrorShell } from "@/components/error/error-shell";

/**
 * 404 racine. En App Router, une URL sans route correspondante (y compris sous
 * /[locale]/...) remonte à CE fichier, pas à app/[locale]/not-found.tsx (ce
 * dernier ne sert que les `notFound()` levés DANS le sous-arbre localisé). On
 * le rend donc autonome, sous le layout racine (html/body/provider présents).
 * La locale est résolue par next-intl depuis l'URL/cookie. Rendu plein écran
 * avec le mot-marque, sans dépendre de la nav du segment public.
 */
export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-background outline-none">
      <ErrorShell
        variant="movement"
        withWordmark
        code={t("notFound.code")}
        eyebrow={t("notFound.eyebrow")}
        title={t("notFound.title")}
        lede={t("notFound.lede")}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">{t("backHome")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/drops">{t("viewCalendar")}</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("contactPrompt")}{" "}
          <a
            href="mailto:hello@dropno.eu"
            className="text-champagne-deep underline-offset-4 hover:underline"
          >
            {t("contactLink")}
          </a>
        </p>
      </ErrorShell>
    </main>
  );
}

import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ErrorShell } from "@/components/error/error-shell";

/**
 * 404 du site vitrine (segment localisé). Couvre les URLs inconnues mais aussi
 * tout `notFound()` appelé dans l'arbre [locale] (ex. clé démo invalide, drop
 * absent). Composant serveur : la copy passe par l'i18n du contexte courant.
 */
export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <ErrorShell
      variant="movement"
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
  );
}

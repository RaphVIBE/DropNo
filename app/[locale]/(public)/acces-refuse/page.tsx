import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ErrorShell } from "@/components/error/error-shell";

/**
 * Écran 403 « accès réservé » du site vitrine. Aujourd'hui le site public n'a
 * pas de surface 403 active (l'accès soft-launch est réécrit vers /bientot par
 * le construction-gate, et /admin · /maison ont leur propre auth dark). Cette
 * page existe pour offrir un 403 cohérent au design dès qu'une route protégée
 * en aura besoin (renvoyer ici plutôt qu'un écran brut). Non indexée.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccessDenied() {
  const t = await getTranslations("errors");

  return (
    <ErrorShell
      variant="seal"
      code={t("forbidden.code")}
      eyebrow={t("forbidden.eyebrow")}
      title={t("forbidden.title")}
      lede={t("forbidden.lede")}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/login">{t("forbidden.signIn")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t("backHome")}</Link>
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

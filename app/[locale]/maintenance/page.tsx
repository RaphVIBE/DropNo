import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ErrorShell } from "@/components/error/error-shell";

/**
 * Page maintenance (503). Servie en plein écran (hors nav/footer) lorsque le
 * mode maintenance est actif : le middleware réécrit tout le trafic visiteur
 * vers cette URL (voir lib/maintenance-gate.ts). Point clé demandé par l'owner :
 * rassurer explicitement sur les offres en cours. Non indexée.
 */
export const metadata: Metadata = {
  title: "Drop No. · Maintenance",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const t = await getTranslations("errors");

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-background outline-none">
      <ErrorShell
        variant="movement"
        withWordmark
        eyebrow={t("maintenance.eyebrow")}
        title={t("maintenance.title")}
        lede={t("maintenance.lede")}
      >
        <div className="rounded-sm border border-rule-soft bg-background/70 px-6 py-5">
          <p className="max-w-md text-sm leading-relaxed text-foreground">
            {t("maintenance.reassure")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("maintenance.contactPrompt")}{" "}
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

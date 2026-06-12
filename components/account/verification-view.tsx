import { ArrowLeft, ScanFace, ScanLine, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { StartKycButton } from "@/components/kyc/start-kyc-button";
import { Filigrane } from "@/components/brand/filigrane";

/* Vue présentation de la page de vérification KYC. Alimentée par la vraie
 * page (statut Supabase) ou par la page dev (statut mock). */

const STEPS = [
  { Icon: ScanLine, key: "id" },
  { Icon: ScanFace, key: "selfie" },
  { Icon: ShieldCheck, key: "confirm" },
] as const;

const CTA_CLASS =
  "mt-2 inline-block bg-primary px-6 py-[18px] text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

export async function VerificationView({ status }: { status: string }) {
  const t = await getTranslations("accountVerification");
  const done = status === "verified";

  return (
    <section className="mx-auto max-w-3xl px-7 py-16 md:px-16 md:py-24">
      <Link
        href="/account/dashboard"
        className="inline-flex items-center gap-2 rounded-sm text-[13px] text-ink-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
        {t("backToAccount")}
      </Link>

      <div className="relative mt-10 overflow-hidden">
        <Filigrane className="reveal-art pointer-events-none absolute -right-12 -top-6 z-0 h-52 w-52 text-[var(--champagne-deep)] [--art-opacity:0.07] md:right-0 md:h-64 md:w-64" />
        <div className="relative z-10">
          <p
            className="eyebrow reveal"
            style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          >
            {t("eyebrow")}
          </p>
          <h1
            className="font-display reveal mt-5 max-w-[14ch] text-[clamp(2.75rem,7vw,4.5rem)]"
            style={{ "--reveal-delay": "200ms" } as React.CSSProperties}
          >
            {t("title")}
          </h1>
          <p
            className="reveal mt-6 max-w-[52ch] text-base text-ink-2"
            style={{ "--reveal-delay": "340ms" } as React.CSSProperties}
          >
            {t("intro")}
          </p>
        </div>
      </div>

      <ol className="mt-14 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.key}
            className="reveal flex flex-col gap-3 border-t border-border pt-5"
            style={
              { "--reveal-delay": `${480 + i * 90}ms` } as React.CSSProperties
            }
          >
            <step.Icon
              className="size-5 text-[var(--champagne-deep)]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-foreground">
              {t(`steps.${step.key}.label`)}
            </span>
            <p className="text-sm leading-relaxed text-ink-2">
              {t(`steps.${step.key}.desc`)}
            </p>
          </li>
        ))}
      </ol>

      <div
        className="reveal mt-14"
        style={{ "--reveal-delay": "760ms" } as React.CSSProperties}
      >
        <StatusBlock status={status} done={done} t={t} />
      </div>
    </section>
  );
}

function StatusBlock({
  status,
  done,
  t,
}: {
  status: string;
  done: boolean;
  t: Awaited<ReturnType<typeof getTranslations<"accountVerification">>>;
}) {
  if (done) {
    return (
      <div className="border border-rule-soft bg-card p-7">
        <div className="flex items-center gap-2 text-champagne-deep">
          <ShieldCheck className="size-5" strokeWidth={1.5} aria-hidden="true" />
          <span className="text-[13px] font-medium uppercase tracking-[0.16em]">
            {t("verified.badge")}
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-2">{t("verified.body")}</p>
        <Link
          href="/drops"
          className="mt-5 inline-block rounded-sm text-sm underline underline-offset-4 transition-colors hover:text-champagne-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t("verified.cta")}
        </Link>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="border border-rule-soft bg-card p-7">
        <div className="flex items-center gap-2 text-ink-2">
          <span className="status-dot" aria-hidden />
          <span className="text-[13px] font-medium uppercase tracking-[0.16em]">
            {t("verifying.badge")}
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-2">{t("verifying.body")}</p>
      </div>
    );
  }

  // pending | rejected
  const rejected = status === "rejected";
  return (
    <div className="border border-rule bg-card p-7">
      <h2 className="font-serif text-xl italic">
        {rejected ? t("pending.titleRejected") : t("pending.title")}
      </h2>
      <p className="mb-5 mt-2 max-w-[48ch] text-sm text-ink-2">
        {rejected ? t("pending.bodyRejected") : t("pending.body")}
      </p>
      <StartKycButton className={CTA_CLASS}>
        {rejected ? t("pending.ctaRejected") : t("pending.cta")}
      </StartKycButton>
    </div>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AccountSection, AccountRow } from "@/components/account/account-section";
import { Filigrane } from "@/components/brand/filigrane";
import { formatEuros, formatShortDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

/* Vue présentation du dashboard (sans accès données ni session). Alimentée
 * par la vraie page (Supabase) ou par la page dev (mock). */

const KYC_CTA_CLASS =
  "mt-2 inline-block bg-primary px-6 py-[16px] text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors rounded-sm hover:bg-[var(--btn-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Tone = "live" | "win" | "muted" | "neutral";

// Tones par statut (les libellés viennent des traductions, voir useBadges).
const BID_TONE: Record<string, Tone> = {
  active: "live",
  won: "win",
  lost: "muted",
  withdrawn: "muted",
  invalid: "muted",
};

const TX_TONE: Record<string, Tone> = {
  pending: "neutral",
  captured: "win",
  refunded: "muted",
  failed: "muted",
};

const DELIVERY_TONE: Record<string, Tone> = {
  pending: "neutral",
  preparing: "neutral",
  shipped: "live",
  in_transit: "live",
  delivered: "win",
  returned: "muted",
  lost: "muted",
};

// Noms de transporteurs : marques, non traduits.
const CARRIER_LABEL: Record<string, string> = {
  dhl: "DHL Express",
  malca_amit: "Malca-Amit",
  brinks: "Brink's",
};

export type DropRef = {
  id: string | null;
  drop_number: number | null;
  title: string | null;
} | null;

export type BidRow = {
  id: string;
  amount_cents: number;
  status: string;
  submitted_at: string;
  drop: DropRef;
};
export type TxRow = {
  id: string;
  amount_paid_cents: number;
  status: string;
  captured_at: string | null;
  withdrawal_window_ends_at: string | null;
  drop: DropRef;
};
export type DeliveryRow = {
  id: string;
  carrier: string;
  tracking_number: string | null;
  status: string;
  transaction: { drop: DropRef } | null;
};

export type SerialOfferRef = {
  id: string;
  expires_at: string;
} | null;

export type DashboardData = {
  email: string;
  displayName?: string | null;
  kycStatus: string;
  bids: BidRow[];
  txs: TxRow[];
  deliveries: DeliveryRow[];
  /** Privilège № 001 en attente (discret : visible du seul destinataire). */
  serialOffer?: SerialOfferRef;
};

export function DashboardView({
  data,
  footer,
}: {
  data: DashboardData;
  footer?: React.ReactNode;
}) {
  const t = useTranslations("accountDashboard");
  const locale = useLocale() as Locale;
  const { email, displayName, kycStatus, bids, txs, deliveries, serialOffer } =
    data;

  const kycLabel = (status: string) =>
    ["pending", "verifying", "verified", "rejected"].includes(status)
      ? t(`kycStatus.${status}`)
      : "—";

  const bidBadge = (status: string): { label: string; tone: Tone } =>
    BID_TONE[status]
      ? { label: t(`bidStatus.${status}`), tone: BID_TONE[status] }
      : { label: status, tone: "neutral" };

  const txBadge = (status: string): { label: string; tone: Tone } =>
    TX_TONE[status]
      ? { label: t(`txStatus.${status}`), tone: TX_TONE[status] }
      : { label: status, tone: "neutral" };

  const deliveryBadge = (status: string): { label: string; tone: Tone } =>
    DELIVERY_TONE[status]
      ? { label: t(`deliveryStatus.${status}`), tone: DELIVERY_TONE[status] }
      : { label: status, tone: "neutral" };

  return (
    <section className="mx-auto max-w-3xl px-7 py-20 md:px-16">
      <div className="relative overflow-hidden">
        <Filigrane className="reveal-art pointer-events-none absolute -right-10 -top-8 z-0 h-48 w-48 text-[var(--champagne-deep)] [--art-opacity:0.08] md:right-0 md:h-60 md:w-60" />
        <div className="relative z-10">
          <p
            className="eyebrow reveal"
            style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          >
            {t("eyebrow")}
          </p>
          <h1
            className="font-display reveal mb-8 text-4xl"
            style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
          >
            {displayName ? t("greetingNamed", { name: displayName }) : t("greeting")}
          </h1>
        </div>
      </div>

      <dl className="mb-8 grid gap-4 border-y border-rule-soft py-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-2">{t("emailLabel")}</dt>
          <dd>{email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-2">{t("kycLabel")}</dt>
          <dd>{kycLabel(kycStatus)}</dd>
        </div>
      </dl>

      <KycBlock status={kycStatus} t={t} />

      {serialOffer &&
      new Date(serialOffer.expires_at).getTime() > Date.now() ? (
        <Link
          href={`/account/offre/${serialOffer.id}`}
          className="mb-8 block border border-[var(--champagne-deep,#8c7a52)] bg-card p-5 transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="eyebrow mb-1">{t("serialOffer.eyebrow")}</p>
          <p className="text-sm text-ink-2">{t("serialOffer.body")}</p>
        </Link>
      ) : null}

      <AccountSection
        title={t("bidsSection.title")}
        count={bids.length > 0 ? `${bids.length}` : undefined}
        empty={t("bidsSection.empty")}
      >
        {bids.map((b) => (
          <AccountRow
            key={b.id}
            dropId={b.drop?.id ?? null}
            dropNumber={b.drop?.drop_number ?? null}
            title={b.drop?.title ?? null}
            primary={formatEuros(b.amount_cents, locale)}
            secondary={formatShortDate(b.submitted_at, locale)}
            badge={bidBadge(b.status)}
          />
        ))}
      </AccountSection>

      <AccountSection
        title={t("winsSection.title")}
        count={txs.length > 0 ? `${txs.length}` : undefined}
        empty={t("winsSection.empty")}
      >
        {txs.map((tx) => (
          <AccountRow
            key={tx.id}
            dropId={tx.drop?.id ?? null}
            dropNumber={tx.drop?.drop_number ?? null}
            title={tx.drop?.title ?? null}
            primary={formatEuros(tx.amount_paid_cents, locale)}
            secondary={
              tx.withdrawal_window_ends_at
                ? t("winsSection.withdrawalUntil", {
                    date: formatShortDate(tx.withdrawal_window_ends_at, locale),
                  })
                : tx.captured_at
                  ? t("winsSection.paidOn", {
                      date: formatShortDate(tx.captured_at, locale),
                    })
                  : undefined
            }
            badge={txBadge(tx.status)}
          />
        ))}
      </AccountSection>

      <AccountSection
        title={t("deliveriesSection.title")}
        count={deliveries.length > 0 ? `${deliveries.length}` : undefined}
        empty={t("deliveriesSection.empty")}
      >
        {deliveries.map((d) => (
          <AccountRow
            key={d.id}
            dropId={d.transaction?.drop?.id ?? null}
            dropNumber={d.transaction?.drop?.drop_number ?? null}
            title={d.transaction?.drop?.title ?? null}
            primary={CARRIER_LABEL[d.carrier] ?? d.carrier}
            secondary={
              d.tracking_number
                ? t("deliveriesSection.tracking", { number: d.tracking_number })
                : undefined
            }
            badge={deliveryBadge(d.status)}
          />
        ))}
      </AccountSection>

      {footer ? <div className="mt-16">{footer}</div> : null}
    </section>
  );
}

function KycBlock({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  if (status === "verified") {
    return (
      <div className="border border-rule-soft bg-card p-6">
        <p className="text-sm text-ink-2">{t("kycBlock.verified")}</p>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="border border-rule-soft bg-card p-6">
        <p className="text-sm text-ink-2">{t("kycBlock.verifying")}</p>
      </div>
    );
  }

  // pending | rejected
  const isRejected = status === "rejected";
  return (
    <div className="border border-rule bg-card p-6">
      <h2 className="font-serif text-xl italic">
        {isRejected ? t("kycBlock.rejectedTitle") : t("kycBlock.pendingTitle")}
      </h2>
      <p className="mb-5 mt-2 text-sm text-ink-2">
        {isRejected ? t("kycBlock.rejectedBody") : t("kycBlock.pendingBody")}
      </p>
      <Link href="/account/verification" className={KYC_CTA_CLASS}>
        {isRejected ? t("kycBlock.rejectedCta") : t("kycBlock.pendingCta")}
      </Link>
    </div>
  );
}

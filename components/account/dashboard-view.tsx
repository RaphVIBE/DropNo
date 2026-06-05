import Link from "next/link";

import { AccountSection, AccountRow } from "@/components/account/account-section";
import { Filigrane } from "@/components/brand/filigrane";
import { formatEuros, formatShortDate } from "@/lib/format";

/* Vue présentation du dashboard (sans accès données ni session). Alimentée
 * par la vraie page (Supabase) ou par la page dev (mock). */

const KYC_LABEL: Record<string, string> = {
  pending: "Non vérifié",
  verifying: "En cours de vérification",
  verified: "Vérifié",
  rejected: "Refusé",
};

const KYC_CTA_CLASS =
  "mt-2 inline-block bg-primary px-6 py-[16px] text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Tone = "live" | "win" | "muted" | "neutral";

const BID_BADGE: Record<string, { label: string; tone: Tone }> = {
  active: { label: "En cours", tone: "live" },
  won: { label: "Gagné", tone: "win" },
  lost: { label: "Non retenu", tone: "muted" },
  withdrawn: { label: "Retiré", tone: "muted" },
  invalid: { label: "Invalide", tone: "muted" },
};

const TX_BADGE: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "En attente", tone: "neutral" },
  captured: { label: "Payé", tone: "win" },
  refunded: { label: "Remboursé", tone: "muted" },
  failed: { label: "Échec", tone: "muted" },
};

const DELIVERY_BADGE: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "En préparation", tone: "neutral" },
  preparing: { label: "En préparation", tone: "neutral" },
  shipped: { label: "Expédié", tone: "live" },
  in_transit: { label: "En transit", tone: "live" },
  delivered: { label: "Livré", tone: "win" },
  returned: { label: "Retourné", tone: "muted" },
  lost: { label: "Perdu", tone: "muted" },
};

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

export type DashboardData = {
  email: string;
  displayName?: string | null;
  kycStatus: string;
  bids: BidRow[];
  txs: TxRow[];
  deliveries: DeliveryRow[];
};

export function DashboardView({
  data,
  footer,
}: {
  data: DashboardData;
  footer?: React.ReactNode;
}) {
  const { email, displayName, kycStatus, bids, txs, deliveries } = data;
  return (
    <section className="mx-auto max-w-3xl px-7 py-20 md:px-16">
      <div className="relative overflow-hidden">
        <Filigrane className="reveal-art pointer-events-none absolute -right-10 -top-8 z-0 h-48 w-48 text-[var(--champagne-deep)] opacity-[0.06] md:right-0 md:h-60 md:w-60" />
        <div className="relative z-10">
          <p
            className="eyebrow reveal"
            style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          >
            Mon compte
          </p>
          <h1
            className="font-display reveal mb-8 text-4xl"
            style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
          >
            Bonjour{displayName ? `, ${displayName}` : ""}
          </h1>
        </div>
      </div>

      <dl className="mb-8 grid gap-4 border-y border-rule-soft py-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-2">Email</dt>
          <dd>{email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-2">Statut KYC</dt>
          <dd>{KYC_LABEL[kycStatus] ?? "—"}</dd>
        </div>
      </dl>

      <KycBlock status={kycStatus} />

      <AccountSection
        title="Mes offres"
        count={bids.length > 0 ? `${bids.length}` : undefined}
        empty="Vous n'avez pas encore soumis d'offre."
      >
        {bids.map((b) => (
          <AccountRow
            key={b.id}
            dropId={b.drop?.id ?? null}
            dropNumber={b.drop?.drop_number ?? null}
            title={b.drop?.title ?? null}
            primary={formatEuros(b.amount_cents)}
            secondary={formatShortDate(b.submitted_at)}
            badge={BID_BADGE[b.status] ?? { label: b.status, tone: "neutral" }}
          />
        ))}
      </AccountSection>

      <AccountSection
        title="Mes gains"
        count={txs.length > 0 ? `${txs.length}` : undefined}
        empty="Aucun gain pour le moment."
      >
        {txs.map((t) => (
          <AccountRow
            key={t.id}
            dropId={t.drop?.id ?? null}
            dropNumber={t.drop?.drop_number ?? null}
            title={t.drop?.title ?? null}
            primary={formatEuros(t.amount_paid_cents)}
            secondary={
              t.withdrawal_window_ends_at
                ? `Rétractation jusqu'au ${formatShortDate(t.withdrawal_window_ends_at)}`
                : t.captured_at
                  ? `Payé le ${formatShortDate(t.captured_at)}`
                  : undefined
            }
            badge={TX_BADGE[t.status] ?? { label: t.status, tone: "neutral" }}
          />
        ))}
      </AccountSection>

      <AccountSection
        title="Mes livraisons"
        count={deliveries.length > 0 ? `${deliveries.length}` : undefined}
        empty="Aucune livraison en cours."
      >
        {deliveries.map((d) => (
          <AccountRow
            key={d.id}
            dropId={d.transaction?.drop?.id ?? null}
            dropNumber={d.transaction?.drop?.drop_number ?? null}
            title={d.transaction?.drop?.title ?? null}
            primary={CARRIER_LABEL[d.carrier] ?? d.carrier}
            secondary={d.tracking_number ? `Suivi ${d.tracking_number}` : undefined}
            badge={
              DELIVERY_BADGE[d.status] ?? { label: d.status, tone: "neutral" }
            }
          />
        ))}
      </AccountSection>

      {footer ? <div className="mt-16">{footer}</div> : null}
    </section>
  );
}

function KycBlock({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <div className="border border-rule-soft bg-card p-6">
        <p className="text-sm text-ink-2">
          Votre identité est vérifiée. Vous pouvez sceller une offre sur tous les
          drops.
        </p>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="border border-rule-soft bg-card p-6">
        <p className="text-sm text-ink-2">
          Vérification en cours. Vous recevrez une notification dès qu&apos;elle
          est finalisée, généralement en quelques minutes.
        </p>
      </div>
    );
  }

  // pending | rejected
  return (
    <div className="border border-rule bg-card p-6">
      <h2 className="font-serif text-xl italic">
        {status === "rejected"
          ? "Vérification à recommencer"
          : "Vérifiez votre identité"}
      </h2>
      <p className="mb-5 mt-2 text-sm text-ink-2">
        {status === "rejected"
          ? "La dernière vérification n'a pas abouti. Recommencez avec une pièce d'identité lisible, ou contactez le support."
          : "La vérification d'identité (pièce + selfie via Stripe) est requise avant votre première offre. Une fois vérifié, vous pouvez bidder à vie."}
      </p>
      <Link href="/account/verification" className={KYC_CTA_CLASS}>
        {status === "rejected"
          ? "Recommencer la vérification"
          : "Vérifier mon identité"}
      </Link>
    </div>
  );
}

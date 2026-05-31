import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { StartKycButton } from "@/components/kyc/start-kyc-button";
import { AccountSection, AccountRow } from "@/components/account/account-section";
import { formatEuros, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const KYC_LABEL: Record<string, string> = {
  pending: "Non vérifié",
  verifying: "En cours de vérification",
  verified: "Vérifié",
  rejected: "Refusé",
};

const BID_BADGE: Record<
  string,
  { label: string; tone: "live" | "win" | "muted" | "neutral" }
> = {
  active: { label: "En cours", tone: "live" },
  won: { label: "Gagné", tone: "win" },
  lost: { label: "Non retenu", tone: "muted" },
  withdrawn: { label: "Retiré", tone: "muted" },
  invalid: { label: "Invalide", tone: "muted" },
};

const TX_BADGE: Record<
  string,
  { label: string; tone: "live" | "win" | "muted" | "neutral" }
> = {
  pending: { label: "En attente", tone: "neutral" },
  captured: { label: "Payé", tone: "win" },
  refunded: { label: "Remboursé", tone: "muted" },
  failed: { label: "Échec", tone: "muted" },
};

const DELIVERY_BADGE: Record<
  string,
  { label: string; tone: "live" | "win" | "muted" | "neutral" }
> = {
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

type DropRef = {
  id: string | null;
  drop_number: number | null;
  title: string | null;
} | null;

type BidRow = {
  id: string;
  amount_cents: number;
  status: string;
  submitted_at: string;
  drop: DropRef;
};
type TxRow = {
  id: string;
  amount_paid_cents: number;
  status: string;
  captured_at: string | null;
  withdrawal_window_ends_at: string | null;
  drop: DropRef;
};
type DeliveryRow = {
  id: string;
  carrier: string;
  tracking_number: string | null;
  status: string;
  transaction: { drop: DropRef } | null;
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le middleware protege deja /account, mais on garde une garde explicite.
  if (!user) redirect("/login");

  // RLS : chaque requete ne renvoie que les lignes de l'utilisateur.
  const [{ data: profile }, bidsRes, txRes, delRes] = await Promise.all([
    supabase.from("profiles").select("display_name, kyc_status").eq("id", user.id).maybeSingle(),
    supabase
      .from("bids")
      .select(
        "id, amount_cents, status, submitted_at, drop:drops(id, drop_number, title, clearing_price_cents)"
      )
      .order("submitted_at", { ascending: false }),
    supabase
      .from("transactions")
      .select(
        "id, amount_paid_cents, status, captured_at, withdrawal_window_ends_at, drop:drops(id, drop_number, title)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("deliveries")
      .select(
        "id, carrier, tracking_number, status, transaction:transactions(drop:drops(id, drop_number, title))"
      )
      .order("created_at", { ascending: false }),
  ]);

  const kycStatus = profile?.kyc_status ?? "pending";
  const bids = (bidsRes.data ?? []) as unknown as BidRow[];
  const txs = (txRes.data ?? []) as unknown as TxRow[];
  const deliveries = (delRes.data ?? []) as unknown as DeliveryRow[];

  return (
    <section className="mx-auto max-w-3xl px-7 py-20 md:px-16">
      <p className="eyebrow">Mon compte</p>
      <h1 className="font-display mb-8 text-4xl">
        Bonjour{profile?.display_name ? `, ${profile.display_name}` : ""}
      </h1>

      <dl className="mb-8 grid gap-4 border-y border-rule-soft py-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-2">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-2">Statut KYC</dt>
          <dd>{KYC_LABEL[kycStatus] ?? "—"}</dd>
        </div>
      </dl>

      <KycBlock status={kycStatus} />

      {/* --- Mes offres --- */}
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

      {/* --- Mes gains --- */}
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

      {/* --- Mes livraisons --- */}
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

      <form action={signOut} className="mt-16">
        <Button type="submit" variant="outline">
          Se déconnecter
        </Button>
      </form>
    </section>
  );
}

function KycBlock({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <div className="border border-rule-soft bg-card p-6">
        <p className="text-sm text-ink-2">
          Votre identité est vérifiée. Vous pouvez sceller une offre sur tous
          les drops.
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
      <StartKycButton>
        {status === "rejected"
          ? "Recommencer la vérification"
          : "Vérifier mon identité"}
      </StartKycButton>
    </div>
  );
}

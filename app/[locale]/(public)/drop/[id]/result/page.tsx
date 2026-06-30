import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { formatDropNumber } from "@/lib/format";
import {
  computeBidOutcome,
  type BidRow,
  type SerialOfferRow,
  type TxRow,
} from "@/lib/drops/bid-outcome";
import { RevealWon } from "@/components/reveal/reveal-won";
import { RevealOutbid } from "@/components/reveal/reveal-outbid";
import { RevealBelowFloor } from "@/components/reveal/reveal-below-floor";
import { RevealCaptureFailed } from "@/components/reveal/reveal-capture-failed";
import type { Locale } from "@/i18n/routing";
import type { Tables } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/*
 * Resultat acheteur post-reveal — Track A, etape 2.
 * Route choisie d'apres le setup existant du site : /drop/[id]/result
 * (singulier, [id]), pas /drops/[slug]/result du handoff (cf. memoire
 * buyer-journey-conventions). Nav + footer viennent du layout (public).
 *
 * Page strictement privee et personnalisee : metadata neutre + noindex.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reveal");
  return { title: t("metaDefault"), robots: { index: false, follow: false } };
}

const PARIS = "Europe/Paris";
const bcp = (locale: string) => (locale === "en" ? "en-GB" : "fr-FR");

/** "18:00 CET" — heure seule pour l'eyebrow. */
function formatTimeCET(iso: string, locale: string): string {
  const hm = new Intl.DateTimeFormat(bcp(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: PARIS,
  }).format(new Date(iso));
  return `${hm} CET`;
}

/** "26 Aug 2026, 18:00:04 CET" — horodatage de capture. */
function formatDateTimeCET(iso: string, locale: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(bcp(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: PARIS,
  }).format(d);
  const time = new Intl.DateTimeFormat(bcp(locale), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: PARIS,
  }).format(d);
  return `${date}, ${time} CET`;
}

/** Fenetre restante "23h 48min" pour le teaser privilege. */
function formatRemaining(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "0h 00min";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

/** Specs editoriales depuis le JSON drop.specs (cle: valeur). */
function readSpecs(raw: unknown): { label: string; value: string }[] {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, v]) => v != null && v !== "")
    .map(([label, v]) => ({ label, value: String(v) }));
}

export default async function ResultPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const locale = (await getLocale()) as Locale;

  const { data: drop } = await supabase
    .from("drops_public")
    .select(
      "id, drop_number, title, status, floor_price_cents, clearing_price_cents, exemplaires, reveal_at, specs, specs_en, brand:brands(name)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!drop) notFound();

  // Page reservee a l'auteur d'une offre : il faut etre connecte.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/drop/${params.id}/result`);

  // Pas encore revele : on renvoie vers la fiche drop (etat live / pre-reveal).
  const revealed = drop.reveal_at
    ? new Date(drop.reveal_at) <= new Date()
    : ["revealed", "closed", "completed", "shipped", "cancelled"].includes(
        drop.status ?? ""
      );
  if (!revealed) redirect(`/drop/${params.id}`);

  // RLS : chaque requete ne renvoie que les lignes de l'utilisateur.
  const [{ data: rpcBid }, { data: tx }, { data: offer }] = await Promise.all([
    supabase.rpc("my_bid_for_drop", { p_drop_id: params.id }).maybeSingle(),
    supabase
      .from("transactions")
      .select("id, amount_paid_cents, captured_at, status")
      .eq("drop_id", params.id)
      .maybeSingle(),
    supabase
      .from("serial_offers")
      .select("id, status, supplement_cents, serial_no, expires_at")
      .eq("drop_id", params.id)
      .maybeSingle(),
  ]);

  const bid = rpcBid as unknown as (Tables<"bids"> & BidRow) | null;
  const outcome = computeBidOutcome({
    bid: bid
      ? {
          amount_cents: bid.amount_cents,
          status: bid.status,
          stripe_auth_status: bid.stripe_auth_status,
        }
      : null,
    tx: (tx as TxRow) ?? null,
    serialOffer: (offer as SerialOfferRow) ?? null,
    clearingCents: drop.clearing_price_cents ?? null,
    floorCents: drop.floor_price_cents ?? null,
  });

  // Issue non calculable (pas d'offre, drop annule sans clearing) : fiche drop.
  if (!outcome) redirect(`/drop/${params.id}`);

  const brand = (drop.brand as { name: string } | null)?.name ?? null;
  const dropNumber = drop.drop_number ?? 0;
  const revealTime = drop.reveal_at
    ? formatTimeCET(drop.reveal_at, locale)
    : "18:00 CET";
  const count = drop.exemplaires ?? 0;
  const specsRaw = locale === "en" ? (drop.specs_en ?? drop.specs) : drop.specs;

  if (outcome.kind === "capture_failed") {
    return <RevealCaptureFailed dropNumber={dropNumber} />;
  }

  if (outcome.kind === "won" || outcome.kind === "won_privilege") {
    const txId = (tx as { id?: string } | null)?.id ?? null;
    return (
      <RevealWon
        locale={locale}
        dropNumber={dropNumber}
        revealTime={revealTime}
        count={count}
        clearingCents={outcome.clearingCents}
        bidCents={outcome.bidCents}
        brand={brand}
        pieceTitle={drop.title ?? ""}
        specs={readSpecs(specsRaw)}
        email={user.email ?? ""}
        order={
          txId
            ? {
                ref: `DN-${formatDropNumber(dropNumber)}-${txId.slice(0, 8).toUpperCase()}`,
                dropTitle: drop.title ?? "",
                capturedAtLabel: tx?.captured_at
                  ? formatDateTimeCET(tx.captured_at, locale)
                  : null,
                amountCents: tx?.amount_paid_cents ?? null,
              }
            : null
        }
        privilege={
          outcome.kind === "won_privilege"
            ? {
                remaining: formatRemaining(outcome.expiresAt),
                href: `/account/offre/${outcome.offerId}`,
              }
            : null
        }
      />
    );
  }

  if (outcome.kind === "outbid") {
    return (
      <RevealOutbid
        locale={locale}
        dropNumber={dropNumber}
        revealTime={revealTime}
        count={count}
        clearingCents={outcome.clearingCents}
        bidCents={outcome.bidCents}
        floorCents={outcome.floorCents}
      />
    );
  }

  return (
    <RevealBelowFloor
      locale={locale}
      dropNumber={dropNumber}
      revealTime={revealTime}
      bidCents={outcome.bidCents}
      floorCents={outcome.floorCents}
      clearingCents={drop.clearing_price_cents ?? null}
    />
  );
}

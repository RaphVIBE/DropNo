"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { formatAmount, formatEuros } from "@/lib/format";
import { formatSerial } from "@/lib/privilege";
import { getStripe } from "@/lib/stripe/browser";

/**
 * Privilège № 001 — « lettre privée » post-reveal (voir Privilege_001.md +
 * mockups/dropno-buyer-privilege.html). Mise en page éditoriale plein écran,
 * centrée, ton sobre : aucune mention publique.
 *
 * États : offre active (réserver / conserver), paiement (Stripe Elements),
 * confirmé, refusé, expiré (Lock 1 : même page, CTA désactivés + message).
 * La logique de paiement et les endpoints /api/serial-offers/* sont inchangés.
 */

export type SerialOfferData = {
  id: string;
  status: string;
  supplementCents: number;
  expiresAt: string;
  serialNo: number;
  dropNumber: number;
  title: string;
  heroImageUrl: string | null;
  exemplaires: number;
  paidCents: number | null;
  bidCents: number | null;
  recipientName: string | null;
  dropId: string;
};

export function SerialOfferView({ offer }: { offer: SerialOfferData }) {
  const t = useTranslations("accountOffer");
  const locale = useLocale() as "fr" | "en";
  const [phase, setPhase] = useState<
    "offer" | "card" | "accepted" | "declined"
  >(offer.status === "accepted" ? "accepted" : "offer");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const serialPad = pad(offer.serialNo);
  const serialFull = formatSerial(offer.serialNo, offer.exemplaires);
  const backHref = `/drop/${offer.dropId}/result`;
  const expired = useCountdownExpired(offer.expiresAt);
  const remaining = useRemainingLabel(offer.expiresAt, {
    hm: (h, m) => t("remainingHoursMinutes", { hours: h, minutes: m }),
    m: (m) => t("remainingMinutes", { minutes: m }),
  });

  async function startPayment() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/serial-offers/${offer.id}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("errorGeneric"));
        return;
      }
      if (data.accepted) {
        setPhase("accepted");
        return;
      }
      setClientSecret(data.clientSecret as string);
      setPhase("card");
    } catch {
      setError(t("errorNetwork"));
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/serial-offers/${offer.id}/decline`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("errorGeneric"));
        return;
      }
      setPhase("declined");
    } catch {
      setError(t("errorNetwork"));
    } finally {
      setBusy(false);
    }
  }

  const recipient = offer.recipientName
    ? t("recipient", { name: offer.recipientName })
    : t("recipientGeneric");

  // --- États terminaux ---
  if (phase === "accepted") {
    return (
      <Frame backHref={backHref} backLabel={t("back")}>
        <Recipient>{recipient}</Recipient>
        <Title>{t("acceptedTitle")}</Title>
        <Context>{t("acceptedBody", { title: offer.title, serial: serialFull })}</Context>
        <BackLink label={t("backLink")} />
      </Frame>
    );
  }

  if (phase === "declined" || offer.status === "declined") {
    return (
      <Frame backHref={backHref} backLabel={t("back")}>
        <Recipient>{recipient}</Recipient>
        <Title>{t("declinedTitle")}</Title>
        <Context>{t("declinedBody")}</Context>
        <BackLink label={t("backLink")} />
      </Frame>
    );
  }

  // Lock 1 : expirée. Même lettre, message de réassignation, CTA désactivés
  // (libellés neutres : on ne dévoile plus le supplément).
  if (offer.status !== "pending" || expired) {
    return (
      <Frame backHref={backHref} backLabel={t("back")}>
        <Recipient>{recipient}</Recipient>
        <Title>{t("expiredTitle")}</Title>
        <div className="my-12 border-y border-rule py-12 md:my-14 md:py-14">
          <p className="mx-auto max-w-[560px] text-[15px] leading-relaxed text-ink-2">
            {t("expiredBody", { serial: serialPad })}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.rich("expiredContact", {
              link: (c) => (
                <a
                  href="mailto:hello@dropno.eu"
                  className="border-b border-rule pb-px text-ink-2 hover:text-foreground"
                >
                  {c}
                </a>
              ),
            })}
          </p>
        </div>
        <div className="mx-auto max-w-[480px]">
          <button type="button" disabled className={EDITORIAL_BTN}>
            {t("reserveCta")}
          </button>
          <button type="button" disabled className={EDITORIAL_BTN_GHOST}>
            {t("keepClearing")}
          </button>
        </div>
      </Frame>
    );
  }

  // --- Étape paiement ---
  if (phase === "card" && clientSecret) {
    return (
      <Frame backHref={backHref} backLabel={t("back")}>
        <Recipient>{recipient}</Recipient>
        <Title>{t("reserveTitle")}</Title>
        <p className="mb-2 font-serif text-2xl italic text-champagne-deep">
          {formatEuros(offer.supplementCents, locale)}
        </p>
        <Context>
          {offer.paidCents
            ? t("supplementNotePaid", {
                paid: formatEuros(offer.paidCents, locale),
              })
            : t("supplementNote")}
        </Context>
        <div className="mx-auto mt-10 max-w-[480px] text-left">
          <Elements
            stripe={getStripe()}
            options={{ clientSecret, appearance: { theme: "flat" } }}
          >
            <CardStep
              offerId={offer.id}
              onConfirmed={() => setPhase("accepted")}
              onBack={() => setPhase("offer")}
            />
          </Elements>
        </div>
      </Frame>
    );
  }

  // --- Offre active ---
  const showFigures = offer.bidCents != null && offer.paidCents != null;
  return (
    <Frame backHref={backHref} backLabel={t("back")}>
      <Recipient>{recipient}</Recipient>
      <Title>{t("claimTitle", { serial: serialPad })}</Title>

      <Context>
        {showFigures
          ? t.rich("contextLine", {
              bid: formatEuros(offer.bidCents as number, locale),
              clearing: formatEuros(offer.paidCents as number, locale),
              count: offer.exemplaires,
              strike: (c) => (
                <span className="tabular-nums text-muted-foreground line-through decoration-muted-2 decoration-1">
                  {c}
                </span>
              ),
              pay: (c) => <span className="tabular-nums text-foreground">{c}</span>,
            })
          : t("contextLineSimple")}
      </Context>

      {/* Supplément, le nombre titre */}
      <div className="my-12 border-y border-rule py-12 md:my-14 md:py-14">
        <div className="mb-[18px] text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("supplementLabel")}
        </div>
        <div className="mb-3.5 font-serif text-[clamp(64px,11vw,120px)] font-light italic leading-none tracking-[-0.035em] tabular-nums text-champagne-deep">
          <span className="mr-[0.08em] text-[0.72em] tracking-normal text-muted-foreground">
            +
          </span>
          <span className="mr-[0.14em] align-[0.45em] text-[0.36em] tracking-normal text-ink-2">
            EUR
          </span>
          {formatAmount(offer.supplementCents, locale)}
        </div>
        <div className="font-serif text-sm italic text-muted-foreground">
          {t("supplementNoteOffer")}
        </div>
      </div>

      {error ? (
        <p className="mb-6 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="mx-auto mb-9 max-w-[480px]">
        <button
          type="button"
          onClick={startPayment}
          disabled={busy}
          className={EDITORIAL_BTN}
        >
          {busy
            ? t("preparing")
            : t("reserveCtaAmount", {
                serial: serialPad,
                amount: formatEuros(offer.supplementCents, locale),
              })}
        </button>
        <button
          type="button"
          onClick={decline}
          disabled={busy}
          className={EDITORIAL_BTN_GHOST}
        >
          {t("keepClearing")}
        </button>
      </div>

      <div className="mb-12 text-[13px] text-muted-foreground">
        {remaining
          ? t.rich("expiresLine", {
              remaining,
              rem: (c) => (
                <span className="font-serif italic tabular-nums text-ink-2">
                  {c}
                </span>
              ),
            })
          : null}
      </div>

      <details className="mx-auto max-w-[580px] text-sm">
        <summary className="inline cursor-pointer list-none border-b border-rule pb-0.5 text-muted-foreground hover:text-ink-2 [&::-webkit-details-marker]:hidden">
          {t("whyToggle")}
        </summary>
        <div className="mt-[22px] border-t border-rule-soft pt-[22px] text-left text-sm leading-[1.7] text-ink-2">
          {t("whyBody", { serial: serialPad })}
        </div>
      </details>
    </Frame>
  );
}

function CardStep({
  offerId,
  onConfirmed,
  onBack,
}: {
  offerId: string;
  onConfirmed: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("accountOffer");
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? t("paymentFailed"));
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Ceinture-bretelles : confirmation synchrone (le webhook fait foi).
      try {
        await fetch(`/api/serial-offers/${offerId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
      } catch {
        // Le webhook prendra le relais.
      }
      onConfirmed();
      return;
    }

    if (paymentIntent && paymentIntent.status === "processing") {
      onConfirmed();
      return;
    }

    setError(t("paymentIncomplete"));
    setSubmitting(false);
  }

  return (
    <div>
      <PaymentElement />
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <button
        type="button"
        onClick={confirm}
        disabled={!stripe || submitting}
        className={EDITORIAL_BTN + " mt-6"}
      >
        {submitting ? t("paying") : t("confirmCta")}
      </button>
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="mt-3 block w-full rounded-sm text-center text-sm underline underline-offset-4 hover:text-champagne-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
      >
        {t("back")}
      </button>
    </div>
  );
}

// --- hooks & primitives ---

function useCountdownExpired(expiresAt: string): boolean {
  const [expired, setExpired] = useState(
    () => new Date(expiresAt).getTime() <= Date.now()
  );
  useEffect(() => {
    const t = setInterval(
      () => setExpired(new Date(expiresAt).getTime() <= Date.now()),
      30_000
    );
    return () => clearInterval(t);
  }, [expiresAt]);
  return expired;
}

function useRemainingLabel(
  expiresAt: string,
  fmt: {
    hm: (hours: number, minutes: string) => string;
    m: (minutes: number) => string;
  }
): string | null {
  const compute = useMemo(
    () => () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) return null;
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      return h > 0 ? fmt.hm(h, String(m).padStart(2, "0")) : fmt.m(m);
    },
    [expiresAt, fmt]
  );
  const [label, setLabel] = useState<string | null>(compute);
  useEffect(() => {
    const t = setInterval(() => setLabel(compute()), 30_000);
    return () => clearInterval(t);
  }, [compute]);
  return label;
}

function pad(n: number): string {
  return String(n).padStart(3, "0");
}

/** Cadre éditorial plein écran : en-tête sobre (wordmark + retour), corps
 *  centré, pied minimal. /account n'a pas de chrome global. */
function Frame({
  backHref,
  backLabel,
  children,
}: {
  backHref: string;
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-rule-soft px-gutter py-[18px]">
        <Link
          href="/"
          className="font-serif text-[22px] font-light italic tracking-[-0.01em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Drop <sup className="ml-[-2px] align-super text-[0.78em]">№</sup>
        </Link>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span aria-hidden className="font-serif italic">
            ←
          </span>
          {backLabel}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[820px] flex-1 px-gutter pb-24 pt-24 text-center md:pt-28">
        {children}
      </main>
      <footer className="border-t border-rule-soft px-gutter py-7 text-center text-[11px] text-muted-foreground">
        <a
          href="mailto:hello@dropno.eu"
          className="border-b border-rule-soft pb-px hover:text-ink-2"
        >
          hello@dropno.eu
        </a>
      </footer>
    </div>
  );
}

function Recipient({ children }: { children: ReactNode }) {
  return (
    <p className="mb-12 text-[11px] uppercase tracking-[0.22em] text-champagne-deep md:mb-14">
      <span
        aria-hidden
        className="mr-2.5 inline-block h-1 w-1 rotate-45 bg-champagne-deep align-middle"
      />
      {children}
    </p>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-10 font-serif text-[clamp(56px,10vw,120px)] font-light italic leading-[0.95] tracking-[-0.03em]">
      {children}
    </h1>
  );
}

function Context({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto max-w-[620px] text-base leading-relaxed text-ink-2">
      {children}
    </p>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/account/dashboard"
      className="mt-12 inline-block rounded-sm text-sm underline underline-offset-4 hover:text-champagne-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {label}
    </Link>
  );
}

const EDITORIAL_BTN =
  "block w-full border border-foreground bg-foreground px-6 py-5 text-center text-xs font-medium uppercase tracking-[0.18em] text-background transition-opacity duration-200 ease-quart hover:opacity-[0.88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40";

const EDITORIAL_BTN_GHOST =
  "mt-2.5 block w-full border border-rule bg-transparent px-6 py-5 text-center text-xs font-medium uppercase tracking-[0.18em] text-ink-2 transition-colors duration-200 ease-quart hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40";

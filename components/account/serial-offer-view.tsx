"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { formatEuros } from "@/lib/format";
import { formatSerial } from "@/lib/privilege";
import { getStripe } from "@/lib/stripe/browser";

/**
 * Privilège № 001 — vue « Une dernière chose » (voir Privilege_001.md).
 *
 * Trois états : offre active (CTA réserver / conserver), paiement (Elements),
 * confirmé. La discrétion prime : aucune mention publique, ton sobre.
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

  const serial = formatSerial(offer.serialNo, offer.exemplaires);
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
        // Dev sans Stripe : acceptation directe.
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

  // --- États terminaux ---
  if (phase === "accepted") {
    return (
      <Shell>
        <Eyebrow>{t("eyebrow", { number: pad(offer.dropNumber) })}</Eyebrow>
        <h1 className="font-display mb-6 text-4xl">{t("acceptedTitle")}</h1>
        <p className="text-sm leading-relaxed text-ink-2">
          {t("acceptedBody", { title: offer.title, serial })}
        </p>
        <BackLink label={t("backLink")} />
      </Shell>
    );
  }

  if (phase === "declined" || offer.status === "declined") {
    return (
      <Shell>
        <Eyebrow>{t("eyebrow", { number: pad(offer.dropNumber) })}</Eyebrow>
        <h1 className="font-display mb-6 text-4xl">{t("declinedTitle")}</h1>
        <p className="text-sm leading-relaxed text-ink-2">
          {t("declinedBody")}
        </p>
        <BackLink label={t("backLink")} />
      </Shell>
    );
  }

  if (offer.status !== "pending" || expired) {
    return (
      <Shell>
        <Eyebrow>{t("eyebrow", { number: pad(offer.dropNumber) })}</Eyebrow>
        <h1 className="font-display mb-6 text-4xl">
          {t("expiredTitle")}
        </h1>
        <p className="text-sm leading-relaxed text-ink-2">
          {t("expiredBody")}
        </p>
        <BackLink label={t("backLink")} />
      </Shell>
    );
  }

  // --- Étape paiement ---
  if (phase === "card" && clientSecret) {
    return (
      <Shell>
        <Eyebrow>{t("eyebrow", { number: pad(offer.dropNumber) })}</Eyebrow>
        <h1 className="font-display mb-2 text-4xl">{t("reserveTitle")}</h1>
        <p className="mb-1 font-serif text-lg italic">
          {formatEuros(offer.supplementCents, locale)}
        </p>
        <p className="mb-6 text-sm text-ink-2">
          {offer.paidCents
            ? t("supplementNotePaid", {
                paid: formatEuros(offer.paidCents, locale),
              })
            : t("supplementNote")}
        </p>
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
      </Shell>
    );
  }

  // --- Offre active ---
  return (
    <Shell>
      <Eyebrow>{t("eyebrow", { number: pad(offer.dropNumber) })}</Eyebrow>
      <h1 className="font-display mb-6 text-4xl">{t("offerTitle")}</h1>
      <p className="text-sm leading-relaxed text-ink-2">
        {t.rich("offerLead", {
          serial,
          em: (chunks) => (
            <span className="font-serif italic text-foreground">{chunks}</span>
          ),
        })}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink-2">
        {t.rich("offerSupplement", {
          amount: formatEuros(offer.supplementCents, locale),
          em: (chunks) => (
            <span className="font-serif italic text-foreground">{chunks}</span>
          ),
        })}
      </p>

      <dl className="mt-8 grid gap-3 border-y border-rule py-5 text-sm">
        <Row label={t("rowPiece")} value={offer.title} />
        <Row label={t("rowSerial")} value={serial} />
        <Row
          label={t("rowSupplement")}
          value={formatEuros(offer.supplementCents, locale)}
        />
        {remaining ? (
          <Row label={t("rowExpiresIn")} value={remaining} />
        ) : null}
      </dl>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <button
        type="button"
        onClick={startPayment}
        disabled={busy}
        className={CTA_CLASS}
      >
        {busy ? t("preparing") : t("reserveCta")}
      </button>
      <button
        type="button"
        onClick={decline}
        disabled={busy}
        className="mt-4 block w-full rounded-sm text-center text-sm underline underline-offset-4 hover:text-champagne-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
      >
        {t("keepNumber")}
      </button>
    </Shell>
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
      // Ceinture-bretelles : confirmation synchrone côté serveur (le webhook
      // payment_intent.succeeded fait foi de toute façon, idempotent).
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
      // Paiement en cours de traitement : le webhook finalisera.
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
        className={CTA_CLASS}
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-xl px-7 py-20 md:px-0">
      <div className="border border-rule bg-card p-8 md:p-10">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-3">{children}</p>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-serif italic text-foreground">{value}</dd>
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/account/dashboard"
      className="mt-8 inline-block rounded-sm text-sm underline underline-offset-4 hover:text-champagne-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {label}
    </Link>
  );
}

const CTA_CLASS =
  "mt-6 block w-full bg-primary px-6 py-[18px] text-center text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

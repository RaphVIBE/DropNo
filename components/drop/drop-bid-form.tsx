"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { formatEuros } from "@/lib/format";
import { getStripe } from "@/lib/stripe/browser";

const STRIPE_ENABLED = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

type Props = {
  dropId: string;
  floorPriceCents: number;
  bidCount: number;
  isAuthenticated: boolean;
  kycStatus: string;
  isOpen: boolean;
  isLocked: boolean;
  existingBidCents: number | null;
  loginHref: string;
};

export function DropBidForm(props: Props) {
  const {
    dropId,
    floorPriceCents,
    bidCount,
    isAuthenticated,
    kycStatus,
    isOpen,
    isLocked,
    existingBidCents,
    loginHref,
  } = props;

  const t = useTranslations("bidForm");
  const locale = useLocale();

  // --- Drop pas ouvert ---
  if (!isOpen) {
    return (
      <Panel>
        <p className="text-sm text-ink-2">{t("notOpen")}</p>
      </Panel>
    );
  }

  // --- Offres verrouillées (T-1h) ---
  if (isLocked) {
    return (
      <Panel>
        <Head bidCount={bidCount} />
        {existingBidCents ? (
          <p className="text-sm text-ink-2">
            {t("lockedWithBidPrefix")}{" "}
            <span className="font-serif text-lg italic text-foreground">
              {formatEuros(existingBidCents, locale)}
            </span>
            {t("lockedWithBidSuffix")}
          </p>
        ) : (
          <p className="text-sm text-ink-2">{t("lockedNoBid")}</p>
        )}
      </Panel>
    );
  }

  // --- Pas connecté ---
  if (!isAuthenticated) {
    return (
      <Panel>
        <Head bidCount={bidCount} />
        <p className="mb-5 text-sm text-ink-2">{t("loginPrompt")}</p>
        <Cta as="link" href={loginHref}>
          {t("loginCta")}
        </Cta>
        <Fine />
      </Panel>
    );
  }

  // --- Connecté mais KYC non vérifié ---
  if (kycStatus !== "verified") {
    return <KycGate status={kycStatus} bidCount={bidCount} />;
  }

  // --- Peut bidder (créer ou modifier) ---
  return (
    <BidEntry
      dropId={dropId}
      floorPriceCents={floorPriceCents}
      bidCount={bidCount}
      existingBidCents={existingBidCents}
    />
  );
}

function BidEntry({
  dropId,
  floorPriceCents,
  bidCount,
  existingBidCents,
}: {
  dropId: string;
  floorPriceCents: number;
  bidCount: number;
  existingBidCents: number | null;
}) {
  const t = useTranslations("bidForm");
  const locale = useLocale();
  const [raw, setRaw] = useState(
    existingBidCents ? String(Math.round(existingBidCents / 100)) : ""
  );
  const [step, setStep] = useState<"amount" | "card" | "sealed">("amount");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sealedCents, setSealedCents] = useState<number | null>(
    existingBidCents
  );

  const euros = raw ? parseInt(raw, 10) : 0;
  const amountCents = euros * 100;
  const belowFloor = amountCents > 0 && amountCents < floorPriceCents;
  const isModify = sealedCents != null;

  async function handleSubmitAmount(e: React.FormEvent) {
    e.preventDefault();
    if (!amountCents || belowFloor) return;
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dropId, amountCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? t("errorGeneric"));
        return;
      }
      setStatus("idle");
      if (data.clientSecret) {
        // Etape carte (Stripe configure) : pre-autorisation a confirmer.
        setClientSecret(data.clientSecret as string);
        setStep("card");
      } else {
        // Pas d'etape carte (dev sans cle Stripe) : offre scellee directement.
        setSealedCents(amountCents);
        setStep("sealed");
      }
    } catch {
      setStatus("error");
      setMessage(t("errorServer"));
    }
  }

  function handleCardConfirmed() {
    setSealedCents(amountCents);
    setClientSecret(null);
    setStep("sealed");
  }

  // --- Offre scellee ---
  if (step === "sealed" && sealedCents) {
    return (
      <Panel>
        <Head bidCount={bidCount} />
        <p className="font-serif text-lg italic">
          {t("sealedAmount", { amount: formatEuros(sealedCents, locale) })}
        </p>
        <p className="mt-2 text-sm text-ink-2">{t("sealedNote")}</p>
        <button
          type="button"
          onClick={() => {
            setStep("amount");
            setStatus("idle");
          }}
          className="mt-4 rounded-sm text-sm underline underline-offset-4 hover:text-champagne-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t("modifyBid")}
        </button>
      </Panel>
    );
  }

  // --- Etape carte : pre-autorisation Stripe (Payment Element) ---
  if (step === "card" && clientSecret) {
    return (
      <Panel>
        <Head bidCount={bidCount} />
        <p className="mb-1 font-serif text-lg italic">
          {formatEuros(amountCents, locale)}
        </p>
        <p className="mb-5 text-sm text-ink-2">{t("cardPreauthNote")}</p>
        <Elements
          stripe={getStripe()}
          options={{ clientSecret, appearance: { theme: "flat" } }}
        >
          <CardStep
            onConfirmed={handleCardConfirmed}
            onBack={() => setStep("amount")}
          />
        </Elements>
        <Fine />
      </Panel>
    );
  }

  // --- Etape montant ---
  return (
    <Panel>
      <Head bidCount={bidCount} />
      <form onSubmit={handleSubmitAmount}>
        <div className="flex items-baseline gap-2 border-b border-foreground py-3 transition-colors focus-within:border-champagne-deep">
          <input
            type="text"
            inputMode="numeric"
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={String(Math.round(floorPriceCents / 100))}
            aria-label={t("amountInputLabel")}
            className="w-full flex-1 bg-transparent font-serif text-4xl italic tabular-nums text-foreground outline-none placeholder:text-rule"
          />
          <span className="font-serif text-3xl italic text-muted-foreground">
            €
          </span>
        </div>

        {belowFloor ? (
          <p className="mt-3 text-sm text-destructive">
            {t("belowFloor", { floor: formatEuros(floorPriceCents, locale) })}
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-3 text-sm text-destructive">{message}</p>
        ) : null}

        <Cta
          as="button"
          disabled={status === "submitting" || !amountCents || belowFloor}
        >
          {status === "submitting"
            ? t("preparing")
            : isModify
              ? t("modifyBid")
              : STRIPE_ENABLED
                ? t("continue")
                : t("sealBid")}
        </Cta>
      </form>
      <Fine />
    </Panel>
  );
}

/**
 * Etape de confirmation carte. Monte le Payment Element et confirme la
 * pre-autorisation (PaymentIntent en capture manuelle) on-session. Une carte
 * deja enregistree sur le Customer est proposee automatiquement.
 */
function CardStep({
  onConfirmed,
  onBack,
}: {
  onConfirmed: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("bidForm");
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
      setError(confirmError.message ?? t("preauthFailed"));
      setSubmitting(false);
      return;
    }

    // Capture manuelle : la carte autorisee laisse le PI en `requires_capture`.
    if (
      paymentIntent &&
      (paymentIntent.status === "requires_capture" ||
        paymentIntent.status === "processing")
    ) {
      onConfirmed();
      return;
    }

    setError(t("cardPreauthError"));
    setSubmitting(false);
  }

  return (
    <div>
      <PaymentElement />
      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}
      <Cta as="button" onClick={confirm} disabled={!stripe || submitting}>
        {submitting ? t("sealing") : t("sealBid")}
      </Cta>
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="mt-3 block w-full rounded-sm text-center text-sm underline underline-offset-4 hover:text-champagne-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
      >
        {t("modifyAmount")}
      </button>
    </div>
  );
}

function KycGate({ status, bidCount }: { status: string; bidCount: number }) {
  const t = useTranslations("bidForm");

  // Vérification en cours : le webhook Stripe n'a pas encore confirmé.
  if (status === "verifying") {
    return (
      <Panel>
        <Head bidCount={bidCount} />
        <div className="mb-3 flex items-center gap-2 text-ink-2">
          <span className="status-dot" aria-hidden />
          <span className="text-[11px] font-medium uppercase tracking-[0.18em]">
            {t("kycVerifyingLabel")}
          </span>
        </div>
        <p className="text-sm text-ink-2">{t("kycVerifyingNote")}</p>
      </Panel>
    );
  }

  const rejected = status === "rejected";
  return (
    <Panel>
      <Head bidCount={bidCount} />
      <p className="mb-5 text-sm text-ink-2">
        {rejected ? t("kycRejectedNote") : t("kycRequiredNote")}
      </p>
      <Link href="/account/verification" className={CTA_CLASS}>
        {rejected ? t("kycResumeCta") : t("kycVerifyCta")}
      </Link>
      <Fine />
    </Panel>
  );
}

// --- primitives de présentation ---

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 border border-rule bg-card p-7">{children}</div>
  );
}

function Head({ bidCount }: { bidCount: number }) {
  const t = useTranslations("bidForm");
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {t("headLabel")}
      </span>
      <span className="font-serif text-sm italic text-ink-2">
        {t("bidsSubmitted", { count: bidCount })}
      </span>
    </div>
  );
}

function Fine() {
  const t = useTranslations("bidForm");
  return (
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
      {t("finePrint")}{" "}
      <Link
        href="/mecanisme"
        className="rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {t("howDropWorks")}
      </Link>
    </p>
  );
}

type CtaProps = {
  children: React.ReactNode;
} & (
  | { as: "link"; href: string }
  | {
      as: "button";
      onClick?: () => void;
      disabled?: boolean;
    }
);

const CTA_CLASS =
  "mt-5 block w-full bg-primary px-6 py-[18px] text-center text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function Cta(props: CtaProps) {
  const className = CTA_CLASS;

  if (props.as === "link") {
    return (
      <Link href={props.href} className={className}>
        {props.children}
      </Link>
    );
  }
  return (
    <button
      type={props.onClick ? "button" : "submit"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={className}
    >
      {props.children}
    </button>
  );
}

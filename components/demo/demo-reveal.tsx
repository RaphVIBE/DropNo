"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { formatEuros } from "@/lib/format";

/**
 * Reveal éphémère des pages démo prospect.
 *
 * À l'ouverture (mount), un compteur démarre et tourne `DEMO_REVEAL_MS`. Rien
 * n'est persisté : chaque rafraîchissement repart de zéro. À T=0, un overlay
 * plein écran s'anime (port du mockup docs/design/mockups/reveal-hero.html) :
 * le prix se révèle par clip-path, puis la simulation du gain. Refermable.
 *
 * Affiché UNIQUEMENT en démo — la vraie fiche drop garde son DropCountdown vers
 * un reveal_at réel.
 */

const DEMO_REVEAL_MS = 45_000;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function DemoReveal({
  brandName,
  attenduCents,
  clearingCents,
  perPieceCents,
  editionGainCents,
  editionPieces,
  gainPct,
  locale,
}: {
  brandName: string;
  attenduCents: number;
  clearingCents: number;
  perPieceCents: number;
  editionGainCents: number;
  editionPieces: number;
  gainPct: number;
  locale: string;
}) {
  const t = useTranslations("demoReveal");
  const [msLeft, setMsLeft] = useState(DEMO_REVEAL_MS);
  const [phase, setPhase] = useState<"counting" | "revealed">("counting");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [visible, setVisible] = useState(false); // déclenche les transitions CSS
  const startRef = useRef<number | null>(null);

  // Compte à rebours depuis le mount.
  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - (startRef.current ?? Date.now());
      const left = Math.max(0, DEMO_REVEAL_MS - elapsed);
      setMsLeft(left);
      if (left <= 0) {
        setPhase("revealed");
        setOverlayOpen(true);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  // Une frame après l'ouverture de l'overlay, on ajoute `visible` pour jouer
  // les transitions (clip-path, fades).
  useEffect(() => {
    if (!overlayOpen) {
      setVisible(false);
      return;
    }
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [overlayOpen]);

  // Esc referme l'overlay.
  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlayOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  const totalSec = Math.ceil(msLeft / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const pulsing = msLeft <= 10_000 && phase === "counting";

  return (
    <div className="mb-8 border-y border-rule border-t-foreground py-6">
      {/* --- Panneau inline --- */}
      {phase === "counting" ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("countdownLabel")}
            </span>
          </div>
          <div
            className={`font-serif text-[clamp(2.6rem,9vw,4rem)] italic leading-none tabular-nums text-foreground ${
              pulsing ? "dr-pulse" : ""
            }`}
            suppressHydrationWarning
          >
            {pad(mm)}
            <span className="px-[0.05em] opacity-80">:</span>
            {pad(ss)}
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("countdownHint")}
          </p>
        </>
      ) : (
        // Récap inline une fois le reveal joué (panneau jamais vide).
        <div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-champagne-deep">
            {t("recapLabel")}
          </span>
          <p className="mt-2 font-serif text-[clamp(2.2rem,7vw,3rem)] italic leading-none tabular-nums text-foreground">
            {formatEuros(clearingCents, locale)}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            {t("recapNote", {
              pct: `+${gainPct}%`,
              piece: `+${formatEuros(perPieceCents, locale)}`,
            })}
          </p>
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            className="mt-4 text-[11px] uppercase tracking-[0.18em] text-champagne-deep underline-offset-4 transition-colors hover:underline"
          >
            {t("replay")}
          </button>
        </div>
      )}

      {/* --- Overlay reveal plein écran --- */}
      {overlayOpen ? (
        <div
          className={`dr-overlay ${visible ? "dr-visible" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={t("eyebrow", { brand: brandName })}
        >
          <button
            type="button"
            onClick={() => setOverlayOpen(false)}
            className="dr-close"
            aria-label={t("cta")}
          >
            {t("cta")} <span aria-hidden>↓</span>
          </button>

          <div className="dr-stage">
            <p className="dr-eyebrow">
              {t("eyebrow", { brand: brandName })}
            </p>
            <p className="dr-price font-serif">
              {formatEuros(clearingCents, locale)}
            </p>
            <p className="dr-detail font-serif">
              <span className="dr-struck">{formatEuros(attenduCents, locale)}</span>
              <span className="dr-arrow">→</span>
              <span className="dr-badge">+{gainPct}%</span>
            </p>

            <div className="dr-gain">
              <span>
                {t("gainPerPiece", { amount: `+${formatEuros(perPieceCents, locale)}` })}
              </span>
              <span className="dr-gain-sep" aria-hidden>
                ·
              </span>
              <span>
                {t("gainEdition", {
                  amount: `+${formatEuros(editionGainCents, locale)}`,
                  count: editionPieces,
                })}
              </span>
            </div>

            <p className="dr-verdict">
              <span className="dr-dot" aria-hidden />
              {t("verdict")}
            </p>
          </div>
        </div>
      ) : null}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes dr-pulse-kf {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.012); opacity: 0.92; }
        }
        .dr-pulse { animation: dr-pulse-kf 900ms cubic-bezier(0.16,1,0.3,1) infinite; }

        .dr-overlay {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column;
          padding: clamp(20px, 4vw, 56px);
          background: oklch(0.16 0.012 60);
          color: oklch(0.97 0.008 82);
          opacity: 0;
          transition: opacity 700ms cubic-bezier(0.16,1,0.3,1);
        }
        .dr-overlay.dr-visible { opacity: 1; }

        .dr-close {
          align-self: flex-end;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: oklch(0.95 0.008 82 / 0.7);
          background: none; border: none; cursor: pointer;
          transition: color 300ms ease;
        }
        .dr-close:hover { color: oklch(0.98 0.006 80); }

        .dr-stage {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
        }
        .dr-eyebrow {
          font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase;
          color: oklch(0.95 0.008 82 / 0.6);
          margin-bottom: 18px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 700ms cubic-bezier(0.16,1,0.3,1) 150ms,
                      transform 700ms cubic-bezier(0.16,1,0.3,1) 150ms;
        }
        .dr-visible .dr-eyebrow { opacity: 1; transform: translateY(0); }

        .dr-price {
          font-style: italic; font-weight: 300;
          font-size: clamp(72px, 17vw, 240px);
          line-height: 0.9; letter-spacing: -0.035em;
          font-feature-settings: "tnum";
          color: oklch(0.98 0.006 80);
          clip-path: inset(100% 0 0 0);
          transition: clip-path 1100ms cubic-bezier(0.87,0,0.13,1) 250ms;
        }
        .dr-visible .dr-price { clip-path: inset(0 0 0 0); }

        .dr-detail {
          margin-top: 24px;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          justify-content: center;
          font-style: italic; font-weight: 300;
          font-size: clamp(18px, 2.2vw, 26px);
          color: oklch(0.95 0.008 82 / 0.75);
          opacity: 0; transform: translateY(10px);
          transition: opacity 700ms cubic-bezier(0.16,1,0.3,1) 1400ms,
                      transform 700ms cubic-bezier(0.16,1,0.3,1) 1400ms;
        }
        .dr-visible .dr-detail { opacity: 1; transform: translateY(0); }
        .dr-struck { text-decoration: line-through; text-decoration-color: oklch(0.72 0.07 80 / 0.6); }
        .dr-arrow { color: oklch(0.78 0.07 80); }
        .dr-badge {
          font-family: var(--font-sans, Inter), sans-serif; font-style: normal;
          font-size: 14px; letter-spacing: 0.04em;
          border: 1px solid oklch(0.72 0.07 80 / 0.45);
          border-radius: 3px; padding: 4px 10px;
          color: oklch(0.82 0.07 80);
        }

        .dr-gain {
          margin-top: 32px;
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          justify-content: center;
          font-size: clamp(13px, 1.4vw, 15px);
          color: oklch(0.95 0.008 82 / 0.85);
          opacity: 0; transform: translateY(10px);
          transition: opacity 800ms cubic-bezier(0.16,1,0.3,1) 2100ms,
                      transform 800ms cubic-bezier(0.16,1,0.3,1) 2100ms;
        }
        .dr-visible .dr-gain { opacity: 1; transform: translateY(0); }
        .dr-gain-sep { color: oklch(0.78 0.07 80); }

        .dr-verdict {
          margin-top: 44px;
          display: flex; align-items: center; gap: 12px;
          font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;
          color: oklch(0.82 0.07 80);
          opacity: 0; transform: translateY(10px);
          transition: opacity 800ms cubic-bezier(0.16,1,0.3,1) 2700ms,
                      transform 800ms cubic-bezier(0.16,1,0.3,1) 2700ms;
        }
        .dr-visible .dr-verdict { opacity: 1; transform: translateY(0); }
        .dr-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: oklch(0.78 0.07 80);
          animation: dr-verdict-pulse 2s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        @keyframes dr-verdict-pulse {
          0%, 100% { box-shadow: 0 0 0 0 oklch(0.78 0.07 80 / 0.4); }
          50% { box-shadow: 0 0 0 8px oklch(0.78 0.07 80 / 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .dr-overlay, .dr-eyebrow, .dr-price, .dr-detail, .dr-gain, .dr-verdict {
            transition-duration: 1ms !important;
          }
          .dr-price { clip-path: inset(0 0 0 0) !important; }
          .dr-pulse, .dr-dot { animation: none !important; }
        }
      `,
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { formatEuros } from "@/lib/format";

/**
 * Reveal éphémère des pages démo prospect — fidèle au mockup reveal-hero.
 *
 * À l'ouverture (mount), un compteur démarre (DEMO_REVEAL_MS, redémarre à chaque
 * refresh). Escalade :
 *  - > 25s : compteur inline calme, la page reste navigable ;
 *  - 25s → 10s : les secondes se mettent à pulser ;
 *  - 10s → 0 : bascule fluide en COMPTE À REBOURS PLEIN ÉCRAN (inversion sombre,
 *    gros chiffres, pulse) ;
 *  - 0 : RÉVÉLATION côté client gagnant — « Félicitations … prix final X € »,
 *    commande clôturée, bouton retour au site.
 *
 * Affiché UNIQUEMENT en démo.
 */

const DEMO_REVEAL_MS = 45_000;
const FULLPAGE_AT_MS = 10_000; // bascule plein écran
const SECONDS_MOVE_AT_MS = 25_000; // les secondes commencent à bouger
const REVEAL_BEAT_MS = 700; // battement après T=0 avant la révélation

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function DemoReveal({
  brandName,
  pieceTitle,
  dropNumber,
  clearingCents,
  exemplaires,
  locale,
  homeHref = "/",
}: {
  brandName: string;
  pieceTitle: string;
  dropNumber: number;
  clearingCents: number;
  exemplaires: number;
  locale: string;
  homeHref?: string;
}) {
  const t = useTranslations("demoReveal");
  const [msLeft, setMsLeft] = useState(DEMO_REVEAL_MS);
  const [revealed, setRevealed] = useState(false);
  const [fullVisible, setFullVisible] = useState(false); // fade-in plein écran
  const [revealVisible, setRevealVisible] = useState(false); // transitions reveal
  const startRef = useRef<number | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compte à rebours depuis le mount.
  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - (startRef.current ?? Date.now());
      const left = Math.max(0, DEMO_REVEAL_MS - elapsed);
      setMsLeft(left);
      if (left <= 0 && !revealTimer.current) {
        revealTimer.current = setTimeout(() => setRevealed(true), REVEAL_BEAT_MS);
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => {
      clearInterval(id);
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  const showFull = msLeft <= FULLPAGE_AT_MS; // plein écran (compte à rebours + reveal)

  // Fade-in du plein écran une frame après son montage.
  useEffect(() => {
    if (!showFull) {
      setFullVisible(false);
      return;
    }
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setFullVisible(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [showFull]);

  // Déclenche les transitions de la révélation (clip-path, fades).
  useEffect(() => {
    if (!revealed) {
      setRevealVisible(false);
      return;
    }
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setRevealVisible(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  // Découpage temps.
  const totalSec = Math.ceil(msLeft / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  const inlineMin = Math.floor(totalSec / 60);
  const secondsMoving = msLeft <= SECONDS_MOVE_AT_MS && !showFull;

  return (
    <div className="mb-8 border-y border-rule border-t-foreground py-6">
      {/* --- Panneau inline (phase navigation) --- */}
      {!revealed ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("countdownLabel")}
            </span>
          </div>
          <div
            className="font-serif text-[clamp(2.6rem,9vw,4rem)] italic leading-none tabular-nums text-foreground"
            suppressHydrationWarning
          >
            {pad(inlineMin)}
            <span className="px-[0.05em] opacity-80">:</span>
            <span className={secondsMoving ? "dr-sec-move inline-block" : "inline-block"}>
              {pad(ss)}
            </span>
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("countdownHint")}
          </p>
        </>
      ) : (
        // Récap inline une fois la commande clôturée (panneau jamais vide).
        <div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-champagne-deep">
            {t("orderClosed")}
          </span>
          <p className="mt-2 font-serif text-[clamp(2.2rem,7vw,3rem)] italic leading-none tabular-nums text-foreground">
            {formatEuros(clearingCents, locale)}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            {t("recapNote")}
          </p>
        </div>
      )}

      {/* --- Plein écran : compte à rebours puis révélation --- */}
      {showFull ? (
        <div
          className={`dr-full ${fullVisible ? "dr-full-visible" : ""} ${
            revealVisible ? "dr-revealed" : ""
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={revealed ? t("congrats") : t("fullEyebrow")}
        >
          {/* En-tête plein écran */}
          <header className="dr-head">
            <span className="dr-wordmark font-serif">
              Drop <sup>№</sup> {pad(dropNumber)}
            </span>
            <span className="dr-head-piece">{brandName}</span>
          </header>

          <div className="dr-stage">
            {!revealed ? (
              <>
                <p className="dr-eyebrow">{t("fullEyebrow")}</p>
                <div className="dr-count font-serif" suppressHydrationWarning>
                  {pad(hh)}
                  <span className="dr-colon">:</span>
                  {pad(mm)}
                  <span className="dr-colon">:</span>
                  <span className="dr-count-s">{pad(ss)}</span>
                </div>
                <p className="dr-hint">{t("fullHint")}</p>
              </>
            ) : (
              <>
                <p className="dr-eyebrow">{t("resultEyebrow")}</p>
                <h2 className="dr-congrats font-serif">{t("congrats")}</h2>
                <p className="dr-won">{t("wonPiece", { piece: pieceTitle })}</p>

                <div className="dr-price-block">
                  <span className="dr-price-label">{t("finalPriceLabel")}</span>
                  <p className="dr-price font-serif">
                    {formatEuros(clearingCents, locale)}
                  </p>
                </div>

                <p className="dr-mechanism">
                  {t("mechanismNote", { count: exemplaires })}
                </p>

                <div className="dr-actions">
                  <span className="dr-closed">
                    <span className="dr-dot" aria-hidden />
                    {t("orderClosed")}
                  </span>
                  <a className="dr-back" href={homeHref}>
                    {t("backToSite")} <span aria-hidden>→</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes dr-pulse-kf {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.9; }
        }
        .dr-sec-move { animation: dr-pulse-kf 1s cubic-bezier(0.16,1,0.3,1) infinite; }

        /* ---- Plein écran ---- */
        .dr-full {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column;
          overflow-y: auto;
          padding: clamp(20px, 4vw, 56px);
          background: oklch(0.975 0.006 80);
          color: oklch(0.18 0.012 60);
          opacity: 0;
          transition: opacity 600ms cubic-bezier(0.16,1,0.3,1),
                      background 900ms cubic-bezier(0.16,1,0.3,1),
                      color 900ms cubic-bezier(0.16,1,0.3,1);
        }
        .dr-full-visible { opacity: 1; }
        /* Inversion sombre sur la revelation (compte a rebours -> resultat) */
        .dr-revealed {
          background: oklch(0.16 0.012 60);
          color: oklch(0.97 0.008 82);
        }

        .dr-head {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 16px; padding-bottom: 18px;
          border-bottom: 1px solid oklch(0.18 0.012 60 / 0.12);
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          transition: border-color 900ms ease;
        }
        .dr-revealed .dr-head { border-color: oklch(0.97 0.008 82 / 0.14); }
        .dr-wordmark { font-style: italic; font-size: 16px; text-transform: none; letter-spacing: 0; }
        .dr-wordmark sup { font-size: 0.6em; }
        .dr-head-piece { color: inherit; opacity: 0.6; }

        .dr-stage {
          flex: 1 0 auto;
          min-height: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: safe center; text-align: center;
          padding-block: 24px;
        }

        .dr-eyebrow {
          font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase;
          opacity: 0.55; margin-bottom: 20px;
        }

        /* compte a rebours */
        .dr-count {
          font-style: italic; font-weight: 300;
          font-size: clamp(64px, 15vw, 200px);
          line-height: 0.9; letter-spacing: -0.02em;
          font-feature-settings: "tnum";
          animation: dr-count-pulse 900ms cubic-bezier(0.7,0,0.3,1) infinite;
        }
        @keyframes dr-count-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.012); opacity: 0.93; }
        }
        .dr-colon { padding: 0 0.05em; opacity: 0.6; }
        .dr-count-s { color: oklch(0.52 0.06 70); }
        .dr-hint {
          margin-top: 16px;
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          opacity: 0.5;
        }

        /* revelation */
        .dr-congrats {
          font-style: italic; font-weight: 300;
          font-size: clamp(48px, 11vw, 120px); line-height: 0.95;
          opacity: 0; transform: translateY(10px);
          transition: opacity 700ms cubic-bezier(0.16,1,0.3,1) 150ms,
                      transform 700ms cubic-bezier(0.16,1,0.3,1) 150ms;
        }
        .dr-revealed .dr-congrats { opacity: 1; transform: translateY(0); }

        .dr-won {
          margin-top: 14px;
          font-size: clamp(15px, 1.8vw, 19px);
          opacity: 0; transform: translateY(8px);
          color: oklch(0.95 0.008 82 / 0.8);
          transition: opacity 700ms cubic-bezier(0.16,1,0.3,1) 500ms,
                      transform 700ms cubic-bezier(0.16,1,0.3,1) 500ms;
        }
        .dr-revealed .dr-won { opacity: 1; transform: translateY(0); }

        .dr-price-block { margin-top: 40px; }
        .dr-price-label {
          display: block;
          font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
          opacity: 0.55; margin-bottom: 10px;
          opacity: 0; transition: opacity 700ms ease 900ms;
        }
        .dr-revealed .dr-price-label { opacity: 0.55; }
        .dr-price {
          font-style: italic; font-weight: 300;
          font-size: clamp(72px, 16vw, 220px);
          line-height: 0.9; letter-spacing: -0.035em;
          font-feature-settings: "tnum";
          color: oklch(0.98 0.006 80);
          clip-path: inset(100% 0 0 0);
          transition: clip-path 1100ms cubic-bezier(0.87,0,0.13,1) 900ms;
        }
        .dr-revealed .dr-price { clip-path: inset(0 0 0 0); }

        .dr-mechanism {
          margin-top: 30px; max-width: 46ch;
          font-size: clamp(13px, 1.4vw, 15px); line-height: 1.6;
          color: oklch(0.95 0.008 82 / 0.7);
          opacity: 0; transform: translateY(8px);
          transition: opacity 800ms cubic-bezier(0.16,1,0.3,1) 1800ms,
                      transform 800ms cubic-bezier(0.16,1,0.3,1) 1800ms;
        }
        .dr-revealed .dr-mechanism { opacity: 1; transform: translateY(0); }

        .dr-actions {
          margin-top: 48px;
          display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
          justify-content: center;
          opacity: 0; transform: translateY(8px);
          transition: opacity 800ms cubic-bezier(0.16,1,0.3,1) 2300ms,
                      transform 800ms cubic-bezier(0.16,1,0.3,1) 2300ms;
        }
        .dr-revealed .dr-actions { opacity: 1; transform: translateY(0); }
        .dr-closed {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: oklch(0.82 0.07 80);
        }
        .dr-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: oklch(0.78 0.07 80);
          animation: dr-dot-pulse 2s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        @keyframes dr-dot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 oklch(0.78 0.07 80 / 0.4); }
          50% { box-shadow: 0 0 0 8px oklch(0.78 0.07 80 / 0); }
        }
        .dr-back {
          font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
          color: oklch(0.97 0.008 82);
          border: 1px solid oklch(0.97 0.008 82 / 0.3);
          border-radius: 3px; padding: 11px 20px;
          text-decoration: none;
          transition: background 280ms ease, color 280ms ease, border-color 280ms ease;
        }
        .dr-back:hover {
          background: oklch(0.97 0.008 82);
          color: oklch(0.16 0.012 60);
        }

        @media (prefers-reduced-motion: reduce) {
          .dr-full, .dr-congrats, .dr-won, .dr-price, .dr-mechanism, .dr-actions, .dr-price-label {
            transition-duration: 1ms !important;
          }
          .dr-price { clip-path: inset(0 0 0 0) !important; }
          .dr-sec-move, .dr-count, .dr-dot { animation: none !important; }
        }
      `,
        }}
      />
    </div>
  );
}

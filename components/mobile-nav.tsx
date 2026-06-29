"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Globe, Mail, Menu, User, X } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { LocaleSwitcher } from "@/components/locale-switcher";

type NavItem = { href: string; label: string };

type Labels = {
  open: string;
  close: string;
  menu: string;
  primaryNav: string;
  signIn: string;
  contact: string;
  language: string;
  utilityTitle: string;
};

/**
 * Menu mobile — déclencheur (hamburger) + overlay plein écran.
 *
 * Inspiré du pattern Audemars Piguet mobile, adapté à Drop No. :
 * - overlay opaque sur fond off-white (token --background),
 * - X de fermeture en haut, wordmark centré,
 * - nav principale en grandes lignes serif très espacées (une par ligne),
 * - séparateur, puis groupe utilitaire discret avec icônes (compte / globe).
 *
 * A11y : role="dialog" + aria-modal, scroll lock du body, fermeture par X /
 * Échap / clic sur le fond, focus trap, retour du focus sur le déclencheur,
 * aria-expanded / aria-controls bilingues, respect de prefers-reduced-motion
 * (la transition est gérée en CSS via la classe `mobile-nav-overlay`).
 *
 * Visible uniquement < sm (le bloc parent porte la classe `sm:hidden`).
 */
export function MobileNav({
  navItems,
  labels,
}: {
  navItems: NavItem[];
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // L'overlay est porté vers <body> (portal) : la barre de nav porte un
  // backdrop-filter qui crée un bloc conteneur pour `position: fixed`, ce qui
  // bornerait l'overlay à la hauteur de la barre. Le portal l'en libère.
  useEffect(() => setMounted(true), []);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  // Ferme le menu quand la route change (clic sur un lien).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Scroll lock du body + Échap + focus management pendant que l'overlay est ouvert.
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    // Place le focus sur le bouton de fermeture à l'ouverture.
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      // Focus trap : boucle le focus à l'intérieur du panneau.
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      // Retour du focus sur le déclencheur à la fermeture (X / Échap, même page).
      // Si l'overlay s'est fermé par navigation, le déclencheur a pu être
      // démonté : on ne tente le retour de focus que s'il est encore dans le DOM.
      const trigger = triggerRef.current;
      if (trigger && document.body.contains(trigger)) {
        trigger.focus();
      }
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-expanded={open}
        aria-controls={panelId}
        className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Menu className="h-6 w-6" strokeWidth={1.5} aria-hidden />
      </button>

      {open && mounted
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={labels.menu}
              className="mobile-nav-overlay fixed inset-0 z-[60] flex flex-col bg-background"
            >
              {/* Tête : X de fermeture + wordmark centré, aligné sur la barre. */}
              <div className="relative flex items-center justify-between border-b border-rule-soft px-7 py-[18px]">
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label={labels.close}
                  className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <X className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </button>
                <Link
                  href="/"
                  onClick={close}
                  className="absolute left-1/2 -translate-x-1/2 rounded-sm text-[22px] text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Wordmark />
                </Link>
                {/* Espaceur symétrique pour équilibrer le X et centrer le wordmark. */}
                <span aria-hidden className="h-11 w-11" />
              </div>

              {/* Corps scrollable : nav principale puis groupe utilitaire. */}
              <div className="flex-1 overflow-y-auto px-7 pb-12 pt-6">
                <nav aria-label={labels.primaryNav}>
                  <ul className="flex flex-col">
                    {navItems.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <li
                          key={item.href}
                          className="border-b border-rule-soft/70"
                        >
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className={`flex min-h-[60px] items-center font-serif text-[28px] font-light italic leading-none no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background ${
                              active
                                ? "text-foreground"
                                : "text-foreground/90 hover:text-foreground"
                            }`}
                          >
                            {active ? (
                              <span
                                aria-hidden
                                className="mr-3 inline-block h-[6px] w-[6px] rounded-full bg-champagne-deep"
                              />
                            ) : null}
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Groupe utilitaire — visuellement secondaire. */}
                <div className="mt-9">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-2">
                    {labels.utilityTitle}
                  </p>
                  <ul className="flex flex-col">
                    <li className="border-b border-rule-soft/60">
                      <Link
                        href="/login"
                        onClick={close}
                        className="flex min-h-[52px] items-center gap-3 text-sm text-ink-2 no-underline transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <User
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        {labels.signIn}
                      </Link>
                    </li>
                    <li className="border-b border-rule-soft/60">
                      <Link
                        href="/contact"
                        onClick={close}
                        className="flex min-h-[52px] items-center gap-3 text-sm text-ink-2 no-underline transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <Mail
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        {labels.contact}
                      </Link>
                    </li>
                    <li className="flex min-h-[52px] items-center gap-3 text-sm text-ink-2">
                      <Globe
                        className="h-[18px] w-[18px]"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <span className="sr-only">{labels.language}</span>
                      <LocaleSwitcher size="touch" />
                    </li>
                  </ul>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

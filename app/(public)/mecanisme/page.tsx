import { MechanismVariantA } from "@/components/home/mechanism-variant-a";
import { MechanismVariantB } from "@/components/home/mechanism-variant-b";

/* Page de test (throwaway) pour comparer les deux variantes du flux
 * mécanisme avant de câbler la gagnante dans la home. */
export default function MecanismeLabPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-24 px-7 py-20 md:px-16">
      <header className="space-y-3">
        <p className="eyebrow">Banc d'essai · mécanisme</p>
        <h1 className="font-display text-4xl md:text-5xl">
          Deux variantes du flux blueprint.
        </h1>
        <p className="max-w-xl text-ink-2">
          Schémas agrandis, sans texte d'explication. Comparez puis choisissez.
        </p>
      </header>

      <div className="space-y-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--champagne-deep)]">
          Variante A — Planche agrandie
        </p>
        <MechanismVariantA />
      </div>

      <hr className="border-rule-soft" />

      <div className="space-y-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--champagne-deep)]">
          Variante B — Mécanisme vivant
        </p>
        <MechanismVariantB />
      </div>
    </section>
  );
}

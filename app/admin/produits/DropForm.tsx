"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  isPlannable, parseDropFormat, DROP_FORMATS, type DropFormat, type DropStatus,
} from "@/lib/admin/drops";
import { toLocalInput } from "@/lib/admin/format";
import type { ActionState } from "./actions";

const DAY_MS = 86_400_000;

/** Décale une valeur <input datetime-local> de `ms` et la renvoie au même format (heure locale). */
function shiftLocal(local: string, ms: number): string {
  if (!local) return "";
  const t = new Date(local).getTime();
  if (Number.isNaN(t)) return "";
  const d = new Date(t + ms);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fmtLocal(local: string): string {
  if (!local) return "—";
  const d = new Date(local);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

type Brand = { id: string; name: string };
type RevealSlot = { value: string; label: string };
export type Drop = {
  id: string; brand_id: string; title: string; piece_reference: string | null;
  description: string | null; floor_price_cents: number; exemplaires: number;
  all_or_nothing?: boolean | null;
  format: string | null;
  bid_window_opens_at: string | null; bid_lock_at: string | null; reveal_at: string | null;
  hero_image_url: string | null; images_urls: string[] | null;
};

const label = "mb-1.5 block text-xs font-medium text-foreground/80";
const field =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const locked = "cursor-not-allowed opacity-50";

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="hover:bg-[oklch(0.78_0.075_82)]">
      {pending ? "Enregistrement…" : isNew ? "Créer le brouillon" : "Enregistrer"}
    </Button>
  );
}

export function DropForm({
  action, brands, revealSlots, drop, status,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  brands: Brand[];
  revealSlots: RevealSlot[];
  drop?: Drop;
  status?: DropStatus;
}) {
  const [state, formAction] = useFormState(action, {} as ActionState);
  const lock = status ? !isPlannable(status) : false;

  // Le reveal est l'ancre. Ouverture / verrouillage / annonce se dérivent du
  // preset du format ; « Paramètres avancés » permet de surcharger à la main.
  const initialReveal = toLocalInput(drop?.reveal_at);
  const initialOpen = toLocalInput(drop?.bid_window_opens_at);
  const initialLock = toLocalInput(drop?.bid_lock_at);
  const initialFormat = parseDropFormat(drop?.format);
  const p0 = DROP_FORMATS[initialFormat];

  // Un drop existant qui s'écarte des défauts (reveal hors créneau, ouverture ou
  // verrouillage custom) ouvre d'emblée le mode avancé.
  const revealOffSlot = !!initialReveal && !revealSlots.some((s) => s.value === initialReveal);
  const openCustom =
    !!initialOpen && !!initialReveal && initialOpen !== shiftLocal(initialReveal, -p0.windowDays * DAY_MS);
  const lockCustom =
    !!initialLock && !!initialReveal && initialLock !== shiftLocal(initialReveal, -p0.lockBeforeMs);
  const hasCustom = revealOffSlot || openCustom || lockCustom;

  const [format, setFormat] = useState<DropFormat>(initialFormat);
  const [revealLocal, setRevealLocal] = useState(initialReveal);
  const [advanced, setAdvanced] = useState(hasCustom);
  const [openLocal, setOpenLocal] = useState(initialOpen);
  const [lockLocal, setLockLocal] = useState(initialLock);

  const preset = DROP_FORMATS[format];

  // Valeurs dérivées du reveal (servent de défaut et d'aperçu).
  const derivedOpen = useMemo(() => shiftLocal(revealLocal, -preset.windowDays * DAY_MS), [revealLocal, preset]);
  const derivedLock = useMemo(() => shiftLocal(revealLocal, -preset.lockBeforeMs), [revealLocal, preset]);

  // Ce qui sera effectivement appliqué (aperçu) : stocké si figé, surcharge si
  // avancé, sinon dérivé.
  const effOpen = lock ? initialOpen : advanced && openLocal ? openLocal : derivedOpen;
  const effLock = lock ? initialLock : advanced && lockLocal ? lockLocal : derivedLock;
  const announce = shiftLocal(effOpen, -preset.announceLeadDays * DAY_MS);

  function openAdvanced() {
    if (!openLocal) setOpenLocal(derivedOpen);
    if (!lockLocal) setLockLocal(derivedLock);
    setAdvanced(true);
  }

  return (
    <form action={formAction} className="space-y-4">
      {drop && <input type="hidden" name="id" value={drop.id} />}

      {lock && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          🔒 Enchère en cours — maison, prix plancher, exemplaires et fenêtres sont figés. Seuls le descriptif et les visuels restent modifiables.
        </p>
      )}

      <div>
        <label className={label}>Maison</label>
        <select name="brand_id" defaultValue={drop?.brand_id ?? ""} required disabled={lock} className={`${field} ${lock ? locked : ""}`}>
          <option value="" disabled>— choisir —</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div>
        <label className={label}>Titre</label>
        <input name="title" defaultValue={drop?.title ?? ""} required className={field} placeholder="Ex. Type 02 Cadran Saphir" />
      </div>

      <div>
        <label className={label}>Référence pièce</label>
        <input name="piece_reference" defaultValue={drop?.piece_reference ?? ""} className={field} placeholder="Optionnel" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Prix plancher (€) — min 3 000</label>
          <input name="floor_price" type="number" min={3000} step={1} required disabled={lock}
            defaultValue={drop ? drop.floor_price_cents / 100 : ""} className={`${field} ${lock ? locked : ""}`} />
        </div>
        <div>
          <label className={label}>Exemplaires (1–100)</label>
          <input name="exemplaires" type="number" min={1} max={100} step={1} required disabled={lock}
            defaultValue={drop?.exemplaires ?? ""} className={`${field} ${lock ? locked : ""}`} />
          {preset.exemplairesHint != null && (
            <p className="mt-1 text-[11px] text-muted-foreground">Suggéré pour ce format : {preset.exemplairesHint}.</p>
          )}
        </div>
      </div>

      {/* Sous-souscription : vente partielle (défaut) ou tout ou rien. */}
      <label className={`flex items-start gap-3 rounded-lg border border-input/60 bg-background/40 p-3 ${lock ? locked : "cursor-pointer"}`}>
        <input type="checkbox" name="all_or_nothing" value="1" disabled={lock}
          defaultChecked={!!drop?.all_or_nothing}
          className="mt-0.5 h-4 w-4 rounded border-input accent-[oklch(0.72_0.07_80)]" />
        <span className="text-xs leading-relaxed">
          <span className="font-medium text-foreground/90">Tout ou rien</span>
          <span className="block text-muted-foreground">
            Par défaut, si toutes les pièces ne trouvent pas preneur, on vend celles qui atteignent le plancher (prix = plus basse offre gagnante). Cochez pour annuler le drop tant que les {""}
            <span className="tabular-nums">exemplaires</span> ne sont pas tous couverts.
          </span>
        </span>
      </label>

      {/* ── Planning : format + reveal (ancre), reste dérivé ── */}
      <div className="rounded-lg border border-input/60 bg-background/40 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Format</label>
            <select name="format" value={format} disabled={lock}
              onChange={(e) => setFormat(parseDropFormat(e.target.value))}
              className={`${field} ${lock ? locked : ""}`}>
              {(Object.keys(DROP_FORMATS) as DropFormat[]).map((k) => (
                <option key={k} value={k}>{DROP_FORMATS[k].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Révélation {preset.offCadence ? "(hors-cadence)" : "(jeudi 18:00)"}</label>
            {lock ? (
              <input type="datetime-local" value={revealLocal} disabled className={`${field} ${locked}`} />
            ) : advanced ? (
              <input name="reveal_at" type="datetime-local" required value={revealLocal}
                onChange={(e) => setRevealLocal(e.target.value)} className={field} />
            ) : (
              <select name="reveal_at" required value={revealLocal}
                onChange={(e) => setRevealLocal(e.target.value)} className={field}>
                <option value="" disabled>— choisir un jeudi —</option>
                {revealSlots.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            )}
          </div>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">{preset.hint}</p>

        {/* Aperçu de la timeline dérivée du reveal. */}
        <dl className="mt-4 space-y-1.5 border-t border-input/60 pt-4 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Mise en avant « À venir »</dt>
            <dd className="tabular-nums text-foreground/80">{fmtLocal(announce)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Ouverture des offres{advanced && openLocal ? "" : ` (auto, −${preset.windowDays} j)`}</dt>
            <dd className="tabular-nums text-foreground/80">{fmtLocal(effOpen)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Verrouillage des offres{advanced && lockLocal ? "" : " (auto, reveal − 1h)"}</dt>
            <dd className="tabular-nums text-foreground/80">{fmtLocal(effLock)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 font-medium">
            <dt className="text-foreground/80">Révélation</dt>
            <dd className="tabular-nums text-foreground">{fmtLocal(revealLocal)}</dd>
          </div>
        </dl>

        {!lock && (
          advanced ? (
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-input/60 pt-4 sm:grid-cols-2">
              <div>
                <label className={label}>Ouverture (custom)</label>
                <input name="bid_window_opens_at" type="datetime-local"
                  value={openLocal} onChange={(e) => setOpenLocal(e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}>Verrouillage (custom)</label>
                <input name="bid_lock_at" type="datetime-local"
                  value={lockLocal} onChange={(e) => setLockLocal(e.target.value)} className={field} />
              </div>
              <button type="button" onClick={() => setAdvanced(false)}
                className="justify-self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                Revenir au calendrier automatique
              </button>
            </div>
          ) : (
            <button type="button" onClick={openAdvanced}
              className="mt-4 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              Paramètres avancés — reveal libre + dates custom
            </button>
          )
        )}
      </div>

      <div>
        <label className={label}>Visuel principal (URL)</label>
        <input name="hero_image_url" defaultValue={drop?.hero_image_url ?? ""} className={field} placeholder="https://…" />
      </div>

      <div>
        <label className={label}>Galerie (une URL par ligne)</label>
        <textarea name="images_urls" rows={3} defaultValue={(drop?.images_urls ?? []).join("\n")} className={`${field} font-mono text-xs`} />
      </div>

      <div>
        <label className={label}>Descriptif</label>
        <textarea name="description" rows={4} defaultValue={drop?.description ?? ""} className={field} />
      </div>

      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-300">Enregistré.</p>}

      <SubmitButton isNew={!drop} />
    </form>
  );
}

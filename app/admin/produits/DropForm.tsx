"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { isPlannable, type DropStatus } from "@/lib/admin/drops";
import { toLocalInput } from "@/lib/admin/format";
import type { ActionState } from "./actions";

type Brand = { id: string; name: string };
type Drop = {
  id: string; brand_id: string; title: string; piece_reference: string | null;
  description: string | null; floor_price_cents: number; exemplaires: number;
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
  action, brands, drop, status,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  brands: Brand[];
  drop?: Drop;
  status?: DropStatus;
}) {
  const [state, formAction] = useFormState(action, {} as ActionState);
  const lock = status ? !isPlannable(status) : false;

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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>Ouverture des enchères</label>
          <input name="bid_window_opens_at" type="datetime-local" required disabled={lock}
            defaultValue={toLocalInput(drop?.bid_window_opens_at)} className={`${field} ${lock ? locked : ""}`} />
        </div>
        <div>
          <label className={label}>Verrouillage (optionnel)</label>
          <input name="bid_lock_at" type="datetime-local" disabled={lock}
            defaultValue={toLocalInput(drop?.bid_lock_at)} className={`${field} ${lock ? locked : ""}`} />
        </div>
        <div>
          <label className={label}>Reveal</label>
          <input name="reveal_at" type="datetime-local" required disabled={lock}
            defaultValue={toLocalInput(drop?.reveal_at)} className={`${field} ${lock ? locked : ""}`} />
        </div>
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

"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NAME_MAX, DESC_MAX, SLUG_MAX, LOGO_HINT, SITE_HINT, STATUS_FR,
  slugify, LOGO_RE, SITE_RE, type BrandStatus,
} from "@/lib/admin/maisons";
import type { ActionState } from "./actions";

type Brand = {
  id: string; name: string; slug: string; description: string | null;
  logo_url: string | null; website_url: string | null; country_code: string | null;
  status: BrandStatus; kbis_verified: boolean; stripe_account_id: string | null;
};

const label = "mb-1.5 flex items-center justify-between text-xs font-medium text-foreground/80";
const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const hint = "mt-1 text-[11px] text-muted-foreground";

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={cn("text-[11px] font-semibold", n > max ? "text-red-400" : "text-muted-foreground")}>{n} / {max}</span>;
}
function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="hover:bg-[oklch(0.78_0.075_82)]">{pending ? "Enregistrement…" : isNew ? "Créer la maison" : "Enregistrer"}</Button>;
}

export function MaisonForm({ action, brand }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; brand?: Brand }) {
  const [state, formAction] = useFormState(action, {} as ActionState);
  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [desc, setDesc] = useState(brand?.description ?? "");
  const [logo, setLogo] = useState(brand?.logo_url ?? "");
  const [site, setSite] = useState(brand?.website_url ?? "");
  const logoBad = logo.length > 0 && !LOGO_RE.test(logo);
  const siteBad = site.length > 0 && !SITE_RE.test(site);

  return (
    <form action={formAction} className="space-y-4">
      {brand && <input type="hidden" name="id" value={brand.id} />}

      <div>
        <label className={label}>Nom <Counter n={name.length} max={NAME_MAX} /></label>
        <input name="name" required maxLength={NAME_MAX} value={name}
          onChange={(e) => { setName(e.target.value); if (!brand) setSlug(slugify(e.target.value)); }}
          className={field} placeholder="Maison Lévrier" />
      </div>

      <div>
        <label className={label}>Slug <Counter n={slug.length} max={SLUG_MAX} /></label>
        <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={SLUG_MAX} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={field} placeholder="maison-levrier" />
        <p className={hint}>Minuscules, chiffres et tirets uniquement. Identifiant public.</p>
      </div>

      <div>
        <label className={label}>Description <Counter n={desc.length} max={DESC_MAX} /></label>
        <textarea name="description" rows={3} maxLength={DESC_MAX} value={desc} onChange={(e) => setDesc(e.target.value)} className={field} placeholder="Courte présentation (max 280 caractères)." />
      </div>

      <div>
        <label className={label}>Logo (URL image)</label>
        <input name="logo_url" value={logo} onChange={(e) => setLogo(e.target.value)} className={cn(field, logoBad && "border-red-500/50")} placeholder="https://…/logo.svg" />
        <p className={cn(hint, logoBad && "text-red-400")}>{LOGO_HINT}</p>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div>
          <label className={label}>Site web</label>
          <input name="website_url" value={site} onChange={(e) => setSite(e.target.value)} className={cn(field, siteBad && "border-red-500/50")} placeholder="https://maison.com" />
          <p className={cn(hint, siteBad && "text-red-400")}>{SITE_HINT}</p>
        </div>
        <div>
          <label className={label}>Pays (ISO 2)</label>
          <input name="country_code" defaultValue={brand?.country_code ?? ""} maxLength={2} className={cn(field, "uppercase")} placeholder="FR" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Statut</label>
          <select name="status" defaultValue={brand?.status ?? "pending"} className={field}>
            {(Object.keys(STATUS_FR) as BrandStatus[]).map((s) => <option key={s} value={s}>{STATUS_FR[s]}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Stripe Connect (account id)</label>
          <input name="stripe_account_id" defaultValue={brand?.stripe_account_id ?? ""} className={cn(field, "font-mono text-xs")} placeholder="acct_…" />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
        <input type="checkbox" name="kbis_verified" defaultChecked={brand?.kbis_verified ?? false} /> KBIS vérifié
      </label>

      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-300">Enregistré.</p>}

      <Submit isNew={!brand} />
    </form>
  );
}

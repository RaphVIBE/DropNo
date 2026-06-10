"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { createTicket, type ActionState } from "../actions";
import { CATEGORIES, PRIORITIES, CATEGORY_FR, PRIORITY_FR } from "@/lib/admin/support";

const label = "mb-1.5 block text-xs font-medium text-foreground/80";
const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="hover:bg-[oklch(0.78_0.075_82)]">{pending ? "Création…" : "Créer le ticket"}</Button>;
}

export default function NewTicketPage() {
  const [state, action] = useFormState(createTicket, {} as ActionState);
  return (
    <>
      <Link href="/admin/support" className="text-sm text-muted-foreground hover:text-foreground">← Support</Link>
      <h1 className="mt-2 font-display text-3xl">Nouveau ticket</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Ouvre un ticket au nom d&apos;un client existant (recherché par email).</p>
      <div className="max-w-xl rounded-xl border border-border bg-card p-5">
        <form action={action} className="space-y-4">
          <div><label className={label}>Email du client</label><input name="client_email" type="email" required className={field} placeholder="client@exemple.com" /></div>
          <div><label className={label}>Sujet</label><input name="subject" required maxLength={120} minLength={3} className={field} placeholder="Résumé de la demande" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>Catégorie</label><select name="category" defaultValue="other" className={field}>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_FR[c]}</option>)}</select></div>
            <div><label className={label}>Priorité</label><select name="priority" defaultValue="normal" className={field}>{PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_FR[p]}</option>)}</select></div>
          </div>
          <div><label className={label}>Premier message</label><textarea name="body" rows={5} required maxLength={5000} className={field} placeholder="Décris la demande du client…" /></div>
          {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
          <Submit />
        </form>
      </div>
    </>
  );
}

"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { ajouterAdmin, type AdminActionState } from "./actions";

const field =
  "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="hover:bg-[oklch(0.78_0.075_82)]">
      {pending ? "Ajout…" : "Ajouter"}
    </Button>
  );
}

export function AjouterAdminForm() {
  const [state, action] = useFormState<AdminActionState, FormData>(ajouterAdmin, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="email" type="email" required placeholder="email@…" className={`${field} w-56`} />
      <select name="role" defaultValue="staff" className={field}>
        <option value="staff">Staff</option>
        <option value="owner">Owner</option>
      </select>
      <SubmitButton />
      {state.error && <p className="w-full text-xs text-red-300">{state.error}</p>}
      {state.ok && <p className="w-full text-xs text-emerald-300">Admin ajouté.</p>}
    </form>
  );
}

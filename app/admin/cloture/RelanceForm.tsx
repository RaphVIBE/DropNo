"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { relancerCloture, type RelanceState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="hover:bg-[oklch(0.78_0.075_82)]">
      {pending ? "Relance en cours…" : "Relancer la clôture"}
    </Button>
  );
}

/**
 * Relance manuelle de close-drop. Idempotente : les bids déjà réglés sont
 * skip, seuls les échecs/retards Stripe sont retentés.
 */
export function RelanceForm({ dropId }: { dropId: string }) {
  const [state, action] = useFormState<RelanceState, FormData>(relancerCloture, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="drop_id" value={dropId} />
      <SubmitButton />
      {state.summary && (
        <p className="text-xs text-muted-foreground">
          Dernier run : {state.summary}
        </p>
      )}
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state.ok && !state.error && <p className="text-xs text-emerald-300">Run terminé sans erreur.</p>}
    </form>
  );
}

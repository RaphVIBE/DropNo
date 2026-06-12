"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { marquerPaye, type PayoutActionState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="hover:bg-[oklch(0.78_0.075_82)]">
      {pending ? "Enregistrement…" : "Marquer payé"}
    </Button>
  );
}

/** Enregistre le virement (montants recalculés côté serveur, jamais saisis). */
export function PayerForm({ dropId }: { dropId: string }) {
  const [state, action] = useFormState<PayoutActionState, FormData>(marquerPaye, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="drop_id" value={dropId} />
      <input
        name="payment_reference"
        placeholder="Réf. virement"
        className="w-32 rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <SubmitButton />
      {state.error && <p className="w-full text-xs text-red-300">{state.error}</p>}
    </form>
  );
}

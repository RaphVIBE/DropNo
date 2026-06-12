"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { rembourser, type RefundState } from "./actions";

function SubmitButton({ amount }: { amount: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="hover:bg-[oklch(0.78_0.075_82)]">
      {pending ? "Remboursement…" : `Rembourser ${amount} (intégral)`}
    </Button>
  );
}

/**
 * Déclenche le refund Stripe intégral (action financière irréversible).
 * L'edge function est idempotente : pas de double refund possible.
 */
export function RembourserForm({ transactionId, amountLabel }: { transactionId: string; amountLabel: string }) {
  const [state, action] = useFormState<RefundState, FormData>(rembourser, {});
  return (
    <form
      action={action}
      className="space-y-2"
      onSubmit={(e) => {
        if (!window.confirm(`Rembourser intégralement ${amountLabel} au client ? Action irréversible.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="transaction_id" value={transactionId} />
      <SubmitButton amount={amountLabel} />
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state.ok && (
        <p className="text-xs text-emerald-300">
          Remboursé. Stripe : <span className="font-mono">{state.refundId}</span>
        </p>
      )}
    </form>
  );
}

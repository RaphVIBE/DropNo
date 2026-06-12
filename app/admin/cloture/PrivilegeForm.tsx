"use client";

import { useFormState, useFormStatus } from "react-dom";

import { expirerPrivilege, type PrivilegeState } from "./actions";

/** Expiration manuelle d'une offre Privilège № 001 pending (admin). */
export function PrivilegeForm({
  offerId,
  dropId,
}: {
  offerId: string;
  dropId: string;
}) {
  const [state, action] = useFormState<PrivilegeState, FormData>(
    expirerPrivilege,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="offer_id" value={offerId} />
      <input type="hidden" name="drop_id" value={dropId} />
      <Submit />
      {state.error ? (
        <p className="mt-2 text-xs text-red-300">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="mt-2 text-xs text-emerald-300">Offre expirée.</p>
      ) : null}
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "Expiration..." : "Expirer l'offre"}
    </button>
  );
}

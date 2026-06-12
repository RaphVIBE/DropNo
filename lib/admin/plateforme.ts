import type { Tone } from "./ui";

// Domaine plateforme : équipe d'admins + journal d'audit des enchères.

// ── Rôles admin ─────────────────────────────────────────────────────────────
export type AdminRole = "owner" | "staff";

export const ADMIN_ROLE_FR: Record<AdminRole, string> = {
  owner: "Owner",
  staff: "Staff",
};

export const ADMIN_ROLE_TONE: Record<AdminRole, Tone> = {
  owner: "champagne",
  staff: "zinc",
};

// ── Actions du bid_audit_log ────────────────────────────────────────────────
export type AuditAction =
  | "create" | "modify" | "withdraw"
  | "finalize_won" | "finalize_lost" | "invalidate";

export const AUDIT_ACTIONS: AuditAction[] = [
  "create", "modify", "withdraw", "finalize_won", "finalize_lost", "invalidate",
];

export const AUDIT_FR: Record<AuditAction, string> = {
  create: "Création",
  modify: "Modification",
  withdraw: "Retrait",
  finalize_won: "Gagnée",
  finalize_lost: "Perdue",
  invalidate: "Invalidée",
};

export const AUDIT_TONE: Record<AuditAction, Tone> = {
  create: "green",
  modify: "amber",
  withdraw: "zinc",
  finalize_won: "champagne",
  finalize_lost: "zinc",
  invalidate: "red",
};

export const isAuditAction = (v: string): v is AuditAction =>
  (AUDIT_ACTIONS as string[]).includes(v);

// Ligne retournée par get_bid_audit() — montant null tant que non révélé.
export type AuditRow = {
  id: number;
  occurred_at: string;
  action: string;
  drop_id: string;
  drop_number: number;
  drop_title: string;
  drop_status: string;
  user_email: string | null;
  amount_cents: number | null;
  bid_id: string;
};

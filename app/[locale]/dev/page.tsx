import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DashboardView,
  type DashboardData,
} from "@/components/account/dashboard-view";
import { VerificationView } from "@/components/account/verification-view";

export const dynamic = "force-dynamic";

/* Page de prévisualisation DEV — affiche les écrans protégés (dashboard,
 * vérification KYC) avec des données mock, sans authentification.
 * 404 automatique en production. */

const KYC_STATES = ["pending", "verifying", "verified", "rejected"] as const;

const SCREENS = [
  { href: "/", label: "Home" },
  { href: "/drops", label: "Calendrier" },
  { href: "/drop/c85444d2-d3dc-4f2c-b0ea-681add74aa64", label: "Page drop" },
  { href: "/account/dashboard", label: "Dashboard (réel)" },
  { href: "/account/verification", label: "Vérif (réel)" },
];

function mockData(kycStatus: string): DashboardData {
  return {
    email: "vous@exemple.com",
    displayName: "Raphaël",
    kycStatus,
    bids: [
      {
        id: "b1",
        amount_cents: 480000,
        status: "active",
        submitted_at: "2026-06-04T18:12:00Z",
        drop: { id: "d2", drop_number: 2, title: "Sport Cadran Crème" },
      },
      {
        id: "b2",
        amount_cents: 650000,
        status: "won",
        submitted_at: "2026-05-22T18:00:00Z",
        drop: { id: "d0", drop_number: 0, title: "Type Zéro Prototype" },
      },
      {
        id: "b3",
        amount_cents: 390000,
        status: "lost",
        submitted_at: "2026-05-15T17:30:00Z",
        drop: { id: "d3", drop_number: 3, title: "Plongeur Bronze" },
      },
    ],
    txs: [
      {
        id: "t1",
        amount_paid_cents: 600000,
        status: "captured",
        captured_at: "2026-05-22T19:00:00Z",
        withdrawal_window_ends_at: "2026-06-05T19:00:00Z",
        drop: { id: "d0", drop_number: 0, title: "Type Zéro Prototype" },
      },
    ],
    deliveries: [
      {
        id: "l1",
        carrier: "dhl",
        tracking_number: "JD014600003901234567",
        status: "shipped",
        transaction: {
          drop: { id: "d0", drop_number: 0, title: "Type Zéro Prototype" },
        },
      },
    ],
  };
}

export default function DevPreviewPage({
  searchParams,
}: {
  searchParams: { kyc?: string };
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const kyc =
    KYC_STATES.find((s) => s === searchParams.kyc) ?? "pending";

  return (
    <div>
      {/* Barre dev */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule bg-card px-7 py-3 text-[12px] md:px-16">
        <span className="font-mono uppercase tracking-[0.18em] text-[var(--champagne-deep)]">
          DEV · preview
        </span>
        <span className="flex items-center gap-2 text-ink-2">
          KYC :
          {KYC_STATES.map((s) => (
            <Link
              key={s}
              href={`/dev?kyc=${s}`}
              className={`rounded-sm px-2 py-1 ${
                s === kyc
                  ? "bg-primary text-primary-foreground"
                  : "underline underline-offset-4 hover:text-foreground"
              }`}
            >
              {s}
            </Link>
          ))}
        </span>
        <span className="flex flex-wrap items-center gap-3 text-ink-2">
          Écrans :
          {SCREENS.map((sc) => (
            <Link
              key={sc.href}
              href={sc.href}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {sc.label}
            </Link>
          ))}
        </span>
      </div>

      <DevLabel>Dashboard — statut KYC : {kyc}</DevLabel>
      <DashboardView
        data={mockData(kyc)}
        footer={
          <span className="text-sm text-ink-2">
            (bouton « Se déconnecter » masqué en preview)
          </span>
        }
      />

      <div className="h-px bg-rule" />

      <DevLabel>Vérification KYC — statut : {kyc}</DevLabel>
      <VerificationView status={kyc} />
    </div>
  );
}

function DevLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto max-w-3xl px-7 pt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:px-16">
      {children}
    </p>
  );
}

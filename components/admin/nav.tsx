"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Gavel, Banknote, Globe2, Truck, Users, Building2, LifeBuoy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/admin/produits", label: "Produits / Drops", icon: Package },
  { href: "/admin/cloture", label: "Clôture", icon: Gavel },
  { href: "/admin/finance", label: "Finance", icon: Banknote },
  { href: "/admin/audience", label: "Audience", icon: Globe2 },
  { href: "/admin/commandes", label: "Commandes", icon: Truck },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/maisons", label: "Maisons", icon: Building2 },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/plateforme", label: "Plateforme", icon: ShieldCheck },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-[var(--champagne)]/12 text-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-[var(--champagne)]")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

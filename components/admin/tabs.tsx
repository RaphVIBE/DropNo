"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "En cours & calendrier" },
  { href: "/admin/historique", label: "Historique" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-[var(--champagne)]/15 text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

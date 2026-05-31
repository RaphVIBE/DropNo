import { createClient } from "@/lib/supabase/server";
import { CalendarRow, type CalendarDrop } from "@/components/drop/calendar-row";

export const dynamic = "force-dynamic";

const SELECT =
  "id, drop_number, title, status, floor_price_cents, clearing_price_cents, reveal_at, bid_window_opens_at, revealed_at, brand:brands(name, slug)";

function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

function CalendarSection({
  title,
  count,
  drops,
  variant,
  serverNowIso,
  empty,
  lastSection,
}: {
  title: string;
  count: string;
  drops: CalendarDrop[];
  variant: "open" | "upcoming" | "past";
  serverNowIso: string;
  empty: string;
  lastSection?: boolean;
}) {
  return (
    <div
      className={`px-7 pt-16 md:px-16 md:pt-24 ${lastSection ? "pb-28" : ""}`}
    >
      <div className="mb-8 flex items-baseline justify-between border-b border-foreground pb-6">
        <h3 className="font-serif text-4xl italic">{title}</h3>
        <span className="text-[13px] tracking-wide text-muted-foreground">
          {count}
        </span>
      </div>
      {drops.length === 0 ? (
        <p className="py-8 text-ink-2">{empty}</p>
      ) : (
        drops.map((drop) => (
          <CalendarRow
            key={drop.id}
            drop={drop}
            variant={variant}
            serverNowIso={serverNowIso}
          />
        ))
      )}
    </div>
  );
}

// Drop Calendar (route /drops) — 3 sections En cours / A venir / Passes.
// Fetch RLS-safe depuis la vue drops_public, compte a rebours live (serveur-sync).
export default async function DropsPage() {
  const supabase = createClient();
  const serverNowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("drops_public")
    .select(SELECT)
    .order("reveal_at", { ascending: true });

  const drops = (data ?? []) as unknown as CalendarDrop[];

  const open = drops
    .filter((d) => d.status === "open")
    .sort((a, b) => (a.reveal_at ?? "").localeCompare(b.reveal_at ?? ""));

  const upcoming = drops
    .filter((d) => d.status === "scheduled")
    .sort((a, b) =>
      (a.bid_window_opens_at ?? "").localeCompare(b.bid_window_opens_at ?? "")
    );

  const past = drops
    .filter((d) => ["revealed", "closed", "cancelled"].includes(d.status ?? ""))
    .sort((a, b) =>
      (b.revealed_at ?? b.reveal_at ?? "").localeCompare(
        a.revealed_at ?? a.reveal_at ?? ""
      )
    );

  return (
    <>
      <div className="border-b border-rule-soft px-7 pb-16 pt-20 md:px-16 md:pb-20 md:pt-28">
        <span className="eyebrow">Calendrier</span>
        <h1 className="font-display mt-6 max-w-[11ch] text-[clamp(3.5rem,9vw,8rem)]">
          Tous les drops, en un seul lieu.
        </h1>
        <p className="mt-6 max-w-[50ch] text-base text-ink-2">
          Les drops en cours acceptent les offres jusqu&apos;à la révélation.
          Les prochains sont planifiés. Les précédents conservent leur prix
          unitaire de clôture.
        </p>
      </div>

      {error ? (
        <p className="px-7 py-16 text-destructive md:px-16">
          Impossible de charger les drops pour le moment.
        </p>
      ) : (
        <>
          <CalendarSection
            title="En cours"
            count={plural(open.length, "drop ouvert", "drops ouverts")}
            drops={open}
            variant="open"
            serverNowIso={serverNowIso}
            empty="Aucun drop ouvert en ce moment."
          />
          <CalendarSection
            title="À venir"
            count={plural(upcoming.length, "drop planifié", "drops planifiés")}
            drops={upcoming}
            variant="upcoming"
            serverNowIso={serverNowIso}
            empty="Aucun drop planifié pour l'instant."
          />
          <CalendarSection
            title="Passés"
            count={plural(past.length, "drop clôturé", "drops clôturés")}
            drops={past}
            variant="past"
            serverNowIso={serverNowIso}
            empty="Aucun drop clôturé."
            lastSection
          />
        </>
      )}
    </>
  );
}

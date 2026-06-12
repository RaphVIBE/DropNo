// Couche serveur de lecture PostHog (HogQL Query API).
// Utilisée par les cadrans /admin — JAMAIS importée côté client (la clé
// personnelle est privée). Tout est best-effort : sans clés env ou en cas
// d'erreur API, chaque helper retourne null et l'UI affiche l'état
// « non configuré / indisponible ».
//
// Env requis :
//   POSTHOG_PROJECT_ID        — id numérique du projet PostHog
//   POSTHOG_PERSONAL_API_KEY  — personal API key (scope query:read)
//   POSTHOG_API_HOST          — défaut https://eu.posthog.com (EU cloud)

const API_HOST = process.env.POSTHOG_API_HOST ?? "https://eu.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;

export const analyticsConfigured = (): boolean => !!(PROJECT_ID && API_KEY);

// Mini-cache mémoire (TTL 5 min) : les pages admin sont force-dynamic, on
// évite de marteler l'API PostHog à chaque rendu. (fetch POST n'est pas
// cacheable par le Data Cache Next.)
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: unknown[][] | null }>();

async function hogql(query: string): Promise<unknown[][] | null> {
  if (!analyticsConfigured()) return null;
  const hit = cache.get(query);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  try {
    const res = await fetch(`${API_HOST}/api/projects/${PROJECT_ID}/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[posthog] query failed", res.status, (await res.text()).slice(0, 300));
      cache.set(query, { at: Date.now(), data: null });
      return null;
    }
    const json = (await res.json()) as { results?: unknown[][] };
    const data = json.results ?? [];
    cache.set(query, { at: Date.now(), data });
    return data;
  } catch (err) {
    console.error("[posthog] query exception", err);
    return null;
  }
}

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const days = (n: number) => Math.min(Math.max(Math.trunc(n), 1), 365);

// ── Types ───────────────────────────────────────────────────────────────────
export type SeriesPoint = { date: string; views: number; uniques: number };
export type Totals = { views: number; uniques: number };
export type LabelCount = { label: string; count: number };
export type DropViewsRow = {
  dropNumber: number;
  title: string;
  views: number;
  uniques: number;
};

// ── Trafic global (vitrine, event $pageview) ────────────────────────────────
export async function getTrafficSeries(nDays: number): Promise<SeriesPoint[] | null> {
  const rows = await hogql(`
    select toDate(timestamp) as d, count() as views, count(distinct person_id) as uniques
    from events
    where event = '$pageview' and timestamp >= now() - interval ${days(nDays)} day
    group by d order by d asc
  `);
  if (!rows) return null;
  return rows.map((r) => ({ date: String(r[0]), views: Number(r[1]), uniques: Number(r[2]) }));
}

export async function getTrafficTotals(nDays: number): Promise<Totals | null> {
  const rows = await hogql(`
    select count() as views, count(distinct person_id) as uniques
    from events
    where event = '$pageview' and timestamp >= now() - interval ${days(nDays)} day
  `);
  if (!rows || !rows[0]) return null;
  return { views: Number(rows[0][0]), uniques: Number(rows[0][1]) };
}

// ── Vues par montre (event drop_view) ───────────────────────────────────────
export async function getDropViewTotals(dropId: string, nDays = 90): Promise<Totals | null> {
  if (!isUuid(dropId)) return null;
  const rows = await hogql(`
    select count() as views, count(distinct person_id) as uniques
    from events
    where event = 'drop_view'
      and properties.drop_id = '${dropId}'
      and timestamp >= now() - interval ${days(nDays)} day
  `);
  if (!rows || !rows[0]) return null;
  return { views: Number(rows[0][0]), uniques: Number(rows[0][1]) };
}

export async function getDropViewSeries(dropId: string, nDays = 30): Promise<SeriesPoint[] | null> {
  if (!isUuid(dropId)) return null;
  const rows = await hogql(`
    select toDate(timestamp) as d, count() as views, count(distinct person_id) as uniques
    from events
    where event = 'drop_view'
      and properties.drop_id = '${dropId}'
      and timestamp >= now() - interval ${days(nDays)} day
    group by d order by d asc
  `);
  if (!rows) return null;
  return rows.map((r) => ({ date: String(r[0]), views: Number(r[1]), uniques: Number(r[2]) }));
}

/** Top des montres les plus vues (toutes pages drop confondues). */
export async function getTopDrops(nDays: number, limit = 8): Promise<DropViewsRow[] | null> {
  const rows = await hogql(`
    select properties.drop_number as n, any(properties.drop_title) as title,
           count() as views, count(distinct person_id) as uniques
    from events
    where event = 'drop_view' and timestamp >= now() - interval ${days(nDays)} day
    group by n order by views desc limit ${Math.min(limit, 20)}
  `);
  if (!rows) return null;
  return rows.map((r) => ({
    dropNumber: Number(r[0]),
    title: String(r[1] ?? ""),
    views: Number(r[2]),
    uniques: Number(r[3]),
  }));
}

// ── Géographie / acquisition / devices ──────────────────────────────────────
export async function getTopCountries(nDays: number, dropId?: string): Promise<LabelCount[] | null> {
  const dropFilter = dropId && isUuid(dropId)
    ? `and event = 'drop_view' and properties.drop_id = '${dropId}'`
    : `and event = '$pageview'`;
  const rows = await hogql(`
    select coalesce(properties.$geoip_country_name, 'Inconnu') as country,
           count(distinct person_id) as uniques
    from events
    where timestamp >= now() - interval ${days(nDays)} day ${dropFilter}
    group by country order by uniques desc limit 8
  `);
  if (!rows) return null;
  return rows.map((r) => ({ label: String(r[0]), count: Number(r[1]) }));
}

export async function getTopReferrers(nDays: number): Promise<LabelCount[] | null> {
  const rows = await hogql(`
    select coalesce(nullIf(properties.$referring_domain, ''), 'Direct') as ref,
           count(distinct person_id) as uniques
    from events
    where event = '$pageview' and timestamp >= now() - interval ${days(nDays)} day
    group by ref order by uniques desc limit 8
  `);
  if (!rows) return null;
  return rows.map((r) => ({ label: String(r[0]), count: Number(r[1]) }));
}

export async function getDeviceSplit(nDays: number): Promise<LabelCount[] | null> {
  const rows = await hogql(`
    select coalesce(properties.$device_type, 'Inconnu') as device,
           count(distinct person_id) as uniques
    from events
    where event = '$pageview' and timestamp >= now() - interval ${days(nDays)} day
    group by device order by uniques desc limit 5
  `);
  if (!rows) return null;
  return rows.map((r) => ({ label: String(r[0]), count: Number(r[1]) }));
}

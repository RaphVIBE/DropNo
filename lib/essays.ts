import { promises as fs } from "node:fs";
import path from "node:path";

import type { Locale } from "@/i18n/routing";

/**
 * Bibliothèque éditoriale `/lire`. Les essais sont des fichiers Markdown dans
 * `content/essays/`, avec un frontmatter YAML léger.
 *
 * Convention de langue : un essai `slug.md` est en français (langue d'écriture
 * de l'éditorial Drop No.). Une traduction anglaise future vivra dans
 * `slug.en.md`. Tant qu'aucune version EN n'existe, l'essai reste rendu en
 * français même sous /en (la rédaction est bilingue mais l'éditorial long
 * paraît d'abord en FR) ; on signale la langue à la lecture côté EN.
 *
 * Pas de dépendance Markdown : le frontmatter est parsé à la main (clés
 * scalaires + bloc replié `>` ), le corps est rendu par un convertisseur
 * minimal côté composant.
 */

export type Essay = {
  slug: string;
  /** Langue réelle du contenu rendu ("fr" tant qu'aucune traduction). */
  lang: Locale;
  title: string;
  summary: string;
  category: string | null;
  publishedAt: string | null;
  readingTime: number | null;
  /** Corps Markdown (sans le titre H1 de tête, retiré au parse). */
  body: string;
};

export type EssayMeta = Omit<Essay, "body">;

const ESSAYS_DIR = path.join(process.cwd(), "content", "essays");

/** Découpe le frontmatter `--- ... ---` du corps. */
function splitFrontmatter(raw: string): { fm: string; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { fm: "", body: raw };
  return { fm: match[1], body: match[2] };
}

/**
 * Parseur YAML minimal suffisant pour nos frontmatters : `clé: valeur` et
 * blocs repliés `clé: >` dont les lignes suivantes sont indentées.
 */
function parseFrontmatter(fm: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = fm.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z_][\w-]*):\s?(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();

    // Bloc replié `>` : agrège les lignes indentées suivantes en un paragraphe.
    if (value === ">" || value === "|") {
      const collected: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+\S/.test(lines[j])) {
        collected.push(lines[j].trim());
        j++;
      }
      value = collected.join(value === ">" ? " " : "\n");
      i = j - 1;
    }

    // Retire d'éventuels guillemets entourants.
    value = value.replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  return out;
}

/** Retire le premier titre H1 du corps (le titre vit déjà dans la page). */
function stripLeadingH1(body: string): string {
  return body.replace(/^\s*#\s+.*\n+/, "");
}

async function readEssayFile(fileSlug: string): Promise<Essay | null> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(ESSAYS_DIR, `${fileSlug}.md`), "utf8");
  } catch {
    return null;
  }
  const { fm, body } = splitFrontmatter(raw);
  const meta = parseFrontmatter(fm);
  const slug = meta.slug || fileSlug;
  const readingTime = meta.reading_time ? Number(meta.reading_time) : null;

  return {
    slug,
    lang: "fr",
    title: meta.title ?? slug,
    summary: meta.summary ?? "",
    category: meta.category ?? null,
    publishedAt: meta.published_at ?? null,
    readingTime: Number.isFinite(readingTime) ? readingTime : null,
    body: stripLeadingH1(body).trim(),
  };
}

/** Liste tous les slugs (noms de fichiers `.md`, hors variantes `.en.md`). */
async function listEssaySlugs(): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(ESSAYS_DIR);
  } catch {
    return [];
  }
  return entries
    .filter((f) => f.endsWith(".md") && !f.endsWith(".en.md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** Métadonnées de tous les essais, triées du plus récent au plus ancien. */
export async function getAllEssays(): Promise<EssayMeta[]> {
  const slugs = await listEssaySlugs();
  const essays = await Promise.all(slugs.map((s) => readEssayFile(s)));
  return essays
    .filter((e): e is Essay => e !== null)
    .map(({ body: _body, ...meta }) => meta)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

/** Un essai complet par slug, ou null s'il n'existe pas. */
export async function getEssay(slug: string): Promise<Essay | null> {
  // Le slug d'URL peut différer du nom de fichier : on résout via la liste.
  const slugs = await listEssaySlugs();
  for (const fileSlug of slugs) {
    const essay = await readEssayFile(fileSlug);
    if (essay && essay.slug === slug) return essay;
  }
  return null;
}

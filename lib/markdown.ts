/**
 * Mini-renderer markdown → HTML pour les contenus éditoriaux internes
 * (content/legal/*.md). Périmètre volontairement réduit : titres, paragraphes,
 * listes, tableaux, gras/italique/liens. Le registre npm n'étant pas une
 * dépendance nécessaire pour ce besoin, on reste sans lib externe.
 *
 * ⚠️ À n'utiliser QUE sur du contenu maison (fichiers du repo). Le HTML est
 * échappé en amont, mais ce n'est pas un sanitizer généraliste.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Gras, italique, liens — appliqués après échappement HTML. */
function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
    const safe = /^(https?:\/\/|mailto:|\/)/.test(href) ? href : "#";
    const ext = /^https?:\/\//.test(safe);
    return `<a href="${safe}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return out;
}

const TABLE_SEPARATOR = /^\|?[\s:|-]+\|?$/;

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Titres (# à ####)
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Tableaux (ligne | ... | suivie d'un séparateur |---|)
    if (
      line.trimStart().startsWith("|") &&
      i + 1 < lines.length &&
      TABLE_SEPARATOR.test(lines[i + 1].trim()) &&
      lines[i + 1].includes("-")
    ) {
      const splitRow = (row: string) =>
        row
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => inline(c.trim()));

      const headers = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      html.push(
        `<div class="table-wrap"><table><thead><tr>${headers
          .map((h) => `<th>${h}</th>`)
          .join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`
      );
      continue;
    }

    // Filet horizontal
    if (/^-{3,}$/.test(line.trim())) {
      html.push("<hr />");
      i++;
      continue;
    }

    // Listes (non ordonnées puis ordonnées), sans imbrication
    if (/^[-*]\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Paragraphe : lignes consécutives, sauts simples rendus en <br>
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !lines[i].trimStart().startsWith("|")
    ) {
      para.push(inline(lines[i].trim()));
      i++;
    }
    html.push(`<p>${para.join("<br />")}</p>`);
  }

  return html.join("\n");
}

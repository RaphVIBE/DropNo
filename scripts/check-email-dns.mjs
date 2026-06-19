#!/usr/bin/env node
/**
 * Health-check délivrabilité email pour dropno.eu.
 * Vérifie SPF / DKIM / DMARC / MX côté Google Workspace (mail humain) ET
 * côté Resend (mail applicatif transactionnel + La Liste).
 *
 * Usage : node scripts/check-email-dns.mjs [domaine]
 * Aucune dépendance, aucun secret. Relancer après chaque correction DNS.
 */
import { resolveTxt, resolveMx } from "node:dns/promises";

const DOMAIN = process.argv[2] || "dropno.eu";
const ok = (s) => `\x1b[32m✅ ${s}\x1b[0m`;
const ko = (s) => `\x1b[31m❌ ${s}\x1b[0m`;
const warn = (s) => `\x1b[33m⚠️  ${s}\x1b[0m`;

async function txt(name) {
  try {
    const recs = await resolveTxt(name);
    return recs.map((r) => r.join(""));
  } catch {
    return [];
  }
}
async function mx(name) {
  try {
    return await resolveMx(name);
  } catch {
    return [];
  }
}

const results = [];
const add = (pass, label, detail, fix) => results.push({ pass, label, detail, fix });

console.log(`\nHealth-check délivrabilité — ${DOMAIN}\n${"=".repeat(48)}`);

// --- Google Workspace (mail humain : raph@, outreach) ---
const rootMx = await mx(DOMAIN);
add(
  rootMx.some((m) => /aspmx\.l\.google\.com/.test(m.exchange)),
  "MX Google Workspace",
  rootMx.map((m) => `${m.priority} ${m.exchange}`).join(", ") || "aucun",
  "Configurer les MX Google Workspace."
);

const rootTxt = await txt(DOMAIN);
const spf = rootTxt.find((t) => t.startsWith("v=spf1"));
add(
  !!spf && spf.includes("_spf.google.com"),
  "SPF racine (Google)",
  spf || "aucun SPF",
  "Ajouter v=spf1 include:_spf.google.com ~all sur le TXT racine."
);

const googleDkim = await txt(`google._domainkey.${DOMAIN}`);
add(
  googleDkim.length > 0 && googleDkim.join("").includes("p="),
  "DKIM Google Workspace (google._domainkey)",
  googleDkim.length ? "présent" : "ABSENT",
  "Google Admin > Apps > Gmail > Authentifier l'email > Générer, puis poser le TXT google._domainkey chez Combell. (Bloque l'outreach.)"
);

const dmarc = await txt(`_dmarc.${DOMAIN}`);
const dmarcRec = dmarc.find((t) => t.startsWith("v=DMARC1"));
add(
  !!dmarcRec,
  "DMARC",
  dmarcRec || "absent",
  "Ajouter _dmarc TXT : v=DMARC1; p=none; rua=mailto:dmarc@dropno.eu (reporting)."
);
if (dmarcRec && !/rua=/.test(dmarcRec)) {
  add(false, "DMARC reporting (rua)", "pas de rua", "Ajouter rua=mailto:... pour recevoir les rapports avant de durcir en p=quarantine.");
}

// --- Resend (mail applicatif) ---
const resendDkim = await txt(`resend._domainkey.${DOMAIN}`);
add(
  resendDkim.length > 0 && resendDkim.join("").includes("p="),
  "DKIM Resend (resend._domainkey)",
  resendDkim.length ? "présent" : "ABSENT",
  "Resend > Domains > dropno.eu : poser le TXT resend._domainkey fourni."
);

const sendSpf = (await txt(`send.${DOMAIN}`)).find((t) => t.startsWith("v=spf1"));
add(
  !!sendSpf && sendSpf.includes("amazonses.com"),
  "SPF sous-domaine d'envoi (send.)",
  sendSpf || "absent",
  "Poser le TXT send. : v=spf1 include:amazonses.com ~all (fourni par Resend)."
);

const sendMx = await mx(`send.${DOMAIN}`);
add(
  sendMx.some((m) => /amazonses\.com/.test(m.exchange)),
  "MX bounce Resend (send.)",
  sendMx.map((m) => `${m.priority} ${m.exchange}`).join(", ") || "absent",
  "Poser le MX send. -> feedback-smtp.<region>.amazonses.com (fourni par Resend)."
);

// --- Rapport ---
let fails = 0;
for (const r of results) {
  console.log(`\n${r.pass ? ok(r.label) : ko(r.label)}`);
  console.log(`   ${r.detail}`);
  if (!r.pass) {
    fails++;
    console.log(warn(`fix: ${r.fix}`));
  }
}
console.log(`\n${"=".repeat(48)}`);
console.log(fails === 0 ? ok(`Tout est vert (${results.length}/${results.length}).`) : ko(`${fails} point(s) à corriger sur ${results.length}.`));
console.log("");
process.exit(fails === 0 ? 0 : 1);

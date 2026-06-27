# Drop № — Calendrier de publication (source de vérité)

Fichier central unique du statut de publication. **La revue du dimanche et le radar de repartage lisent ce fichier avant d'agir.** Raph met à jour la colonne Statut au fil des publications.

Dernière mise à jour : 2026-06-26 — recoupé avec Buffer (org « My Organization », channels IG `dropno.official`, LinkedIn `Drop №`, X `dropno_official`). Écarts tranchés : Independence partie le 21/06 (pas le 15), Quartz crisis bien publiée le 22/06, Grand feu partie le 25/06, LinkedIn Grey market confirmée le 18/06. **X rattrapé le 26/06 : le backlog (001, Quartz crisis, Grand feu, You cannot buy this watch) est programmé dans Buffer, échelonné sur ~24h** (voir section X). « You cannot buy this watch » sur IG est publié nativement (hors Buffer).

Légende statut : ✅ publié · 🗓️ programmé (Buffer) · ✍️ brouillon Buffer (pas encore programmé) · ⏳ à programmer · ⚠️ manqué / à décaler
Heures Europe/Brussels. X = canal autonome, cadence propre (pas de reprise auto de l'IG). Visuels dans `export-cartes.html` (cartes) et `renders/` (Reels).
Stratégie de campagne (phasage, semaine-type reveal) : voir `social/strategie-campagne.md`.

## Posts feed (Instagram)

| Date réelle/prévue | Rubrique | Post | Format | Statut |
|---|---|---|---|---|
| mar 16/06 | hors rubrique | Welcome | Reel | ✅ publié |
| dim 21/06 | Archives | Independence | Reel | ✅ publié |
| lun 22/06 | Archives | Quartz crisis | Reel | ✅ publié |
| mer 24/06 | Atelier | In-house | Reel | ✅ publié |
| jeu 25/06 | Atelier | Grand feu | Reel | ✅ publié |
| ven 26/06 | Provenance | You cannot buy this watch | carte/Reel `reel-waiting-list` | ✅ publié (natif, hors Buffer) |
| lun 29/06 | Archives · Icons | Royal Oak | carrousel `i01` | ⏳ batch-02 |
| mer 01/07 | Atelier · Icons | Speedmaster | carrousel `i02` | ⏳ batch-02 |
| jeu 02/07 | (LinkedIn, voir section) | — | — | — |
| ven 03/07 | Provenance | Sealed envelopes | carte `b06` / Reel | ⏳ batch-02 |
| lun 06/07 | Archives | Scarcity you can verify | carte `b08` | ⏳ batch-02 |
| mer 08/07 | Atelier | Tourbillon | carte `b09` / Reel | ⏳ batch-02 |
| ven 10/07 | Provenance · Icons | Paul Newman Daytona | carrousel `i03` | ⏳ batch-02 |

Note ordre réel vs plan : Independence et Quartz crisis (deux Archives) sont sorties rapprochées (21 et 22/06) ; le rythme lun/mer/ven s'est resserré sur la semaine de lancement. À partir du 29/06, retour au cadencement lun 18h30 · mer 12h30 · ven 18h30 du batch-02.

## LinkedIn (bilingue FR puis EN, jeudi 09h)

| Date réelle/prévue | Sujet | Statut |
|---|---|---|
| jeu 18/06 | Grey market | ✅ publié |
| jeu 25/06 | Supreme | ✅ publié |
| jeu 02/07 | Sealed bids (LI-3, batch-02) | ⏳ à programmer |
| jeu 09/07 | Direct (LI-4, batch-02) | ⏳ à programmer |

## X / Twitter (canal autonome, cadence propre)

**Décision 26/06 (Raph) : X devient un canal à part entière, plus de reprise auto de l'IG à 19h.** Le backlog mort en brouillon a été rattrapé le 26/06 : les quatre posts ont été programmés dans Buffer (`status: scheduled`), échelonnés sur ~24h dans l'ordre chronologique du contenu (pas de dump). Désormais X a sa propre cadence légère (2-3 posts/sem, angle propre : mécanisme, archives, fils courts) — voir `strategie-campagne.md`.

| Heure programmée (Brussels) | Post | Statut Buffer |
|---|---|---|
| ven 26/06 11:00 | 001 (le numéro le plus cher) | 🗓️ programmé |
| ven 26/06 15:00 | Quartz crisis | 🗓️ programmé |
| ven 26/06 19:00 | Grand feu | 🗓️ programmé |
| sam 27/06 09:00 | You cannot buy this watch | 🗓️ programmé |

## Profil & bannières (une fois, non daté)

| Élément | Où | Statut |
|---|---|---|
| avatar | IG, X, LinkedIn (posés), YouTube (à faire) | 🟡 partiel |
| bannerx | en-tête X | ⏳ |
| bannerli | page LinkedIn | ⏳ |
| banneryt | channel YouTube | ⏳ |

## Notes

- Reveal des drops : cible **jeudi 18h** (date exacte du premier reveal à confirmer côté produit, cf. ligne édito palier reveal 17/09). Le rituel hebdo du feed prépare ce rendez-vous.
- Ne jamais reproposer un post marqué ✅. Si un post est avancé/retardé, corriger sa date ici.
- X : ne pas deviner le channel ; passer par `list_channels` (org « My Organization »). Canal autonome désormais (plus de pont IG→X auto). Piège Buffer appris le 26/06 : un brouillon dont on change le `dueAt` reste `draft` ; il faut `edit_post` avec `saveToDraft: false` pour le passer en `scheduled`.
- Reels : voir aussi `fiche-audio-reels.md` pour l'audio par Reel.
- Stratégie et semaine-type : `social/strategie-campagne.md`.

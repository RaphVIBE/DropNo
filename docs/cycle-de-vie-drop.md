# Cycle de vie d'un drop — vocabulaire de référence

Source de vérité du vocabulaire des phases de vente, FR + EN, côté vitrine et
back-office. Toute copie utilisateur et tout libellé d'état doivent s'y conformer.

## Le principe : deux moments encadrent les offres

Une fenêtre d'offres scellées, bornée par deux moments **opposés** — c'est la
source d'ambiguïté à éviter :

- **Ouverture** (mise en vente) = le **début** : la pièce devient disponible, on
  peut déposer une offre scellée.
- **Révélation** (reveal, jeudi 18h Bruxelles) = la **fin** : les offres sont
  dévoilées, le prix unique tombe, les gagnants sont connus.

« Reveal » n'est donc **pas** la mise en vente : c'est le climax, à la fin.

## Les phases

```
Brouillon ─[mise sur la Liste]→ Avant-première ─[Annonce]→ À venir ─[Ouverture]→ Ouvert ─[T-1h: Verrouillage]─[Révélation]→ Résultat
 (admin)                        (la Liste, teaser)         (public)             (offres scellées)                          ↘ Annulé
```

| Phase / moment | DB `status` | FR | EN | Audience |
|---|---|---|---|---|
| Brouillon | `draft` | Brouillon | Draft | admin |
| **Avant-première** | `scheduled` | Avant-première | Preview | la Liste (teaser) |
| *moment* Annonce | — | Annonce | Announcement | → public |
| À venir | `scheduled` | À venir | Upcoming | public |
| *moment* **Ouverture** | — | Ouverture (« Ouverture dans ») | Opens (« Opens in ») | public |
| Offres ouvertes | `open` | **Ouvert** | **Open** | public |
| *moment* Verrouillage (T-1h) | `open` | Verrouillage | Lock | — |
| *moment* **Révélation** (jeu. 18h) | `closed` (transitoire) | Révélation (« Révélation dans ») / **Révélation en cours** | Reveal / **Revealing** | — |
| Résultat publié | `revealed` | **Résultat** | **Result** | public |
| Annulé | `cancelled` | Annulé | Cancelled | public |

Notes :
- **Avant-première** et **À venir** sont le **même drop** (`scheduled`), vu par
  des audiences / à des moments différents. Ce n'est pas un statut DB de plus :
  c'est une **fenêtre de visibilité** (comme l'annonce), pilotée par
  l'appartenance à la Liste.
- L'état `closed` est **transitoire** (fenêtre finie, prix pas encore calculé) →
  libellé « Révélation en cours / Revealing ». À ne pas confondre avec
  `revealed` → « Résultat / Result ».
- Le prix s'appelle **« prix unique »** (jamais « prix unitaire »).

## Libellés par surface

| Surface | Clé i18n | Affiche |
|---|---|---|
| Chip fiche drop — ouvert | `dropDetail.statusOpen` / `statusOpenClosing` | « Ouvert » / « Ouvert · révélation {date} » |
| Chip fiche drop — révélation en cours | `dropDetail.statusRevealing` | « Révélation en cours » |
| Chip fiche drop — résultat | `dropDetail.statusClosed` | « Résultat » |
| Chip maison | `marques.statusOpen` / `statusClosed` / `statusClosedPrice` | « Ouvert » / « Résultat » / « Résultat · {prix} » |
| Compte à rebours | `dropDetail.countdownOpen` / `countdownReveal` | « Ouverture dans » / « Révélation dans » |
| Sections du calendrier (navigation, inchangées) | `drops.openHeading` / `upcomingHeading` / `pastHeading` | « En cours » / « À venir » / « Passés » |
| Timeline du mécanisme | `mecanisme.timeline.*` | Ouverture · Offres scellées · Verrouillage · Révélation |
| Back-office | `STATUS_FR` (`lib/admin/drops.ts`) | draft=Brouillon, scheduled=Programmé, open=Ouvert, closed=Révélation en cours, revealed=Résultat, cancelled=Annulé |

Les **titres de sections du calendrier** restent « En cours / À venir / Passés » :
ce sont des regroupements de navigation, pas des chips de statut.

## Phase « Avant-première » — la Liste (décidé, intégration à venir)

Décisions verrouillées :

- **Nom** : Avant-première (FR) / Preview (EN).
- **Audience — la Liste** : inscrits à la waitlist (opt-in email). Récompense
  l'inscription, alimente l'opt-in.
- **Contenu** : **teaser** — visuel verrouillé (`teaseLocked`, déjà présent) +
  date d'ouverture. La fiche complète (photos, plancher) se dévoile à l'Annonce.
- **Fenêtre** : `previewLeadDays` par format, symétrique de `announceLeadDays` →
  `preview_at = bid_window_opens_at − previewLead`.

Intégration prévue :

1. **Gating côté serveur** : `drops_public` reste *public = annoncés seulement*.
   Les drops en avant-première passent par une **vue/RPC séparée gated par
   appartenance à la Liste** — jamais un simple filtre applicatif (sinon fuite
   API). RLS = sacrée.
2. **Canaux** (à confirmer avec l'owner) — double canal recommandé :
   - **Email** (principal) : à `preview_at`, la Liste reçoit le teaser + date
     (Resend, sur le modèle du cron `dispatch_reminders`). C'est ça, le vrai
     « accès en avant-première ».
   - **On-site** (secondaire) : section « Avant-première » en tête du calendrier
     pour les membres identifiés en session (connectés dont l'email est sur la
     waitlist). Pont possible via lien magique (login déjà en OTP/magic-link).
3. **UI** : section « Avant-première » (membres) + chip « Avant-première » sur la
   fiche ; teaser via `teaseLocked`.
4. **Doc** : `db/schema-design.md` à compléter (`preview_at` + vue audience-aware).

## État d'implémentation

- ✅ Renommages de vocabulaire (Ouvert / Résultat / Révélation en cours, prix
  unique) — messages FR+EN, `drop-hero` StatusLine (split closed/revealed),
  `STATUS_FR`.
- ⏳ Phase Avant-première — décidée, pas encore codée (donnée + RLS + email + UI).

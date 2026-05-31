# Drop No. — PRD v2

**Projet** : Drop No.
**Version** : 2.0
**Date** : 30 mai 2026
**Auteur** : Raphaël Hombroeck

---

## 1. Vision & Goals

### Vision

Drop No. est une **maison de drops scellés** dédiée à l'horlogerie premium. Chaque drop est un événement unique, numéroté (Drop No. 001, 002…), où une marque met en vente N exemplaires d'une pièce sélectionnée. Les acheteurs soumettent une offre cachée jusqu'à la révélation. Les N plus hautes offres gagnent, **toutes payent le même prix** : le N-ième bid.

Inspirations : Supreme (drops événementiels, série numérotée), Audemars Piguet (curation, storytelling produit), Airbnb (UX épurée, friction minimale), Christie's sealed sales (mécanisme).

### Goals (SMART)

| Objectif | Mesurable | Échéance | Responsable |
|---|---|---|---|
| 2 marques signées + 5 en pipeline | Contrats LOI signés | Q3 2026 | Founding team |
| Drop No. 001 lancé | 1 drop public clôturé avec ≥10 bids | Q4 2026 | Produit |
| 500 inscrits qualifiés (KYC complet) | Comptes valides post-Stripe Identity | 3 mois post-launch | Marketing |
| GMV cumulé 250k€ | Volume de transactions clôturées | Q1 2027 | Business |
| NPS ≥ 50 (acheteurs) | Sondage post-livraison | 6 mois post-launch | UX |

### Valeurs

- **Événement** : chaque drop est cadencé, attendu, ritualisé
- **Justice perçue** : tous les gagnants payent le même prix, transparence à la révélation
- **Sérénité** : pas de surenchère temps réel, pas de guerre des prix
- **Direct** : aucune intermédiation revente, brand-direct only
- **Premium** : pas de publicité, expérience sans friction

---

## 2. Personas

**Le Collectionneur informé** (cible primaire)
Possède déjà 3-15 montres, follow Hodinkee/Monochrome, budget pièce 5-30k€. Veut accéder à des pièces difficiles à obtenir en boutique (waiting lists AP/Patek, séries limitées indé). Frustré par : grey market peu fiable, listes d'attente opaques, Chrono24 (risque authentification).

**Le néo-collectionneur** (cible secondaire)
Première montre >3k€, découvre l'horlogerie. Suit Teddy Baldassarre, Just One Watch, communautés Discord. Veut un cadre sûr et événementiel pour acheter.

**La marque vendeuse** (offre)
Indépendants (Furlan Marri, Anordain, Massena LAB, Toledano & Chan) ou grandes maisons sur drops sélectionnés. Cherche à toucher une audience de connaisseurs, désintermédier le grey market, contrôler la narrative.

---

## 3. Mécanisme produit — sealed-bid uniform price

### Spec

1. La marque crée un drop : N exemplaires identiques, prix plancher P (≥ 3 000€), fenêtre de bids F (5 jours), date de révélation T.
2. Les acheteurs inscrits + KYC soumettent **une seule offre cachée**, modifiable jusqu'à T-1h.
3. Chaque bid déclenche une pré-autorisation Stripe sur la carte de l'acheteur.
4. À T (révélation publique, événementielle) :
   - Le système trie les bids par ordre décroissant.
   - Les N plus hautes offres ≥ P **gagnent**.
   - **Prix unitaire payé par tous les gagnants = N-ième bid** (le plus bas gagnant).
   - Capture du paiement pour les gagnants, libération des pré-auth pour les perdants.
5. Affichage public post-révélation : nombre de bids, prix unitaire de clôture, anonymat des participants.

### Règles d'arbitrage

- **Égalité au seuil de coupure** : timestamp d'arrivée tranche (premier servi).
- **Moins de N bids ≥ P** : drop annulé (libération de toutes les pré-auth), notification à la marque et aux bidders.
- **Modification de bid** : nouveau timestamp, ancien remplacé, pré-auth ajustée.
- **Retrait de bid** : autorisé jusqu'à T-24h. Au-delà, engagement ferme.

### Variante prix retenue

N-ième bid (clearing price simple). Pas Vickrey/(N+1)-ième.
**Trade-off assumé** : moins d'incitation théorique au bid sincère, mais beaucoup plus simple à expliquer aux utilisateurs.

---

## 4. User stories (révisées)

### Traçabilité depuis PRD v1

| ID v1 | Statut v2 | Raison |
|---|---|---|
| US-01 | Différé | Pas de catégories au MVP (montres only) |
| US-02 | Conservé (filtres marque, prix, statut) | — |
| US-03 | Conservé (Drop Calendar) | — |
| US-04 | Conservé | — |
| US-05 | Modifié (sealed bid) | Mécanisme changé |
| US-06 | **Supprimé** | Pas de classement live en sealed-bid |
| US-07 | Remplacé (US-22) | Notifications événementielles à la place du « offre dépassée » |
| US-08 | Différé (historique drops clôturés post-révélation seulement) | — |
| US-09 | Conservé + ajout (N exemplaires, T révélation) | — |
| US-10 | Modifié (compteur agrégé sans montants) | Confidentialité sealed-bid |
| US-11 | Conservé | — |
| US-12 | Conservé | — |
| US-13 | Supprimé MVP (concierge gère étiquettes) | — |
| US-14–16 | Conservés | — |
| US-17 | Conservé | — |
| US-18 | Différé (brand-direct, donc auth automatique côté marque) | — |
| US-19 | Conservé (Crisp chat) | — |

### Nouvelles user stories MVP

| ID | Persona | Story | Priorité |
|---|---|---|---|
| US-20 | Collectionneur | Modifier ma sealed bid jusqu'à T-1h | ⭐⭐⭐ |
| US-21 | Collectionneur | Voir compte à rebours + N exemplaires restants à attribuer | ⭐⭐⭐ |
| US-22 | Collectionneur | Recevoir notifications : ouverture, J-1, H-1, résultat | ⭐⭐⭐ |
| US-23 | Tous | Consulter Drop Calendar (à venir, en cours, passés) | ⭐⭐⭐ |
| US-24 | Collectionneur | Suivre une marque/un drop avant l'ouverture | ⭐⭐ |
| US-25 | Marque | Voir nombre de bids agrégé sans montants pendant la fenêtre | ⭐⭐ |
| US-26 | Collectionneur | KYC fluide via Stripe Identity (ID + selfie) au 1er bid | ⭐⭐⭐ |
| US-27 | Collectionneur | Voir l'historique des drops clôturés (prix unitaire, N gagnants) | ⭐⭐ |
| US-28 | Marque | Onboarding : signer contrat-cadre, valider KYC entreprise | ⭐⭐⭐ |
| US-29 | Tous | Accepter CGV + politique de rétractation 14j explicite | ⭐⭐⭐ |

---

## 5. Acceptance criteria — stories critiques

### US-05 (modifiée) : Soumettre / modifier ma sealed bid

- Champ « Votre offre (€) » sur la page drop, visible uniquement si KYC complété.
- Validation : offre ≥ prix plancher P.
- Bouton « Sceller mon offre » déclenche :
  - Pré-autorisation Stripe pour le montant exact.
  - Confirmation visuelle (« Offre scellée — révélation dans X jours »).
  - Email de confirmation avec hash de l'offre + horodatage.
- Si l'utilisateur soumet une nouvelle offre, l'ancienne est remplacée, pré-auth ajustée.
- L'offre n'est **jamais affichée** à d'autres utilisateurs, ni à la marque, ni en interne avant T.
- Si T-1h, le champ devient read-only.

### US-21 : Compte à rebours

- Affichage permanent sur la page drop : « Révélation dans 4j 12h 03min ».
- Compteur synchronisé serveur (pas de skew possible).
- Banner change de couleur à H-24, H-1, et T.
- Animation de révélation à T (chiffres qui défilent, prix unitaire qui apparaît).

### US-22 : Notifications événementielles

Émission obligatoire :
- T-fenêtre : « Drop No. XXX ouvert. Tu as 5 jours pour sceller ton offre. »
- T-24h : « Plus que 24h. Ton offre est-elle prête ? »
- T-1h : « Plus que 1h. Dernière chance de modifier. »
- T : « Résultat : tu as gagné [au prix unitaire X€] / tu n'as pas gagné ce drop. »

Canaux : email obligatoire + push (si autorisé). Rate-limit : max 4 notifs par drop.

### US-26 : KYC Stripe Identity

- Déclenché à la première tentative de bid.
- Flow : ID gouvernemental + selfie via SDK Stripe Identity.
- Statut visible dans le profil : Pending / Verified / Rejected.
- Si Rejected : contact Crisp avec raison.
- KYC vérifié = bid possible sur tous les drops à vie.

### US-28 : Onboarding marque

- Page d'inscription marque dédiée (formulaire qualifié).
- Documents requis : Kbis/extrait registre, RIB, contrat-cadre signé électroniquement.
- Validation manuelle par l'équipe Drop No. (SLA 5 jours ouvrés).
- Une fois validée, accès au back-office de création de drop.

---

## 6. Non-functional requirements

### Performance
- TTI (Time To Interactive) page drop < 2s sur 4G.
- Latence soumission bid < 500ms p95.
- Page Drop Calendar < 1s p95.

### Disponibilité
- SLA cible : 99.5% (≈ 3.6h downtime/mois acceptable hors drops actifs).
- **Pendant un drop actif (T-1h → T+15min)** : SLA cible 99.95%. Pas de déploiement, monitoring renforcé.

### Sécurité
- Bids chiffrés au repos (Supabase column encryption ou app-level).
- RLS strict : aucune query lecture des bids autres que les siens avant T.
- Audit log immuable des bids (insert-only table, hash chain).
- Audit sécurité externe avant launch (recommandé Cure53 ou Synacktiv, ~10-15k€).

### Conformité
- RGPD : DPA Stripe + Supabase + PostHog + Crisp + Vercel signés. Registre des traitements documenté.
- AML : KYC Stripe Identity sur tous les acheteurs au 1er bid. Conservation 5 ans.
- CGV publiées, accessibles depuis chaque drop. Mention rétractation 14j explicite.

### Observabilité
- Sentry (frontend + edge functions) : erreurs et performance.
- Supabase logs : queries lentes, RLS violations.
- PostHog : événements produit, funnels.
- Alertes Slack pour : downtime, échec close, erreur Stripe.

### Capacité MVP
- 10 000 utilisateurs inscrits.
- 1 000 bids concurrents par drop.
- 5 drops actifs simultanés max.

### UX transverse (héritage PRD v1)
- **Mobile-first** : 80% trafic attendu sur mobile, design responsive validé sur iOS Safari et Android Chrome avant launch.
- **Accessibilité** : conformité WCAG 2.1 AA (contraste, focus visible, navigation clavier, alt texts).
- **Zéro publicité** : pas de bannières, pop-ups, retargeting tiers visibles. Newsletter et notifications événementielles uniquement.
- **Single-page brand experience** : aucun dark pattern, opt-out clair sur communications.

---

## 7. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind + shadcn/ui | SEO, RSC, ecosystem |
| Backend | Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) | All-in-one, RLS, MCP déjà connecté |
| Hosting | Vercel | Intégration Next.js native, edge |
| Paiement | Stripe + Stripe Identity | Pré-auth, KYC, standard EU |
| CDN images | Cloudflare Images | Optimisation, watermarking |
| Analytics | PostHog | Self-hostable, RGPD-friendly |
| Support | Crisp | Chat + email, free tier MVP |
| Monitoring | Sentry | Erreurs front + back |
| Email transac | Resend | Modern, dev-friendly |
| Logistique | DHL Express + Malca-Amit (>10k€) | Tier par valeur |

### Architecture clé

- **Edge function `closeDrop(dropId)`** : déclenchée par cron Supabase à T exact. Lit les bids triés desc, attribue les N premiers, calcule prix unitaire, capture Stripe, libère perdants, publie résultat. Idempotente, transactionnelle.
- **RLS bids** : `SELECT` autorisé uniquement si `user_id = auth.uid()` OU `drop.revealed_at IS NOT NULL`.
- **Realtime channel** par drop : utilisé seulement pour countdown sync et révélation push.

---

## 8. Modèle business

| Item | Décision |
|---|---|
| **Marketplace type** | Brand-direct only (B2C) — pas de revente C2C, pas de dealers tiers |
| **Authentification** | Certificat marque suffit (vendeur = marque = authenticité) |
| **Frais vendeur** | 12% du prix de clôture + 5€ fixes par exemplaire vendu |
| **Frais acheteur** | 0% (prix de clôture = prix payé) |
| **TVA** | Marge collectée par Drop No. soumise à TVA 20% (à valider expert-comptable) |
| **Prix plancher MVP** | 3 000€ |
| **Cadence** | 1 drop / semaine, jour fixe à définir (reco jeudi 18h CET — Supreme-coded) |
| **Durée fenêtre bid** | 5 jours (vs 7j initiaux — contrainte pré-auth Stripe) |
| **Rétractation** | 14 jours standard EU à compter de la livraison, remboursement intégral |
| **Livraison** | DHL Express assuré (3-10k€) / Concierge Malca-Amit main propre (>10k€) |
| **Assurance** | Inclus dans coût livraison, couverture jusqu'à 200k€ (DHL) ou illimité (Malca) |
| **KYC** | Acheteur : Stripe Identity au 1er bid. Vendeur : validation manuelle + Kbis |

---

## 9. Out-of-scope MVP (différé v2+)

- Revente C2C secondaire (acheteurs revendent entre eux)
- App mobile native (web responsive only au MVP)
- Certificats NFT / blockchain
- Catégories autres que montres (bijoux, vêtements, art, vin)
- Programme premium tier (early access, drops privés)
- API publique pour marques
- Multi-langues (FR + EN uniquement au MVP, pas DE/IT/ES)
- Paiement crypto
- Programme de parrainage / referral
- Live shows / drops vidéo
- Trade-in / reprise

---

## 10. Risques (risk register)

| # | Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Aucune marque signée à Q3 2026 | Moyenne | Bloquant | Pipeline 10+ marques début sales, contrat type pré-négocié, founding partner deal (commission 0% sur 3 premiers drops) |
| R2 | Bug edge function `closeDrop` au moment critique | Faible | Catastrophique (perte trust) | Tests automatisés exhaustifs, dry-run sur staging avant chaque drop, alerting hors normes, runbook incident |
| R3 | Pré-auth Stripe échoue à la capture | Moyenne | Élevé | Plan B : retry 3x sur 24h, communication transparente au gagnant et à la marque, possibilité de réattribuer au bid suivant |
| R4 | Fuite des bids avant T (interne ou breach) | Faible | Catastrophique | Chiffrement at-rest, audit log, accès admin restreint (founders only), pentest avant launch |
| R5 | Litige authentification (marque conteste casual contre acheteur) | Faible (brand-direct) | Élevé | Brand-direct supprime la majorité du risque. CGV clarifient responsabilité marque. Assurance marchandise. |
| R6 | DGCCRF / rétractation EU mal appliquée | Moyenne | Élevé | Consultation juriste e-commerce EU avant CGV. Tests utilisateurs sur flow rétractation. |
| R7 | Cash burn pré-traction | Élevée | Moyen | Stack low-cost (Supabase, Vercel, Crisp), équipe lean, milestones GMV-gated |
| R8 | Concurrent positionné identique (Catawiki étend, Christie's lance Drop) | Moyenne | Moyen | Vitesse, brand-direct exclusif (positionnement défensible), partenariats marques exclusifs |
| R9 | Acheteur fraude (KYC contourné, carte volée) | Faible | Moyen | Stripe Radar + Stripe Identity. Plafond bid first-time (ex : 10k€ premier drop). |
| R10 | Marque retire un drop en cours | Faible | Élevé | Clause contrat-cadre interdit retrait après T-fenêtre. Pénalité forfaitaire si retrait. |

---

## 11. Edge cases

| Cas | Comportement attendu |
|---|---|
| Bids identiques au seuil de coupure | Premier timestamp gagne, autres perdent |
| Moins de N bids ≥ P | Drop annulé, pré-auths libérées, notification marque + bidders |
| Acheteur tente de bidder sans KYC | Modal Stripe Identity bloque l'action |
| Acheteur KYC en cours (Pending) au moment de T | Bid annulé si non vérifié à T-1h, pré-auth libérée |
| Pré-auth Stripe expire avant T | Retry de capture à J-1, sinon bid invalidé et N-ième bid suivant promu |
| Marque manque la livraison après gain | Refund automatique acheteur à J+14 non-expédition, pénalité marque |
| Acheteur exerce rétractation 14j | Refund intégral via Stripe, montre retournée à marque (frais retour côté Drop No., à amortir sur fees) |
| Drop No. en maintenance pendant fenêtre bid | Page status, communication push aux bidders, T décalée si downtime > 1h |
| Double-spend (acheteur essaie de bidder sur 2 drops simultanés avec même carte) | Stripe Radar bloque ou Drop No. plafonne nb de pré-auth concurrentes par user |

---

## 12. Design tokens

| Token | Valeur |
|---|---|
| Couleur primaire | `#0A0A0A` (noir profond) |
| Couleur fond | `#FAFAF7` (off-white) |
| Couleur accent | `#1A1A1A` ou `#C9A96E` (champagne désaturé) — à valider en maquettes |
| Typo titres | Editorial New / GT Sectra (serif éditorial) |
| Typo corps | Inter (sans-serif neutre) |
| Mode | Light default, dark mode à explorer |
| Densité | Spacieuse, AP/Hermès-coded, jamais dense |

---

## 13. Roadmap

| Phase | Période | Livrables |
|---|---|---|
| **Pre-MVP** | Juin–Août 2026 | Stack technique posée, maquettes Figma validées, pipeline 5+ marques en sales, contrat-cadre, CGV validées juriste |
| **MVP closed beta** | Septembre 2026 | Drop No. 001 (1 marque, ~50 invités KYC sur waitlist), feedback intensif |
| **MVP public launch** | Octobre/Novembre 2026 | Drop No. 002 public, marketing lancé, 500 inscrits cible |
| **Scale v1** | Q1 2027 | 5 drops réalisés, GMV 250k€, NPS 50+, premier hire |
| **v2** | Q2-Q3 2027 | Catégories additionnelles (bijoux), programme premium, app native |

---

## 14. Décisions en suspens

- Variante prix Vickrey (N+1-ième bid) à reconsidérer post-launch si évidence de bidding non-sincère
- Jour de la semaine du drop (reco jeudi 18h CET, à confirmer après tests marketing)
- Accent doré exact (`#C9A96E` champagne désaturé proposé)
- Politique précise sur les bids retirés entre T-24h et T (interdire ou pénaliser ?)
- TVA sur fees marque : régime spécifique à valider expert-comptable

# Back-office Drop No. — Gap analysis (2026-06-12)

Objectif : pouvoir gérer **tout le business** depuis `/admin` (+ `/maison`). Audit basé sur docs/specs/BACKOFFICE.md et le code actuel (8 surfaces existantes : dashboard, historique, produits, commandes, clients, maisons, support, dashboard maison).

Priorités : **P0** = bloquant pour opérer au lancement · **P1** = nécessaire dès les premières semaines · **P2** = confort/scale.

---

## 1. Pilotage des drops en live — P0

Le plus gros trou : la clôture (`close_drop` + capture Stripe) tourne en cron sans visibilité ni rattrapage.

| Écran/feature | Détail |
|---|---|
| **Console de clôture** (`/admin/drops/[id]/cloture`) | Statut du run `close_drop` : bids triés, gagnants, captures Stripe réussies/échouées, **relance manuelle** par bid, log d'erreurs |
| Incidents drop | Annuler un drop (release toutes les pré-auths), prolonger une fenêtre, re-planifier après échec technique. Avec confirmation forte + trace audit |
| Vue bids d'un drop (admin only) | Liste des bids actifs/retirés, disqualification manuelle d'un bid (fraude) avec motif, marquage multi-comptes suspects |
| Santé crons | Statut `dispatch_ripe_drops` / `open_ripe_drops` / `dispatch_reminders` : dernier run, échecs, alerte email si silence |

## 2. Finance — P0

Rien n'existe. C'est pourtant le cœur : on encaisse pour le compte des maisons.

| Écran/feature | Détail |
|---|---|
| **Payouts maisons** (`/admin/finance/payouts`) | Par drop révélé : CA brut, commission 12% + 5€/pièce, net dû, statut versement (à payer / payé / litige), relevé PDF par maison |
| **Remboursements & rétractations** (`/admin/finance/remboursements`) | Workflow 14j EU : demande → retour reçu → inspection → refund Stripe déclenché depuis l'admin (aujourd'hui 100% manuel). Compteur de délai légal |
| Litiges / chargebacks | Liste des disputes Stripe, pièces à fournir, échéances |
| Facturation | Factures de commission aux maisons (TVA à valider expert-comptable), reçus clients |
| Export comptable | CSV par période (transactions, refunds, fees), base déclaration TVA |

## 3. Logistique — P1

`commandes` couvre le statut, mais le flux physique réel manque.

| Écran/feature | Détail |
|---|---|
| Tracking intégré | Numéro + statut DHL Express en ligne (API ou lien), valeur assurée, preuve de livraison signée |
| Enlèvements maisons | Adresses de pickup par maison, planification des enlèvements post-reveal, bordereau |
| **Retours** | Flux inverse pour rétractation : étiquette retour, réception, état de la pièce, lien vers remboursement (§2) |
| Incidents transport | Perte/casse/retard : dossier assurance, statut, indemnisation |
| Malca-Amit (>10k€) | Process concierge : checklist coordination, créneau main propre, contact |

## 4. Clients & comptes — P1

Aujourd'hui lecture seule. Il faut pouvoir agir.

| Écran/feature | Détail |
|---|---|
| Actions compte | Suspendre/bannir (avec motif + audit), forcer re-KYC, débloquer un KYC coincé, notes internes |
| **RGPD** | Export des données d'un client, suppression/anonymisation de compte, registre des demandes |
| Risque & fraude | Score simple : bids retirés répétés, KYC échoués, multi-comptes (même adresse/CB), liste de surveillance |
| Communication | Historique des emails Resend par client, renvoi manuel (confirmation, reminder), bloc « contacter » → crée un ticket support |

## 5. Maisons — P1

| Écran/feature | Détail |
|---|---|
| **Workflow de validation drop** | Maison édite/propose un drop côté `/maison` (TODO existant) → statut brouillon → validation opérateur → planifié. L'admin garde la main |
| Conditions commerciales | Taux de commission par maison si négocié (défaut 12% + 5€), contrat signé (upload), statut onboarding : prospect → en discussion → signé → actif |
| Relevés côté `/maison` | La maison voit ses payouts, relevés et le statut logistique de ses pièces (post-reveal uniquement, gating existant) |
| Upload visuels | Bucket Supabase Storage (TODO existant) : photos pièces + logo, au lieu d'URLs |

## 6. Site web & contenu — P1

« Gérer le site » sans redéployer.

| Écran/feature | Détail |
|---|---|
| **Réglages plateforme** (`/admin/parametres`) | Jour/heure de drop par défaut, prix plancher minimum, frais, toggle « construction gate », bannière d'annonce vitrine |
| Contenu éditorial | Édition du storytelling par drop (la fiche pièce est le produit), FAQ, pages légales (CGV, rétractation, mentions) versionnées |
| Emails transactionnels | Aperçu des templates Resend, envoi de test, log des envois/échecs |
| SEO | Title/description/OG image par drop |

## 7. CRM & notifications — P2

| Écran/feature | Détail |
|---|---|
| Audience | Liste waitlist/abonnés alerts (`drop_alerts`/`drop_notifications` existent, deny-all), segments simples (a bidé / a gagné / dormant) |
| Annonces drop | Composer + programmer l'email d'annonce du drop de la semaine, stats d'ouverture |

## 8. Analytics business — P2

PostHog couvre le produit ; il manque la vue business consolidée.

| Écran/feature | Détail |
|---|---|
| Dashboard business | GMV, taux de clearing (N vendus / N offerts), prix de clôture vs plancher, bids/drop, nouveaux KYC, répétition acheteurs |
| Post-mortem par drop | Distribution des bids (admin only), demande vs offre, courbe des modifications de bids dans le temps |

## 9. Plateforme & sécurité — P0 (léger)

| Écran/feature | Détail |
|---|---|
| **Gestion des admins** | CRUD `platform_admins` depuis l'UI (aujourd'hui SQL à la main). V2 : rôles ops/finance/support |
| **Audit log viewer** | La table `audit_log` existe (deny-all) : l'exposer en lecture admin, filtrable par acteur/objet. Indispensable dès qu'on a des actions destructives (§1, §4) |
| Nettoyage données démo | Bouton ou script tracé (bidders `@dropno.test`, ticket démo) avant prod |

## 10. Mobile — transversal

Desktop-first OK, mais prévoir un **mode terrain** :

- Sidebar → bottom nav / burger sur < 768px ; tableaux → cartes empilées.
- Les 4 usages mobiles réels : suivre un drop en live (J de reveal), valider/relancer une capture échouée, répondre au support, vérifier un tracking. Ces écrans-là doivent être impeccables en mobile, le reste peut rester desktop.
- Actions à 1 tap avec confirmation, pas de formulaires longs.

---

## Reco d'ordre d'implémentation

1. **P0 — opérer sans risque** : console de clôture + incidents drop, payouts + remboursements, audit log viewer, gestion admins, santé crons.
2. **P1 — semaines 1-4 post-launch** : retours logistique + tracking, actions comptes clients + RGPD, workflow validation drop maison, réglages plateforme + contenu, upload Storage.
3. **P2 — scale** : CRM/segments, analytics business, post-mortem drops, rôles admin granulaires.

Dépendances notables : remboursements (§2) ↔ retours (§3) ; disqualification bid (§1) → audit log (§9) ; workflow maison (§5) → upload Storage (§5).

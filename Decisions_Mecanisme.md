# Décisions verrouillées & impacts PRD

## ✅ Décisions

1. **Mécanisme** : Sealed-bid multi-unités, uniform price
2. **Direction brand** : Drops (Supreme-coded, événementiel)

---

## 1. Spec technique du mécanisme retenu

**Règle du jeu** :
- Vendeur crée un drop : N exemplaires, prix plancher P, fenêtre de bids (ex: 5 jours), date de révélation T.
- Chaque acheteur soumet **une seule offre cachée**, modifiable jusqu'à T.
- À T, le système trie les offres par ordre décroissant.
- Les **N plus hautes offres ≥ P** gagnent.
- **Tous les gagnants paient le même prix** : le N-ième bid (le plus bas gagnant).
- Bids des perdants : pré-autorisation libérée.

**Variante à trancher** : prix unitaire = N-ième bid (uniform-price clean) ou (N+1)-ième bid (Vickrey-clearing, plus incitatif à bidder sincèrement). Reco MVP : N-ième bid pour simplicité.

**Edge cases à spécifier** :
- Égalité au seuil de coupure (ex : 3 bids identiques pour la dernière place) → ordre d'arrivée (timestamp) tranche
- Modification de bid : nouveau timestamp, ancien remplacé
- Retrait de bid : autorisé jusqu'à T-24h, après → engagement ferme (impose KYC)
- Moins de N bids ≥ P : vendeur peut annuler le drop ou vendre aux acheteurs présents au prix plancher

---

## 2. User stories à réviser

| ID original | Changement | Nouvelle formulation |
|---|---|---|
| US-05 | Modifier | Soumettre/modifier ma sealed bid jusqu'à la clôture, avec pré-auth |
| US-06 | **Supprimer** | (pas de classement live dans un sealed bid) |
| US-07 | Remplacer | Notifications événementielles : ouverture, J-1, H-1, résultat |
| US-08 | Différer | Historique des drops clôturés (prix de révélation publiés post-event) |
| US-09 | Étendre | Vendeur définit : prix plancher P, exemplaires N, fenêtre de bids, date révélation T |

**Nouvelles stories à ajouter** :
- US-20 : Modifier ma sealed bid jusqu'à T-1h
- US-21 : Voir le compte à rebours et le nombre d'exemplaires restants
- US-22 : Recevoir le résultat de révélation (gagné au prix unitaire X / perdu) avec breakdown
- US-23 : Consulter le « Drop Calendar » (drops à venir, en cours, passés)
- US-24 : Recevoir un rappel J-1 si je n'ai pas encore bidé sur un drop suivi
- US-25 (vendeur) : Voir le nombre de bids (pas les montants) pendant la fenêtre

---

## 3. Impacts business

| Dimension | Avant (English ouvert) | Après (Sealed-bid uniform) |
|---|---|---|
| **Hook utilisateur** | Adrénaline temps réel | Suspense événementiel (drop weekly) |
| **Revenus vendeur** | Pic au top bid, queue basse | Stables, prévisibles |
| **Risque guerre des prix** | Élevé (dégrade brand) | Nul |
| **Fréquence drops** | Continue | Cadencée (weekly/monthly recommandé) |
| **Marketing** | « Enchérissez maintenant ! » | « Drop Thursday 18h. Sealed bids ouverts. » |
| **Anti-sniping** | Critique | Inutile (rien à sniper) |

**Conséquence stratégique** : ton produit devient **événementiel** (drops calendaires) plutôt que **transactionnel continu**. Ça matche Supreme à 100%.

---

## 4. Impacts tech

| Aspect | Impact |
|---|---|
| WebSocket | Plus optionnel — utilisé seulement pour le compte à rebours et la révélation live |
| Charge serveur | Beaucoup plus faible (pas de bids en rafale) |
| Edge function | Une fonction critique : `closeDrop()` à T précise, exécutée par cron |
| Sécurité bids | Bids doivent être inaccessibles côté API jusqu'à T (RLS Supabase + logique stricte) |
| Pré-auth Stripe | Toujours 7j max → durée fenêtre 5j max, libération auto des perdants à T+1 |
| Audit trail | Critique : hash des bids, log d'ordre d'arrivée, pour défense en cas de litige |

---

## 5. Impacts légaux

- Toujours soumis à droit de rétractation EU (14j) — mécanisme ne change rien.
- **Mais** : qualification juridique plus simple. C'est une « vente à exemplaires limités à prix de marché révélé », pas une enchère. Moins de risques avec le code de la consommation EU.
- CGV doivent expliciter : engagement ferme à T-24h, libération pré-auth à T, prix de révélation contractuel.

---

## 6. Impacts UX/design

- **Page produit** : compte à rebours dominant, input bid sobre, pas de classement. Inspiration : pages Drop Supreme + pages lot Christie's.
- **Page Drop Calendar** : devient un asset central (équivalent du Supreme calendar). À designer dès le MVP.
- **Page révélation** : moment de drama, animation à la clôture (chiffres qui défilent, prix final qui apparaît). Inspiration : H&M x Designer drops, NTWRK live shows.
- **Page profil** : « Mes bids » avec statut In Window / Sealed / Won / Lost.
- **Mood général** : plus contemplatif, moins gamifié. Cohérent AP.

---

## 7. Shortlist noms — direction Drops

| Nom | Vibe | Pros | Cons |
|---|---|---|---|
| **Drop No.** (Drop No. 001, 002...) | Supreme x Hodinkee | Sériel, collectionnable, simple | « Drop » seul est très utilisé |
| **Coterie** | Cercle exclusif, FR/EN | Premium, suggère communauté de connaisseurs | Prononciation EN incertaine |
| **Reserve** | Double sens : auction reserve + premium reserve | Court, déjà luxe-coded | Très utilisé dans hôtellerie/vin |
| **Hush** | Évoque le sealed bid | Court, mémorable, original | Trop discret pour une marque |
| **Lot** | Vocabulaire enchère + Pantone Lot | Court, app-friendly, sériel | Trop générique seul |
| **Conclave** | Secret, vote scellé, rare | Original, premium, parfait pour sealed-bid | Connotation religieuse |
| **Sceau** | « Sealed » en FR | Identitaire FR/luxe | Compliqué en EN |
| **Maison** + suffixe | French luxe codification | Cohérent AP/Hermès | Très saturé |

**Mes 3 favoris pour ta vision** :

1. **Conclave** — sémantique parfaite (vote scellé, élite réunie, raré, secret) + sonne sérieux et international. Domaine probablement dispo en .com.
2. **Coterie** — communauté de connaisseurs sélecte, le mot existe en EN et FR, élégant.
3. **Drop No.** — direct, Supreme-coded, sériel (chaque drop est numéroté, devient collectible).

---

## 8. Prochaines décisions à prendre

1. **Variante prix** : N-ième bid (simple) vs (N+1)-ième bid (Vickrey, plus incitatif).
2. **Nom final** : valider parmi shortlist + checker dispo domaine & INPI.
3. **Cadence drops** : weekly fixed day (Supreme = Thursdays) vs irrégulier event-based.
4. **Nombre de drops simultanés** : un seul à la fois (focus, scarcity max) vs plusieurs en parallèle (volume) ?
5. **Bid public ou privé après clôture** : montants gagnants révélés ? Que les prix unitaires de clôture ?

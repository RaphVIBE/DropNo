# Mécanisme d'enchère — diagnostic & options

## 1. Ce que ton PRD décrit réellement

| Élément du PRD | Implication mécanique |
|---|---|
| « 100 gagnants max par produit » | Multi-unités (pas un seul vainqueur) |
| « Voir mon classement en temps réel (#3) » | Bids visibles → format ouvert (English) |
| « Offre minimale +10% par rapport à la précédente » | Surenchère ascendante |
| « Historique des offres anonymisé » | Transparence partielle |
| « Prix plancher défini par le vendeur » | Reserve price classique |

**Verdict** : ce n'est PAS une enchère inversée. C'est une **enchère multi-unités ascendante (English) avec offre limitée** — proche du modèle des IPO, des bons du Trésor, et de certains drops crypto.

---

## 2. Pourquoi « enchère inversée » est faux

Définition standard d'enchère inversée (reverse auction) :

> Un acheteur publie un besoin. Plusieurs **vendeurs** se concurrencent en **baissant** leur prix pour gagner le contrat.

Usages typiques : appels d'offres B2B, procurement, marchés publics, Upwork.

Dans ton modèle, **les acheteurs se concurrencent en augmentant** leur offre pour acquérir un bien rare. C'est exactement l'inverse — une enchère classique.

Le mismatch va causer :
- Confusion SEO (utilisateurs cherchant « reverse auction » trouveront du procurement B2B)
- Confusion juridique dans tes CGV (les obligations diffèrent)
- Confusion utilisateur (le terme évoque « je baisse mon prix » pour les pros)

---

## 3. Taxonomie des mécanismes possibles pour toi

Quatre dimensions à choisir :

### A. Format d'enchère
| Format | Description | Feel utilisateur | Cas d'usage typique |
|---|---|---|---|
| **English (ouvert ascendant)** | Bids visibles, on voit son rang, surenchère continue | Compétitif, addictif, transparent | eBay, Sotheby's live |
| **Sealed-bid (offres scellées)** | Une seule offre cachée, révélation à la fin | Mystérieux, premium, calme | Christie's sealed sales, drops Supreme |
| **Hybride (semi-scellée)** | On voit son rang mais pas les montants | Compétitif sans guerre des prix | StockX bids, certaines plateformes art |

### B. Règle de prix (multi-gagnants)
| Règle | Description | Avantage | Inconvénient |
|---|---|---|---|
| **Pay-as-bid (discriminatoire)** | Chaque gagnant paie son propre bid | Maximise revenus vendeur | Sentiment d'injustice (« j'ai payé 3x plus que mon voisin pour la même montre ») |
| **Uniform price** | Tous les gagnants paient le même prix (la plus basse offre gagnante) | Perçu comme juste | Revenus vendeur plus bas, incite au sniping |
| **Vickrey (second-prix)** | Gagnants paient le prix de la plus haute offre perdante | Incite à bidder sincèrement | Complexe à expliquer, peu intuitif |

### C. Durée & clôture
- Durée fixe (7 jours actuels)
- Anti-sniping : extension auto si bid dans dernières 2-5 min
- Clôture nette (risque de sniping pur — pas recommandé)

### D. Visibilité des bids
- Montants visibles (eBay)
- Montants masqués, rang visible (StockX)
- Tout masqué jusqu'à la fin (sealed)

---

## 4. Trois combinaisons cohérentes avec ta vision premium

### Option A — « English multi-unités pay-as-bid » (≈ ce que ton PRD décrit)
- Bids visibles, rang en temps réel, +X% incréments
- Top N gagne, chacun paie son bid
- Anti-sniping +2min
- **Feel** : eBay/Catawiki en plus chic
- **Nom suggéré** : « Bid », « Auction », « Drop Auction »
- ⚠️ Risque : sentiment d'injustice entre gagnants payant des prix différents

### Option B — « Sealed-bid multi-unités uniform price » (le plus Supreme-AP)
- Une seule offre cachée par user, modifiable jusqu'à la fin
- À la clôture : top N gagne, tous paient le N-ième prix (le plus bas gagnant)
- Pas de surenchère temps réel, pas de classement visible — juste « in/out »
- **Feel** : drop élégant, suspense, pas de guerre des prix vulgaire
- **Nom suggéré** : « Sealed Drop », « Silent Bid », « Blind Drop »
- ✅ Cohérent avec inspirations AP/Supreme
- ⚠️ Tu perds les notifs « vous êtes dépassé » et le hook addictif

### Option C — « Hybride à la StockX » (compromis)
- Rang visible, montants masqués
- Pay-as-bid OU uniform — au choix
- Anti-sniping
- **Feel** : tension compétitive sans course aux prix publics
- **Nom suggéré** : « Bid », « Live Drop »

---

## 5. Recommandation

Pour matcher ta vision **AP / Supreme / Airbnb**, l'**Option B (Sealed-bid uniform price)** est la plus différenciante :

- AP et Supreme ne font pas de guerre des prix publique → cohérent
- Pas de risque de « bidding war » qui dégrade le brand
- Justice perçue (tous paient pareil) → meilleur NPS
- Différencie nettement de eBay/Catawiki
- Le « mystère » jusqu'à la révélation crée un événement (drop weekly)

Inconvénient assumé : pas de hook addictif type eBay. Mais ton public cible (collectionneurs premium) préfère l'élégance à l'adrénaline.

**Côté nom** : éviter « auction » et « enchère » trop génériques. Pistes :
- **Drops** (Supreme-coded, simple, mémorable)
- **Sealed** (mystère, premium)
- **Bid** (court, app-friendly)
- **Allocations** (finance/luxe-coded, AP-like)

---

## 6. Implications selon le choix

| Décision | Impact UX | Impact tech | Impact business |
|---|---|---|---|
| English ouvert | Notifs push, classement live, addiction | WebSocket critique, charge serveur élevée | Sentiment de guerre des prix |
| Sealed-bid uniform | Pas de classement live, événement de clôture | Moins de temps réel, plus de batch | Revenus vendeur plus stables, pas de spikes |
| Hybride StockX | Tension sans guerre | WebSocket pour le rang | Compromis |

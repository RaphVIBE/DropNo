# Batch 02 — Révision rétention + format save (créé 2026-06-26)

Surcouche au brouillon `batch-02.md`. À valider avant export/programmation. **Ne remplace pas les captions** (la ligne accès tient, le ton sec aussi). Corrige deux choses que le point d'étape du 26/06 a révélées : les Reels ne retiennent pas (donc l'algo ne les pousse pas), et rien n'est sauvegardé (0 save = l'autorité ne prend pas).

Diagnostic : aujourd'hui un Reel ouvre sur une **carte ink statique** (texte sur fond) pendant 2 secondes. C'est exactement le frame qui fait scroller. Et le take-away à retenir est noyé dans la caption, pas isolé visuellement. On corrige les deux.

---

## Règle 1 — Structure de Reel « rétention first »

La carte titre quitte le début. Elle devient la **signature finale**. On ouvre sur du mouvement + une ligne d'accroche en overlay.

| Phase | Durée | Avant (batch 01) | Maintenant |
|---|---|---|---|
| Hook | 0:00-0:01 | carte ink statique | **macro déjà en mouvement** + la phrase la plus forte en overlay |
| Boucle ouverte | 0:01-0:03 | (suite du texte) | une question ou un paradoxe qui empêche de scroller |
| Corps | 0:03-0:20 | translations lentes | 2-3 temps, chaque plan bouge (pan/zoom/focus qui glisse) |
| Chute | 0:20-0:25 | chute sur ink | la chute en overlay sur le dernier plan vivant |
| Signature + save | 0:25-0:27 | (carte au début) | **la carte titre arrive ICI**, 1,5 s, et porte la pépite gardable |

Pourquoi : la rétention des 3 premières secondes décide du reach. Un visuel qui bouge + une phrase qui ouvre une boucle = on reste. La carte typographique reste notre signature, mais en sortie, pas en barrage d'entrée.

Trois micro-règles :
- **Frame 1 jamais immobile.** Même un léger pan suffit. L'œil s'arrête sur le mouvement, pas sur du texte fixe.
- **Une idée par plan.** Le texte à l'écran ne dépasse pas 7-8 mots par beat.
- **Boucle.** Le tout dernier frame raccorde visuellement au premier (la cage de tourbillon, le cadran) pour que le replay soit invisible : ça gonfle la watch time.

---

## Règle 2 — Le « save artifact »

Chaque post à pépite gagne **une slide unique, nette, screenshotable** : la chose à garder, isolée. C'est elle qui déclenche le save (et le save est notre KPI d'autorité). Sobre, fond ink ou crème, une seule phrase ou un seul chiffre, le « № » en filigrane.

Le save artifact est :
- la **dernière slide** d'un carrousel,
- le **frame de signature** d'un Reel (Règle 1),
- et, pour un post statique, **le visuel lui-même** recadré pour que la phrase soit lisible en vignette.

Test : « est-ce que quelqu'un screenshoterait ça pour le retrouver ? » Si la pépite n'est pas isolable en une phrase, le post n'a pas de raison d'être sauvegardé.

---

## Application poste par poste (batch 02)

### Icon 1 · Royal Oak (lun 29/06) → **carrousel + variante Reel**
Photo macro tapisserie + vis octogonales = très filmique. On en fait un **Reel** (priorité reach), le carrousel reste en secours.

Reel « royal-oak-cure » :
- **0:00-0:01** macro qui glisse sur le motif tapisserie du cadran · overlay : *Steel, priced like gold.*
- 0:01-0:03 zoom arrière révèle la lunette octogonale · *In 1972 the industry called it suicide.*
- 0:03-0:10 pan sur les 8 vis · *A luxury sports watch in steel. Drawn overnight by Gérald Genta.*
- 0:10-0:18 retour cadran · *It saved haute horlogerie.*
- 0:18-0:24 plan large montre · chute : *Now it is the one watch you cannot get at retail.*
- **0:24-0:26 carte signature / save** : *The cure became the symptom.* (№ filigrane)

Save artifact : la carte finale « The cure became the symptom ».

### Icon 2 · Speedmaster (mer 01/07) → carrousel, save artifact ajouté
Reste carrousel (respire). Ajouter en **dernière slide** la pépite gardable :
> The Speedmaster timed the 14-second burn that brought Apollo 13 home. Still in the catalogue.

### G · Sealed envelopes (ven 03/07) → **Reel** (le plus stratégique)
On a déjà le script `reel-sealed` dans `reels-scripts-batch-01.md`. On le **re-coupe en structure rétention** :
- **0:00-0:01** macro de l'enveloppe crème, lumière rasante qui balaie · overlay : *The most consequential auctions happen in silence.*
- 0:01-0:03 la pliure du papier en travelling · *No room. No paddles. No raised hands.*
- 0:03-0:10 · *Every week the US Treasury sells billions in bonds this way.*
- 0:10-0:17 plan sur le cachet · *Each buyer submits one offer.*
- 0:17-0:22 · chute : *Everyone who wins pays the same price.*
- **0:22-0:24 carte signature / save** : *Quiet money has always preferred a sealed envelope.* (№ filigrane)

Save artifact : « one offer, everyone pays the same price » isolé sur la carte finale. C'est notre mécanisme planté sans le nommer : la slide la plus stratégique du batch.

### H · Scarcity you can verify (lun 06/07) → statique, devient le save artifact
Le post est déjà une maxime. On le traite **directement comme save artifact** : carte unique, phrase centrée, lisible en vignette.
> Scarcity you can verify is worth more than scarcity you must believe.

### I · Tourbillon (mer 08/07) → **Reel** (le plus filmique du lot)
Une cage qui tourne est faite pour la vidéo. Script `reel-tourbillon` re-coupé :
- **0:00-0:01** la cage déjà en rotation, ralenti · overlay : *A tourbillon does not make your watch more accurate.*
- 0:01-0:03 gros plan pont · *So why pay six figures for one?* (boucle ouverte)
- 0:03-0:10 · *Patented in 1801 to fight gravity on a pocket watch held upright.*
- 0:10-0:17 une révolution, 60 s comprimées · *On your wrist, that advantage is mostly gone.*
- 0:17-0:23 très gros plan · chute : *Ninety parts, lighter than a feather, turning on themselves.*
- **0:23-0:25 carte signature / save** : *It was never about accuracy.* (boucle : raccord sur la cage du frame 1)

Save artifact : la carte finale + le plan de la cage (très screenshotable).

### Icon 3 · Paul Newman Daytona (ven 10/07) → carrousel, save artifact ajouté
Reste carrousel (provenance, photo vintage). Dernière slide :
> Standard production. Anyone could have bought one. Everything that made it priceless happened after they left the boutique.

### Posts inchangés
LI-3, LI-4 (LinkedIn) : aucun changement, ce format marche différemment et le diagnostic IG ne s'y applique pas.

---

## Récap des changements

| Post | Avant | Après |
|---|---|---|
| Royal Oak | carrousel | **Reel** rétention + carte save |
| Speedmaster | carrousel | carrousel + **slide save** |
| Sealed envelopes | statique | **Reel** rétention + carte save |
| Scarcity verify | statique | statique = **save artifact** |
| Tourbillon | statique/photo | **Reel** rétention (boucle) + carte save |
| Daytona | carrousel | carrousel + **slide save** |

Résultat : 3 Reels pensés pour le reach (vs 0 dans le brouillon), chaque post accès/mécanisme porte une pépite gardable. La ligne édito et les captions ne bougent pas.

---

## Production des Reels (décidé 2026-06-26)

Style retenu : **animé / gravé via Remotion**, continuité du batch 01 (kinetic typographique + fond planche technique qui s'assemble, vraies polices Fraunces italic + Inter, audio Bach). Pas de tournage ni de footage stock. Les 3 Reels (Royal Oak, Sealed envelopes, Tourbillon) seront ajoutés comme 3 nouvelles compositions dans `social/remotion-reels/`, paramétrées (schéma Zod), suivant la structure rétention ci-dessus (frame 0 en mouvement, carte signature en sortie, boucle pour le tourbillon). Rendu en LOCAL par Raph (`npm run dev` / `npm run render:all`) — le sandbox ne peut pas exécuter Remotion (npm registry + Chromium bloqués).

## À valider à la revue visuelle (dimanche 28/06)
- Les 3 nouvelles cartes signature (Royal Oak, Sealed, Tourbillon) + les 3 slides save (Speedmaster, Scarcity, Daytona) à produire au kit.
- Confirmer les sources photo Unsplash (déjà présélectionnées dans `batch-02.md` §Photos).
- Caler l'audio des 3 Reels (voir `fiche-audio-reels.md` : Bach déjà associé à sealed et tourbillon).

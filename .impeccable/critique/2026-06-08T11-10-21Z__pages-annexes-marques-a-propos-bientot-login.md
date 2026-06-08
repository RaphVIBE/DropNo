---
target: pages annexes (marques, a-propos, bientot, login)
total_score: 31
p0_count: 0
p1_count: 3
timestamp: 2026-06-08T11-10-21Z
slug: pages-annexes-marques-a-propos-bientot-login
---
# Critique — Pages annexes (Drop No.)

Cible : `/marques`, `/marques/[slug]`, `/a-propos`, `/bientot`, `/login`.
Register : brand (marketing/contenu). Détecteur déterministe indisponible (moteur absent du bundle) ; revue manuelle + inspection navigateur.

## Design Health Score

| # | Heuristique | Score | Problème clé |
|---|-----------|-------|--------------|
| 1 | Visibilité du statut | 3 | Statuts de drops clairs ; pages contenu peu stateful |
| 2 | Correspondance monde réel | 4 | Langue humaine, éditoriale, FR juste |
| 3 | Contrôle & liberté | 3 | Back links présents ; état clairsemé /marques sans guidage |
| 4 | Cohérence & standards | 2 | /a-propos sans filigrane ni animation ; wordmark « No. » vs « Nº » |
| 5 | Prévention des erreurs | 3 | Empty states présents |
| 6 | Reconnaissance > rappel | 4 | Labels clairs, zéro jargon |
| 7 | Flexibilité & efficacité | 3 | Navigation simple, correcte |
| 8 | Esthétique & minimalisme | 3 | Très on-brand, mais vide gris /marques + champagne x3 /bientot |
| 9 | Récupération d'erreur | 3 | 404 marque, messages d'erreur présents |
| 10 | Aide & documentation | 3 | /a-propos fait office de contexte, email contact |
| **Total** | | **31/40** | **Bon, avec des trous de cohérence** |

## Anti-Patterns Verdict

**LLM** : ce n'est PAS du slop. L'ensemble est distinctement Drop No. : Fraunces italic, filets fins, filigrane cadran, retenue éditoriale. Un public ne dirait pas « AI made that ». MAIS une infraction franche aux bans : un **em dash** dans la copy utilisateur (fiche marque, lead de repli).

**Scan déterministe** : indisponible (le moteur `detect-antipatterns.mjs` n'est pas inclus dans ce bundle de skill). Tentative réelle effectuée, fallback assumé. Substitut manuel : aucun `border-left` coloré, aucun gradient text, aucun `hover:opacity` sur ces pages (bon).

**Visuel** : `/marques` montre un grand bloc gris orphelin à droite quand il y a < 3 maisons (le `bg-rule-soft` du conteneur grid transparaît).

## Overall Impression

Des pages annexes globalement nobles et cohérentes avec le cœur du produit : même grammaire typographique, mêmes filets, même filigrane. Le travail est réel. Mais deux pages tirent la note vers le bas : `/a-propos` qui a « décroché » du système (seule page sans filigrane ni entrée animée), et `/marques` qui se casse visuellement tant que le catalogue de maisons est petit, c'est-à-dire au lancement, précisément quand un acheteur luxe juge la crédibilité. La plus grosse opportunité : refermer les trous de cohérence pour que chaque page annexe tienne le même standard que la home.

## What's Working

1. **Le bandeau de faits de la fiche maison** (`Pays / Maison / Drops / Exemplaires`) : gabarit uniforme calculé depuis les données, filets fins, valeurs en serif italic. Élégant, scalable, honnête.
2. **La grammaire éditoriale tient** : eyebrow + Fraunces clamp + lead en ink-2, répétée fidèlement. /marques et /marques/[slug] sont quasi parfaites (filigrane, reveal, focus-visible, micro-interaction « Découvrir → »).
3. **`/bientot` est sobre et juste** : un mot, beaucoup de blanc, contact. Le bon registre pour un coming-soon de maison.

## Priority Issues

- **[P1] `/a-propos` a décroché du système.** C'est la seule page sans filigrane et sans entrée animée, alors que tu as posé « un filigrane sur chaque écran » en doctrine. Résultat : la page qui doit incarner la maison est la plus nue.
  - *Pourquoi* : rupture de cohérence sur la page la plus « marque » ; sape la promesse premium.
  - *Fix* : wrapper le header en `relative overflow-hidden`, poser `<Filigrane>`, passer eyebrow/h1/prose en `reveal` cascade.
  - *Commande* : `{{command_prefix}}impeccable animate` (puis polish).

- **[P1] État clairsemé de `/marques`.** Avec 1–2 maisons, la grille 3 colonnes laisse un bloc gris vide (le fond `rule-soft`). Au lancement tu auras peu de maisons : la page paraît cassée/inachevée.
  - *Pourquoi* : première impression de crédibilité pour acheteurs ET marques partenaires, ruinée par un vide gris.
  - *Fix* : `grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` ou bascule en liste éditoriale quand `brands.length < 3` ; ne jamais laisser le fond de gouttière transparaître en bloc plein.
  - *Commande* : `{{command_prefix}}impeccable onboard` (états clairsemés) ou `adapt`/`layout`.

- **[P1] Em dash dans la copy (ban brand).** `marques/[slug]/page.tsx` ligne 116 : « en direct de la maison — sans intermédiaire ». Interdit par CLAUDE.md et le DESIGN.md (No-Em-Dash Rule).
  - *Pourquoi* : viole le style guide de marque, et c'est un tell visible.
  - *Fix* : remplacer par une virgule ou un point. Scanner les emails/templates pour les mêmes.
  - *Commande* : `{{command_prefix}}impeccable clarify`.

- **[P2] Wordmark incohérent.** `/bientot` affiche « Drop Nº » (ordinal º) ; partout ailleurs c'est « Drop No. » (sup « No. »). Le mot-marque ne peut pas avoir deux formes.
  - *Fix* : choisir une forme canonique (reco : « № » U+2116 ou « No. » constant) et l'appliquer partout, idéalement via un composant Wordmark partagé.
  - *Commande* : `{{command_prefix}}impeccable clarify` / `polish`.

- **[P2] Trous a11y + champagne sur-utilisé.** `/a-propos` : les liens (email, « Voir le calendrier ») n'ont pas de `focus-visible`. `/bientot` : champagne employé 3 fois (barre haute + sup + lien), au-delà de la Gold-Leaf Rule (≤10%, un seul point).
  - *Fix* : ajouter les rings focus-visible ; sur /bientot, garder un seul accent champagne (la barre OU le sup).
  - *Commande* : `{{command_prefix}}impeccable audit` / `polish`.

## Persona Red Flags

**Le Collectionneur (premier achat haute valeur)** : arrive sur `/marques` pour jauger la légitimité, voit une seule maison et un grand vide gris. Pour une pièce à 3 000 €+, « inachevé » = « pas sûr ». Sur `/a-propos`, l'absence d'animation/filigrane qui existent ailleurs se ressent comme un cran de finition en moins, juste là où il cherche de la réassurance.

**La Maison partenaire (marque qui évalue de lister)** : scrute la fiche maison (très bonne, le fait « Vérifiée » rassure) mais voit la grille `/marques` se déliter à faible volume : « est-ce que d'autres maisons sérieuses sont là ? ». Le vide gris répond « non » à sa place.

**Utilisateur clavier / lecteur d'écran** : filigrane correctement `aria-hidden` (bon). Mais sur `/a-propos`, les liens n'ont pas d'anneau de focus : navigation au clavier sans repère visible. Ailleurs (marques, fiche) le focus-visible est présent, donc l'incohérence est d'autant plus nette.

## Minor Observations

- `/a-propos` : espace avant `:` (« même prix : celui ») en espace normale, pas l'espace fine insécable utilisée sur la home. Incohérence typographique FR.
- Fiche maison : le fait « Drops » (3) ne correspond pas au nombre de drops listés (2) selon les statuts exposés par `drops_public`. Vérifier la cohérence compteur/liste.
- `/bientot` : contenu légèrement haut plutôt que centré vertical ; la barre champagne absolue fausse le centrage perçu.
- `/marques` : gouttière mobile `md:px-8` sur /a-propos vs `md:px-16` ailleurs (colonne de lecture plus étroite, sans doute intentionnel, mais à confirmer).

## Questions to Consider

- Et si `/a-propos` était la page la plus soignée du site (elle porte la marque), au lieu de la plus nue ?
- Au lancement avec 2-3 maisons, `/marques` doit-elle vraiment être une grille ? Une liste éditoriale numérotée (comme les drops) ne tiendrait-elle pas mieux à faible volume ET à fort volume ?
- Le mot-marque mérite un composant unique partagé : combien de variantes traînent encore (emails, favicon, og-image) ?

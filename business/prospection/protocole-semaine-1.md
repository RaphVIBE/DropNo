# Protocole semaine 1 — Lot belge

Première vague d'outreach Drop No. : **Ressence**, **Col&MacArthur**, **Raidillon**. Trois maisons belges, volontairement petites en nombre. L'objectif n'est pas de signer, c'est d'**apprendre** : calibrer le message et le process avant d'élargir aux Tier A étrangères (Furlan Marri, Atelier Wen, Trilobe, Kudoke, Holthinrichs, Sartory Billard, Fears).

Rien n'est envoyé sans validation owner. Ce fichier fige la grille de lecture pour que les résultats à n=3 restent interprétables.

## Métrique amont (signal sans réponse)

Le signal nº1 n'est pas la réponse, c'est le **clic sur le lien démo par-maison**. Chaque email pointe vers une page `/demo/<slug>?key=<clé individuelle>`, donc un clic est attribuable à une seule maison.

- Ressence : `/demo/ressence`
- Col&MacArthur : `/demo/col-macarthur`
- Raidillon : `/demo/raidillon-55`

Un clic sans réponse = intérêt réel à requalifier en relance. Tracer ces clics (logs d'accès démo / PostHog sur la page démo) avant de juger un silence.

## Le P.S. « non motivé »

Les trois emails se terminent par un post-scriptum qui invite explicitement à répondre **non en une ligne**. But : convertir les silences (ininterprétables) en signal exploitable (refus motivé). C'est le levier d'apprentissage nº1 du lot. Le ton reste celui d'une maison sûre de sa valeur, pas d'un vendeur qui mendie une réponse.

## Relance — J+5-6 (pas J+8)

- **Timing** : relance à **J+5-6**, pas J+8. Plus serré pour rester dans le fil mental du destinataire.
- **Forme** : deux phrases, sobres.
- **Accroche** : citer une **sortie ou actualité récente** de la maison (Col : Battlefront, météorite ; Raidillon : Speed, collab ; Ressence : variante Type / actu Anvers).
- **Canal alternatif** : **LinkedIn** pour **Ressence** et **Col&MacArthur** tant que l'email n'est pas nominatif (adresses non confirmées). Raidillon a une adresse (`hello@raidillon.com`), email d'abord.

## Grille de lecture (à n=3, distinguer trois états)

Sans cette distinction, trois résultats ne veulent rien dire. Classer chaque maison dans **un seul** état :

1. **Pas atteint** — email rebondi, mauvais contact, jamais ouvert. Problème de **ciblage/délivrabilité**, pas de message. N'invalide rien du pitch.
2. **Atteint, pas convaincu** — ouvert et/ou démo cliquée, aucune réponse malgré le P.S. Problème de **message ou de fit**. C'est le signal le plus riche à itérer.
3. **Refus motivé** — le P.S. a marché, la maison dit pourquoi non. Signal le plus précieux : raison explicite à intégrer dans la prochaine vague.

Un oui / rendez-vous est un quatrième état, mais l'enjeu d'apprentissage est de bien séparer 1, 2 et 3.

## Objectif du lot

Petit, belge, à faible enjeu réputationnel : calibrer message + process. Une fois la grille remplie sur ces trois maisons, ajuster l'accroche et le P.S., puis ouvrir la vague Tier A étrangères.

## Trous restant à l'owner (avant envoi)

- **Adresse Ressence** : non confirmée (Benoît Mintiens). Placeholder dans le brouillon.
- **Adresse Col&MacArthur** : non confirmée (Sébastien Colen). Placeholder dans le brouillon.
- **DEMO_KEYS** : confirmer que les clés par-slug (`ressence`, `col-macarthur`, `raidillon-55`) sont bien posées et que les liens démo répondent.

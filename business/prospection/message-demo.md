# Message court · partage du lien démo

Message à envoyer (email de relance ou DM) une fois la maison intéressée, pour
lui montrer sa propre simulation. Données fictives, son nom sur l'écran. Ce
fichier sert aux relances et DM, PAS au premier contact (le premier contact se
fait avec les emails `email_<slug>.md`, lien démo en bouton champagne).

⚠️ Chaque maison a SA propre clé (`DEMO_KEYS` posée dans Netlify, objet JSON
par slug). Une maison qui forwarderait son lien ne peut pas deviner la
simulation d'une autre en changeant le slug. Le lien reste actif, un clic
recale l'accès pour 4h. URLs réelles : `dropno.eu/demo/<slug>?key=<clé propre>`.

---

## Furlan Marri

Bonjour Hamad, Andrea,

Je vous ai préparé une simulation à votre nom, en ligne, pour voir le mécanisme tourner sur une de vos pièces plutôt que de vous l'expliquer.

→ https://dropno.eu/demo/furlan-marri?key=ebb9fae3ae39a4b2adbb435baa016569

Offre cachée pendant cinq jours, les huit plus hautes l'emportent, toutes au même prix : la huitième. La révélation est calée sur jeudi 18h. Tout est fictif, c'est juste pour sentir le rituel.

Quinze minutes en visio cette semaine pour en parler ?

Bien à vous,
Raphaël

---

## Ressence

Bonjour Benoît,

Plutôt que de décrire, je vous montre. Voici une simulation privée à votre nom, sur une pièce confidentielle.

→ https://dropno.eu/demo/ressence?key=e2ccdb4bcb12378588cd513429fddc92

Le principe : offres scellées sur cinq jours, prix unique pour tous les gagnants, révélation jeudi 18h. Données fictives, aucun engagement. L'idée est juste de vous laisser ressentir l'objet.

Disponible quinze minutes cette semaine ?

Bien à vous,
Raphaël

---

## Raidillon

Bonjour Fabien,

Une simulation privée à votre nom, en ligne, sur une édition circuit. Plus parlant qu'un long discours.

→ https://dropno.eu/demo/raidillon-55?key=327844c1f831e8e9a8396719d0f44c38

Offres cachées sur cinq jours, prix unique pour les gagnants, révélation jeudi 18h. Vos 55 exemplaires sont déjà un format de drop : il ne manque que le prix. Tout est fictif, c'est pour sentir le mécanisme.

Quinze minutes en visio cette semaine ?

Bien à vous,
Raphaël

---

## Col&MacArthur

Bonjour Sébastien,

Plutôt que de l'expliquer, je vous le montre : une simulation privée à votre nom, en ligne, avec en vedette le Francorchamps 1921.

→ https://dropno.eu/demo/col-macarthur?key=b721c0088717c72649d9d5db91d101e5

Offres cachées sur cinq jours, les plus hautes l'emportent, toutes au même prix : la dernière gagnante. Révélation jeudi 18h. C'est une édition haute fictive, juste pour voir ce qu'un sealed bid donnerait sur une pièce aussi désirable qu'un morceau du circuit de Spa.

Un café à Liège ou quinze minutes en visio ?

Bien à vous,
Raphaël

---

## Trilobe — démo prête, CLÉ À GÉNÉRER

⚠️ Le contenu de simulation Trilobe existe (`lib/demo-maisons.ts`, slug
`trilobe`), mais AUCUNE clé par slug n'est encore posée dans `DEMO_KEYS` pour
`trilobe`. Ne pas envoyer ce message tant que la clé n'est pas générée et
posée dans Netlify. L'ancien lien `netlify` à clé globale unique est mort.

URL une fois la clé posée : `https://dropno.eu/demo/trilobe?key=<clé à générer>`

Bonjour Gautier,

Une simulation privée à votre nom, en ligne, pour voir notre mécanisme sur une pièce Trilobe plutôt que de vous l'expliquer à plat.

→ [lien à générer : https://dropno.eu/demo/trilobe?key=<clé>]

Offres cachées sur cinq jours, prix unique pour les gagnants, révélation jeudi 18h. Tout est fictif. Juste le rituel, et la donnée que ça vous donnerait sur vos collectionneurs.

Quinze minutes en visio cette semaine ?

Bien à vous,
Raphaël

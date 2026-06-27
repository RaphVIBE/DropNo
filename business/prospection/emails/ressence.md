# Email — Ressence

**À :** Benoît Mintiens (fondateur) — **canal retenu : LinkedIn** (connexion + note courte), puis bascule email `hello@ressence.be` en relance. Voir « Canal de contact » ci-dessous.
**De :** Raphaël Hombroeck — raph@dropno.eu
**Objet :** Un test de prix grandeur réelle, sur une pièce confidentielle

> Brouillon Gmail HTML en place (lien démo = bouton champagne, pas d'URL brute). Ce fichier = copie texte de référence.

---

Bonjour Benoît,

D'un Belge à un autre : j'admire la discipline avec laquelle vous tenez Ressence depuis Anvers, le ROCS, les disques affleurants, ce silence visuel que presque personne d'autre ne sait garder. C'est précisément le genre de maison à qui je voulais montrer ce projet.

Je viens de lancer Drop No., une plateforme de drops scellés pour l'horlogerie brand-direct. Le mécanisme tient en une ligne : quelques exemplaires d'une pièce, cinq jours d'offres cachées, révélation jeudi 18h. Les offres les plus hautes l'emportent et toutes payent le même prix, celui de la dernière gagnante. Pas de surenchère publique, pas de course, pas de grey market dans la foulée.

Ce que vous en retirez n'est pas qu'une vente : c'est une donnée qu'aucune étude ne donne, ce que vos collectionneurs les plus motivés étaient vraiment prêts à payer, distribution complète, profils acheteurs vérifiés. De quoi pricer une variante (cadran, métal, finition) avant un éventuel run, ou sortir une capsule hors circuit dealer. Vous gardez le plancher, le calendrier, le nombre d'exemplaires.

Trois choses pour la sérénité. Sous votre plancher, le drop est annulé : aucune vente bradée, aucune perte d'image. La pièce ne quitte votre atelier que pour partir chez un acheteur vérifié, en remise main propre assurée : nous ne la stockons jamais. Et notre commission, douze pour cent, ne s'applique qu'aux ventes effectives : drop annulé, zéro frais.

Plutôt que de le décrire, je vous l'ai préparé : une simulation privée à votre nom, sur une pièce confidentielle.

→ https://dropno.eu/demo/ressence?key=e2ccdb4bcb12378588cd513429fddc92

Quinze minutes en visio dans les prochains jours pour en parler ?

Bien à vous,

Raphaël Hombroeck
Fondateur, Drop No.
raph@dropno.eu  ·  +32 475 72 27 63

P.S. Si ce n'est pas pour Ressence, un mot suffit à me le dire. Je préfère de loin un non net à un silence, et je saurai en tenir compte.

---

## Canal de contact (recherche 2026-06-26, sources web réelles)

**Domaine site :** `ressencewatches.com` (Shopify). `ressence.eu` redirige vers `ressencewatches.com`. `ressence.com` ne répond pas. À noter : le **domaine email est différent du site** → `ressence.be`.

**Entité légale** (CGV `/policies/terms-of-service`) : **RESSENCE BV**, Meirbrug 1, 2000 Antwerp, Belgique. TVA **BE0828.795.120**. Tél **+32 3 446 00 60**. (Une mention résiduelle « RESSENCE NV » apparaît dans une clause retour, sans doute copie ancienne.)

**Adresses publiques trouvées :**
- `hello@ressence.be` — **seule adresse publique**, citée dans CGV, Privacy et FAQ service comme contact général (commandes, retours, RGPD, « tailor-made solution » si pas de revendeur local). C'est une boîte générique service/commercial, pas nominative. Source : `ressencewatches.com/policies/terms-of-service`, `/policies/privacy-policy`, `/pages/service-frequently-asked-questions`.
- `contact@apd-gba.be` — **non pertinent** : c'est l'Autorité belge de protection des données, citée dans la Privacy Policy.
- Page **Contact** (`/pages/contact-us`) = **formulaire uniquement** (Nom, Email, Tél, Sujet, Message), protégé hCaptcha. Aucune adresse exposée.
- Page **Press** (`/pages/press`) = centre de presse en self-service (téléchargement CP + visuels). **Aucune adresse presse publique.**

**Pattern email :** non déduisible. Aucune adresse nominative publiée nulle part (presse, CP, footer). On ne connaît donc pas le format (`prenom@` vs `prenom.nom@`). **Ne PAS deviner d'adresse nominative pour un premier contact à froid** : `ressence.be` tourne sous passerelle de sécurité (MX `secaas.ch`), SPF en `-all` (hardfail) et **DMARC `p=quarantine` via PowerDMARC**. Un guess qui bounce ou tombe en quarantaine brûle la réputation de `dropno.eu` dès le premier envoi.

**LinkedIn :**
- Page entreprise officielle, live et publique : **`linkedin.com/company/ressence/`** (HTTP 200, lien tiré du footer de leur propre site).
- Benoît Mintiens : profil personnel présent (les `/in/...` renvoient HTTP 999 = anti-bot LinkedIn standard, cohérent avec un profil existant mais non scrapable). URL exacte à confirmer manuellement par Raph une fois connecté.

## Recommandation finale priorisée

1. **LinkedIn d'abord — fondateur-designer qui filtre son email.** Demande de connexion + note courte (voir texte ci-dessous, à valider). C'est le canal qui atterrit directement chez Benoît sans passer le filtre service/passerelle.
2. **`hello@ressence.be` en second / relance** (J+5-6, protocole semaine 1). Boîte générique → l'objet doit forcer la remontée au fondateur : `Pour Benoît Mintiens — test de prix grandeur réelle sur une pièce confidentielle`. Envoi **après** que la délivrabilité L8 soit verte (DKIM Google Workspace + SPF + mail-tester ≥ 8/10), vu leur posture inbound stricte. Cold = **draft Gmail**, jamais d'envoi direct.
3. **Formulaire `/pages/contact-us`** = dernier recours seulement (le message tombe dans la file service, faible probabilité d'atteindre le fondateur).

### Approche LinkedIn en deux temps (validée critique 2026-06-26)

Principe : la note de connexion ne demande RIEN d'autre que la connexion. Le pitch, le lien démo et l'ouverture au « non motivé » vivent dans le premier message post-acceptation, là où le lien est cliquable.

**Étape 1 — Note de connexion** (recommandée, 266 car., sans visio ni lien) :

> Bonjour Benoît. Founder belge, j'admire depuis Anvers la discipline de Ressence. Je construis Drop No. : la vente directe d'une maison à ses clients, par offres cachées et prix unique, pensée pour l'horlogerie rare. J'aimerais beaucoup échanger avec vous.

Variante plus sobre (248 car., founder-to-founder, zéro pitch) :

> Bonjour Benoît. Founder belge, lecteur attentif de ce que fait Ressence depuis Anvers. Je bâtis Drop No., une façon plus discrète pour une maison de vendre ses pièces rares en direct. J'aimerais vous connecter et, si l'envie vous vient, vous montrer.

**Étape 2 — Premier message post-acceptation** (porte le mécanisme en clair, le lien démo et le P.S. « non motivé ») :

> Merci d'avoir accepté, Benoît.
>
> En une ligne : Drop No. permet à une maison d'ouvrir un drop pour quelques exemplaires d'une pièce, avec un prix plancher et cinq jours d'offres cachées. À la révélation, les meilleures offres l'emportent et toutes payent le même prix, celui de la dernière offre retenue. Pas de surenchère publique, pas de guerre des prix.
>
> J'ai préparé une simulation privée au nom de Ressence pour rendre ça concret. Elle vit ici : https://dropno.eu/demo/ressence?key=e2ccdb4bcb12378588cd513429fddc92
>
> Quinze minutes pour la parcourir ensemble la semaine prochaine ?
>
> P.S. Si le format ne vous parle pas, dites-le moi franchement, même en deux lignes. Ce retour m'est plus utile qu'un oui poli.

Note : « drops scellés brand-direct » volontairement banni de la note (jargon non auto-explicite, « drop » évoque le streetwear) ; remplacé par le bénéfice décrit (vente directe, offres cachées, prix unique). Prérequis : la clé démo `ressence` doit être posée et testée avant d'amorcer le contact, sinon le message d'étape 2 tombe à plat.

## Notes d'envoi

- **Lien démo :** page **produit** (`/demo/ressence`), domaine `dropno.eu`, clé propre à Ressence (`e2ccdb4b…`). Brouillon Gmail = **bouton champagne** « Voir la simulation à votre nom ».
- **Drop-ship** dans le corps (la pièce ne transite jamais par Veracruz).
- **Destinataire email :** `hello@ressence.be` (générique, voie de relance), objet remontant au fondateur. Placeholder `raph@dropno.eu` à remplacer dans le brouillon Gmail si on bascule sur l'envoi email.
- **Follow-up :** LinkedIn = ouverture ; email `hello@ressence.be` = relance J+5-6 (lot belge, voir `protocole-semaine-1.md`), deux phrases, en citant une actu récente (ex. TYPE 11 2026, TYPE 9 IKEDA 2026).

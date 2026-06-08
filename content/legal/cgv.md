# Conditions générales de vente

*Dernière mise à jour : [DATE]*

⚠️ Document critique. Compte tenu de la nature novatrice du mécanisme sealed-bid à prix uniforme et du droit de rétractation EU pour les ventes en ligne, ce document **doit impérativement être validé par un juriste e-commerce EU avant publication**.

## 1. Objet

Les présentes conditions générales de vente (ci-après « CGV ») régissent les transactions conclues sur la plateforme dropno.eu (ci-après le « Site »), opérée par Drop No. [SA / SRL] (ci-après « Drop No. »), entre les marques vendeuses partenaires et les utilisateurs acheteurs.

Les CGV s'appliquent à toute offre scellée soumise par un utilisateur acheteur sur un drop publié sur le Site.

## 2. Définitions

- **Marque vendeuse** : maison horlogère partenaire ayant signé un contrat avec Drop No. pour la mise en vente d'une ou plusieurs pièces sur le Site.
- **Drop** : événement de vente d'une pièce horlogère, organisé sur le Site, portant sur N exemplaires identiques pendant une fenêtre de soumission d'offres définie par la Marque vendeuse.
- **Acheteur** : utilisateur inscrit, ayant complété la procédure KYC, ayant soumis une ou plusieurs offres sur un drop.
- **Offre scellée** : montant proposé par l'Acheteur pour acquérir un exemplaire du drop, soumis sous forme cachée. L'offre n'est visible ni des autres Acheteurs, ni de la Marque vendeuse, ni de Drop No. (sauf exécution technique automatisée), jusqu'à la révélation.
- **Prix plancher** : montant minimum sous lequel une offre n'est pas recevable, fixé par la Marque vendeuse lors de la création du drop.
- **Clearing price (prix unitaire de clôture)** : prix unitaire payé par tous les Acheteurs gagnants d'un drop, correspondant à la N-ième offre la plus haute reçue, à condition qu'elle soit égale ou supérieure au prix plancher.
- **Révélation** : moment public où les gagnants et le clearing price sont annoncés, fixé par la Marque vendeuse à la création du drop.
- **Fenêtre de soumission** : période pendant laquelle les offres scellées peuvent être soumises et modifiées, allant de l'ouverture du drop jusqu'à une heure avant la révélation (T-1h).

## 3. Conditions de participation

La participation à un drop est ouverte à toute personne ayant créé un compte sur dropno.eu, complété la procédure KYC (Stripe Identity), et accepté les présentes CGV par cochage d'une case dédiée au moment de la première offre.

L'Acheteur doit disposer d'un moyen de paiement valide (carte bancaire compatible Stripe).

## 4. Soumission, modification et retrait des offres

### 4.1. Soumission

L'Acheteur soumet une offre scellée en indiquant le montant qu'il souhaite proposer. Le montant doit être supérieur ou égal au prix plancher du drop.

La soumission de l'offre déclenche une pré-autorisation Stripe sur le moyen de paiement de l'Acheteur, pour le montant exact de l'offre. Aucun débit n'est effectué à ce stade : il s'agit d'une réservation de fonds, conformément aux standards Stripe.

Chaque Acheteur ne peut soumettre qu'une seule offre par drop.

### 4.2. Modification

L'Acheteur peut modifier le montant de son offre à tout moment jusqu'à une heure avant la révélation (T-1h). La modification remplace l'offre précédente. La pré-autorisation Stripe est ajustée au nouveau montant.

### 4.3. Retrait

L'Acheteur peut retirer son offre jusqu'à vingt-quatre heures avant la révélation (T-24h). Le retrait entraîne la libération de la pré-autorisation Stripe.

Entre T-24h et la révélation, l'offre devient **ferme et irrévocable**. Cette disposition est essentielle au bon fonctionnement du mécanisme d'enchère scellée et à la confiance dans le clearing price.

## 5. Clôture et révélation

À l'heure de révélation fixée, Drop No. clôt automatiquement la fenêtre de soumission et procède à l'attribution des exemplaires :

1. Les offres en cours sont triées par ordre décroissant de montant. En cas d'égalité, l'horodatage de soumission tranche : la première offre reçue prime.
2. Les N offres les plus hautes, égales ou supérieures au prix plancher, sont déclarées gagnantes.
3. Le clearing price est calculé : il correspond au montant de la N-ième offre gagnante.
4. Chaque Acheteur gagnant est tenu d'acquérir un exemplaire au clearing price. La pré-autorisation Stripe est capturée pour ce montant.
5. Les pré-autorisations Stripe des offres non retenues sont libérées dans les meilleurs délais.

Si moins de N offres égales ou supérieures au prix plancher ont été reçues, le drop est **annulé** : aucune vente n'a lieu, aucune transaction n'est effectuée, toutes les pré-autorisations sont libérées sans frais pour les Acheteurs.

## 6. Formation du contrat de vente

La capture de la pré-autorisation Stripe au clearing price forme le contrat de vente entre la Marque vendeuse et l'Acheteur gagnant. Drop No. agit en qualité d'intermédiaire technique pour le compte de la Marque vendeuse.

Une confirmation de commande, comprenant le récapitulatif du drop, le clearing price, et le formulaire-type de rétractation, est adressée par email à l'Acheteur gagnant dans les vingt-quatre heures suivant la révélation.

## 7. Prix et paiement

Le prix payé par l'Acheteur correspond exclusivement au clearing price. Aucun frais additionnel n'est dû par l'Acheteur (les frais de plateforme et de livraison sont assumés par la Marque vendeuse ou inclus dans le prix).

La capture s'effectue automatiquement par Stripe à la révélation. Les fonds sont conservés par Stripe en escrow jusqu'à expiration de la fenêtre de rétractation, puis transférés à la Marque vendeuse, après prélèvement de la commission de Drop No.

## 8. Livraison

### 8.1. Délais

Les pièces sont livrées dans un délai de cinq à dix jours ouvrables à compter de la révélation, sauf indication contraire spécifiée lors du drop.

### 8.2. Modalités

Selon la valeur de la pièce, la livraison est assurée par :
- **DHL Express assuré** pour les pièces entre 3 000 et 10 000 euros : remise contre signature, assurance valeur pleine.
- **Concierge main propre** (Malca-Amit ou équivalent) pour les pièces au-delà de 10 000 euros : remise en mains propres, sur rendez-vous, contre signature et présentation de pièce d'identité.

L'assurance couvre la valeur totale du clearing price.

### 8.3. Transfert de risques

Le transfert de propriété s'opère à la capture du paiement. Le transfert des risques (perte, dégradation) s'opère à la livraison effective à l'Acheteur ou à son mandataire désigné.

## 9. Droit de rétractation

Conformément à la Directive 2011/83/UE et au Code de droit économique belge, l'Acheteur consommateur dispose d'un délai de **quatorze jours (14j)** pour exercer son droit de rétractation, à compter du lendemain de la réception de la pièce.

### 9.1. Modalités d'exercice

L'Acheteur notifie Drop No. de sa décision de rétractation, sans avoir à motiver sa décision, par :
- email à hello@dropno.eu, ou
- envoi du formulaire-type disponible à dropno.eu/retractation.

### 9.2. Remboursement

Drop No. rembourse intégralement le clearing price payé par l'Acheteur, dans un délai maximum de quatorze (14) jours à compter de la réception de la pièce retournée en bon état.

Le remboursement s'effectue par le même moyen de paiement que celui utilisé pour la transaction initiale, sauf accord exprès de l'Acheteur pour un autre moyen.

### 9.3. Frais de retour

Les frais de retour sont à la charge de Drop No. Une étiquette d'expédition assurée est transmise à l'Acheteur dans les vingt-quatre heures suivant sa demande de rétractation.

### 9.4. État de la pièce

La pièce doit être retournée dans son état d'origine, dans son emballage d'origine, avec l'ensemble des accessoires et du certificat d'authenticité. L'Acheteur engage sa responsabilité en cas de dépréciation résultant d'une manipulation autre que celle nécessaire pour établir la nature, les caractéristiques et le bon fonctionnement du produit.

## 10. Garanties

### 10.1. Garantie légale de conformité

Conformément aux articles 1649bis et suivants du Code civil belge, l'Acheteur bénéficie d'une garantie légale de conformité d'une durée de deux (2) ans à compter de la livraison, contre les défauts de conformité existants au moment de la délivrance.

### 10.2. Garantie commerciale de la Marque vendeuse

L'Acheteur bénéficie en outre de la garantie commerciale fournie par la Marque vendeuse (généralement deux à cinq ans selon la marque), dont les conditions sont précisées dans le certificat d'authenticité accompagnant la pièce.

## 11. Annulation d'un drop

En cas d'annulation d'un drop (moins de N offres recevables, défaillance de la Marque vendeuse, force majeure), aucun engagement n'est pris envers les Acheteurs ayant soumis des offres. Les pré-autorisations sont libérées sans délai.

Drop No. communique aux Acheteurs concernés la raison de l'annulation par email, et propose, le cas échéant, l'inscription prioritaire à un drop ultérieur de la même Marque.

## 12. Médiation et règlement des litiges

En cas de litige, l'Acheteur est invité à contacter Drop No. par email à hello@dropno.eu pour rechercher une solution amiable.

À défaut de résolution amiable, l'Acheteur consommateur peut saisir :
- la plateforme européenne de règlement en ligne des litiges : [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr)
- le Service de Médiation pour le Consommateur belge : [mediationconsommateur.be](https://mediationconsommateur.be)

## 13. Droit applicable et juridiction

Les présentes CGV sont soumises au droit belge. Tout litige sera de la compétence exclusive des tribunaux de l'arrondissement judiciaire de Bruxelles.

Les consommateurs résidant dans un autre État membre de l'Union européenne conservent le bénéfice des dispositions impératives plus favorables de leur droit national, notamment en matière de protection du consommateur.

# Dossier Apple Notes « DropNo » — contenu prêt à coller

Chaque section ci-dessous = une note. La 1re ligne devient le titre de la note.

═══════════════════════════════════════════════════════════════
## NOTE 1 — DropNo · Liens essentiels
═══════════════════════════════════════════════════════════════

DropNo · Liens essentiels

SITE
Live : https://dropno.netlify.app
Back-office admin : https://dropno.netlify.app/admin
Espace maisons : https://dropno.netlify.app/maison

DÉMOS PROSPECTS (clé incluse)
Furlan Marri : https://dropno.netlify.app/demo/furlan-marri?key=34304ef966ccbb5785604f69bcbffd8d
Ressence : https://dropno.netlify.app/demo/ressence?key=34304ef966ccbb5785604f69bcbffd8d
Trilobe : https://dropno.netlify.app/demo/trilobe?key=34304ef966ccbb5785604f69bcbffd8d

INFRA
GitHub : https://github.com/RaphVIBE/DropNo
Netlify (site dropno) : https://app.netlify.com/sites/dropno
Supabase (projet drop-no) : https://supabase.com/dashboard/project/ygzyzvjxregoqbzmcmyq
Supabase URL : https://ygzyzvjxregoqbzmcmyq.supabase.co
Stripe : https://dashboard.stripe.com
Resend (emails) : https://resend.com
PostHog (analytics) : https://eu.posthog.com
Crisp (support) : https://app.crisp.chat

SOCIAL (@dropno.official)
Instagram : https://instagram.com/dropno.official
X : https://x.com/dropno_official
YouTube : https://youtube.com/@dropno.official
TikTok : https://tiktok.com/@dropno.official
LinkedIn : https://linkedin.com/company/dropno-official

CONTACT
Pro : raph@dropno.eu
Social : social@dropno.eu

═══════════════════════════════════════════════════════════════
## NOTE 2 — DropNo · Fiche projet
═══════════════════════════════════════════════════════════════

DropNo · Fiche projet

PITCH
Maison de drops scellés multi-gagnants pour montres premium, brand-direct (B2C). Une marque ouvre un drop hebdo : N exemplaires, prix plancher, 5 jours d'offres cachées. À la révélation, les N plus hautes offres au-dessus du plancher gagnent et toutes payent le même prix : la N-ième offre (uniform price clearing). Pas de surenchère publique, pas de bots.

RITUEL
1 drop/semaine. Révélation le jeudi 18h (Europe/Brussels).

MÉCANISME (verrouillé)
Sealed-bid, uniform price, clearing à la N-ième offre (pas Vickrey N+1).

ÉCONOMIE
Frais vendeur 12% + 5€ fixes. Acheteur 0%. Prix plancher MVP 3 000€. TVA 20% (à valider expert-comptable).

CONFIANCE
KYC acheteur via Stripe Identity au 1er bid. Pré-autorisation Stripe (capture au reveal). Rétractation 14j, remboursement intégral.

LOGISTIQUE
DHL Express assuré (3-10k€) / Malca-Amit concierge main propre (au-delà de 10k€).

CATÉGORIE MVP
Montres uniquement (bijoux/art = v2).

STACK
Next.js 14 (App Router) + Tailwind + shadcn · Supabase (Postgres, Auth, RLS, Edge Functions) · Stripe · Netlify · PostHog · Crisp · Resend.

NAMING
Drop No. — drops numérotés (Drop № 001, 002…).

PRIVILÈGE № 001
Offre privée post-reveal au plus haut bidder pour réserver le n° de série 001. Supplément = 50% du spread (bid − clearing), plancher 5% du clearing. Validité 24h.

═══════════════════════════════════════════════════════════════
## NOTE 3 — DropNo · To-do (à garder à jour)
═══════════════════════════════════════════════════════════════

DropNo · To-do (à garder à jour)

— CRITIQUE / BLOQUANT —
[ ] STRIPE_SECRET_KEY absente sur l'edge function Supabase : toute capture / release / remboursement échoue. À reposer AVANT tout drop réel.
[ ] Démo : « Clear cache and deploy site » sur Netlify (l'URL furlan-marri nue sert encore une vieille page en cache).

— DEV —
[ ] Poser les clés PostHog en prod (NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY).
[ ] Politique bids retirés entre T-24h et T-1h : interdire ou pénaliser ?
[ ] Reconsidérer la variante Vickrey post-launch si bidding non-sincère.

— DESIGN —
[ ] Valider la teinte champagne exacte en maquettes finales.
[ ] Light theme only au MVP, mobile-first (80% trafic mobile attendu).

— ADMIN / OPÉRATIONS —
[ ] Valider le régime TVA des fees marque avec l'expert-comptable.
[ ] Activer le 2FA sur les 5 comptes sociaux.
[ ] Supprimer le doublon YouTube brand account @dropnoofficial (vide).
[ ] Extension Privilège rangs 2-5 (choix n° 002-005) = v2, à réévaluer.

— GO-TO-MARKET —
[ ] Envoyer les emails d'approche : Furlan Marri, Ressence (+ Trilobe à rédiger).
[ ] Envoyer le lien démo perso à chaque prospect intéressé (voir notes prospects).

═══════════════════════════════════════════════════════════════
## NOTE 4 — Prospect · Furlan Marri
═══════════════════════════════════════════════════════════════

Prospect · Furlan Marri

STATUT : à contacter
MAISON : Furlan Marri (Genève, CH) — chronographes vintage, séries ultra courtes.
CONTACTS : Hamad Al Marri & Andrea Furlan (fondateurs).
CANAL : info@furlanmarri.com + DM Instagram des fondateurs (souvent plus réactifs).
INTRO ALT : William Massena (Massena LAB) si pas de réponse.
LIEN DÉMO : https://dropno.netlify.app/demo/furlan-marri?key=34304ef966ccbb5785604f69bcbffd8d
DROP DÉMO : No.101 « Mr Grey · Sector Édition », plancher 3 500€, 8 exemplaires.
EMAIL PRÊT : outreach/email_furlan_marri.md
TON : direct, digital-first, anglais courant. Angle « course au F5 ».
FOLLOW-UP : une relance, 8j après, mentionner un détail récent (nouvelle ref / post IG).

═══════════════════════════════════════════════════════════════
## NOTE 5 — Prospect · Ressence
═══════════════════════════════════════════════════════════════

Prospect · Ressence

STATUT : à contacter
MAISON : Ressence (Anvers, BE) — système ROCS, cadrans-disques, huile sous la glace.
CONTACT : Maxime Cousin (fondateur) — à vérifier.
CANAL : email pro (Antwerp HQ) ou LinkedIn InMail. Éviter contact@ressence.com (risque filtre).
TIMING : mardi/mercredi matin 9-10h CET.
LIEN DÉMO : https://dropno.netlify.app/demo/ressence?key=34304ef966ccbb5785604f69bcbffd8d
DROP DÉMO : No.102 « Type 1° Slim Anthracite », plancher 12 000€, 5 exemplaires.
EMAIL PRÊT : outreach/email_ressence.md
ANGLE : drop comme test de prix sur une variante, ou capsule anniversaire hors circuit dealer. « Un Belge à un autre. »
FOLLOW-UP : une relance, 8j après, 2 phrases max.

═══════════════════════════════════════════════════════════════
## NOTE 6 — Prospect · Trilobe
═══════════════════════════════════════════════════════════════

Prospect · Trilobe

STATUT : à contacter (email à rédiger)
MAISON : Trilobe (Paris, FR) — lecture de l'heure sans aiguilles, disques tournants, production confidentielle.
CONTACT : à compléter (fondateur Gautier Massonneau, à confirmer).
CANAL : à déterminer (email pro / LinkedIn).
LIEN DÉMO : https://dropno.netlify.app/demo/trilobe?key=34304ef966ccbb5785604f69bcbffd8d
DROP DÉMO : No.103 « Les Matinaux · Nuit Fathom », plancher 4 800€, 6 exemplaires.
EMAIL PRÊT : à rédiger (s'inspirer des deux autres).
ANGLE : esprit collectionneur, autre grammaire du temps, capsule hors circuit.

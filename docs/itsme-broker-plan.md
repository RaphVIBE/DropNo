# itsme (login + KYC) via broker — plan d'intégration

> Direction validée : **broker OIDC** (Signicat recommandé), pas d'intégration
> directe. Raison : itsme chiffre ses tokens (JWE imbriqué) et exige un request
> object signé+chiffré, que `signInWithIdToken` et le Custom OIDC natif de
> Supabase ne savent pas consommer. Le broker termine ces particularités et
> expose un OIDC standard.

## Topologie

```
itsme  →  Signicat (connecteur itsme, termine le JWE)  →  Supabase Custom OIDC  →  session
```

Aucune crypto custom côté app : Supabase consomme l'issuer OIDC propre du broker.

## Ce qui est déjà posé (branche `feat/itsme-scaffolding`, NON déployé)

- **Migration `0028`** : colonnes `profiles.kyc_provider` (`'stripe' | 'itsme'`) et
  `profiles.identity_attributes` (jsonb, claims itsme pour l'audit AML). Verrouillées
  service-role par héritage du grant 0027.
- **`lib/kyc/verify.ts`** → `markIdentityVerified(userId, provider, attributes?)` :
  écrit `kyc_status='verified'` + `kyc_verified_at` + `kyc_provider` (+ attributs)
  via le service role. Point d'entrée unique de la substitution KYC.
- **Webhook Stripe** : tag `kyc_provider='stripe'` à la vérification.
- **Types** : `kyc_provider` / `identity_attributes` ajoutés à `lib/supabase/types.ts`.

## Ce qui reste à câbler (à réception des credentials Signicat)

1. **Config Supabase Custom OIDC provider** pointant sur l'issuer Signicat
   (Dashboard → Auth → Third-party / Custom OIDC) : issuer URL, client_id, secret.
2. **Bouton « Continuer avec itsme »** sur `/login` et **« Vérifier avec itsme »**
   sur `/account/verification`, derrière un flag `NEXT_PUBLIC_ITSME_ENABLED`
   (off tant que non provisionné).
3. **Hook post-auth** (dans `app/auth/callback` ou un callback dédié) : lire les
   claims vérifiés exposés par Supabase, mapper → appeler
   `markIdentityVerified(user.id, 'itsme', attributes)`. **Service role only.**
4. **Mapping des claims** (à confirmer avec Signicat — noms exacts variables) :
   `name`/`given_name`/`family_name`, `birthdate`, `place_of_birth`, `address`,
   `BENationalNumber` (RRN/BIS), données eID (`IDDocumentSN`, validité),
   `verificationDate`. Stocker l'ensemble dans `identity_attributes`.
5. **Fallback** : garder Stripe Identity pour les acheteurs hors BeNeLux (adoption
   itsme faible ailleurs). La garde de bid (`kyc_status='verified'`) ne change pas.

## À obtenir côté owner (chemin critique)

- **Compte Signicat** + activation de la **méthode itsme** (Signicat porte le
  contrat itsme → onboarding plus rapide). Récupérer : **issuer OIDC, client_id,
  secret, noms des claims**.
- **Sign-off conformité** : les attributs itsme (eIDAS LoA High) satisfont votre
  obligation AML en lieu et place de Stripe Identity, pour le régime luxe.
- **Devis** Signicat + itsme (itsme facture **par utilisateur actif/an**, sur
  devis) vs Stripe Identity (par vérification) — modéliser pour une audience
  rare et à forte valeur.

## Notes

- itsme est **Belgique-first** (~80 % des adultes), + NL/LU ; techniquement tout
  l'UE depuis 2025 mais adoption faible hors BeNeLux → fallback obligatoire.
- Alternative broker : **Auth0** (connecteur itsme aussi, DX excellente, mais
  auth généraliste, moins orienté KYC que Signicat).

---

## Checklists owner

### A. Re-poster les templates d'auth (débloque l'UX code OTP)

Tant que ce n'est pas fait, l'email de connexion affiche le lien magique mais
PAS le code à six chiffres → l'écran « entrez le code » n'a rien à saisir
(le lien reste un repli fonctionnel).

```bash
cd ~/Documents/Claude/Projects/FlashSales
git checkout main && git pull                     # checkout à jour (templates mergés)

# PAT Supabase : https://supabase.com/dashboard/account/tokens (commence par sbp_)
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx
python3 supabase/auth-emails/install.py --dry-run  # vérifie, n'envoie rien
python3 supabase/auth-emails/install.py            # pose les 5 templates
# Révoquer le PAT ensuite (scope large).
```

Test : dropno.eu/login → entrer son email → l'email doit afficher le code à six
chiffres. Alternative sans PAT : Dashboard → Auth → Emails → Templates, coller
`magic-link.html` + `confirm-signup.html` (les 2 qui portent `{{ .Token }}`).

### B. Lancer l'onboarding Signicat (chemin critique itsme)

itsme via Signicat = **assisté par un commercial** (méthode régulée), pas self-serve.

1. signicat.com → **Contact sales / Book a demo**.
2. Demander : méthode **itsme** en **OIDC**, pour **login + identification (KYC)**,
   marketplace luxe B2C belge avec obligations AML. Demander que **Signicat porte
   le contrat itsme**.
3. Avoir sous la main : **n° BCE/KBO** (ils KYC l'entreprise), use case, volume
   attendu, et l'URL de callback OIDC :
   `https://ygzyzvjxregoqbzmcmyq.supabase.co/auth/v1/callback`
4. Récupérer pour le câblage : **issuer OIDC, client_id, client_secret, noms des
   claims** mappés depuis itsme.
5. Réf dev : developer.signicat.com → identity methods → itsme → OIDC.
6. Demander un **devis** (frais plateforme Signicat + itsme par utilisateur actif/an)
   pour comparer à Stripe Identity.

→ Dès réception des 4 valeurs OIDC du point 4 : câblage itsme bout-en-bout (≈ 1 j).

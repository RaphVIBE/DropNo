# Emails d'authentification (liens protégés) — Drop No.

Templates HTML brandés pour remplacer les emails d'auth Supabase par défaut
(le « moche noir »). Même identité que les emails transactionnels
(`lib/email/templates.ts`) : filet champagne, wordmark `Drop №`, Fraunces + Inter
avec fallback Georgia/système, bouton ink.

## Fichiers

| Fichier | Template Supabase correspondant | Variable de lien |
|---|---|---|
| `magic-link.html` | **Magic Link** (connexion sans mot de passe) | `{{ .ConfirmationURL }}` |
| `confirm-signup.html` | **Confirm signup** (1re inscription) | `{{ .ConfirmationURL }}` |
| `recovery.html` | **Reset Password** | `{{ .ConfirmationURL }}` |
| `email-change.html` | **Change Email Address** | `{{ .ConfirmationURL }}`, `{{ .NewEmail }}` |
| `invite.html` | **Invite user** | `{{ .ConfirmationURL }}` |

> Le flux actuel de l'app utilise le **Magic Link** (cf. `app/login/page.tsx`,
> `signInWithOtp` + `emailRedirectTo`). C'est le template prioritaire à poser.

## Installation (script — recommandé)

Pose les 5 templates + sujets en une commande via la Management API :

```bash
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx   # PAT, jamais committé
                                                # https://supabase.com/dashboard/account/tokens
python3 supabase/auth-emails/install.py --dry-run   # vérifie sans rien envoyer
python3 supabase/auth-emails/install.py             # pose
```

Le ref projet par défaut est celui de Drop No. (`ygzyzvjxregoqbzmcmyq`),
surchargeable via `PROJECT_REF`. Le script échoue proprement (et n'envoie rien)
si un fichier manque ou si le token est absent.

## Brancher Resend en SMTP (recommandé en prod)

Par défaut les emails d'auth partent via le SMTP intégré Supabase, rate-limité
(~30/h) et sans SLA. Pour la prod, on bascule sur Resend (même domaine que le
transactionnel). Script clé en main :

```bash
export SUPABASE_ACCESS_TOKEN=sbp_xxxx     # PAT Supabase
export RESEND_API_KEY=re_xxxx             # = mot de passe SMTP (sinon lu dans .env.local)
python3 supabase/auth-emails/install-smtp.py --dry-run   # vérifie
python3 supabase/auth-emails/install-smtp.py             # branche
```

Réglages posés : `smtp.resend.com:465`, user `resend`, expéditeur
`RESEND_FROM_EMAIL` (défaut `hello@dropno.eu`, **doit être un domaine vérifié
chez Resend**). Après coup, relève le rate-limit dans Dashboard -> Auth ->
Rate Limits. Pense aussi à DKIM/SPF/DMARC sur le domaine d'envoi.

## Installation (Dashboard)

1. Supabase → projet `drop-no` → **Authentication → Emails → Templates**.
2. Sélectionner chaque template, coller le contenu HTML du fichier correspondant.
3. Adapter l'objet (Subject) en FR, par ex. :
   - Magic Link : `Votre lien de connexion · Drop No.`
   - Confirm signup : `Confirmez votre email · Drop No.`
   - Reset Password : `Réinitialisez votre mot de passe · Drop No.`
   - Change Email : `Confirmez votre nouvelle adresse · Drop No.`
   - Invite : `Vous êtes convié · Drop No.`
4. Sauvegarder, puis tester via **Send test email**.

## Installation (config-as-code, optionnel)

Dans `supabase/config.toml`, on peut référencer ces fichiers pour le stack local :

```toml
[auth.email.template.magic_link]
subject = "Votre lien de connexion · Drop No."
content_path = "./auth-emails/magic-link.html"

[auth.email.template.recovery]
subject = "Réinitialisez votre mot de passe · Drop No."
content_path = "./auth-emails/recovery.html"
# … idem confirmation / email_change / invite
```

## Notes

- **Variables Go** : ne pas échapper les `{{ .ConfirmationURL }}` — Supabase les
  remplace au rendu. `{{ .NewEmail }}` n'est disponible que pour Change Email.
- **Polices web** : Apple Mail / iOS chargent Fraunces + Inter ; Gmail/Outlook
  retombent sur Georgia/système — c'est voulu et testé visuellement.
- **Couleurs** : hex email-safe dérivés des design tokens oklch
  (bg `#f6f3ec`, ink `#221d17`, champagne `#c4ac82`).
- Le lien texte brut sous le bouton est conservé pour les clients qui bloquent
  les boutons et pour l'accessibilité.

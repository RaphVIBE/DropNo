# Page Contact — brief d'implémentation pour Claude Code

*Dernière mise à jour : 13 juin 2026*

Route : `/contact`
Référence visuelle : `docs/design/mockups/dropno-contact.html` (ouvrir dans le navigateur, c'est le contrat de design)
Stack : Next.js 14 App Router + Server Action + Resend + Zod

## Structure de la page

Cinq sections, dans l'ordre :

1. **Nav** : wordmark Drop № à gauche, lien « ← Retour » à droite (vers home).
2. **Hero** : eyebrow + titre `Écrivez-nous.` (Fraunces italic, ~140px desktop) + lede.
3. **Channels** : grille 3 colonnes (1 sur mobile). Trois adresses différentes selon le profil. Voir copy ci-dessous.
4. **Form** : sur fond `bg-elev`. Form complet avec validation + honeypot.
5. **SLA** : phrase de garantie + horaires.
6. **Footer** : minimal, Veracruz SRL + BCE + email.

## Copy (à reprendre tel quel)

### Hero

- Eyebrow : `CONTACT`
- Titre : `Écrivez-nous.`
- Lede : `Drop No. est une petite équipe. Vous recevrez toujours une réponse d'une personne réelle, jamais d'un service. Voici les bonnes adresses, selon la raison de votre message.`

### Channels

| Eyebrow | Titre | Body | Email |
|---|---|---|---|
| `VOUS ÊTES UNE MARQUE` | `Proposer un drop` | Pour discuter d'un drop de votre nouvelle référence, d'une édition limitée, ou d'une collaboration. | `raph@dropno.eu` |
| `VOUS ÊTES COLLECTIONNEUR` | `Question, compte, commande` | Pour toute question sur le fonctionnement, votre vérification d'identité, votre offre ou une livraison. | `hello@dropno.eu` |
| `VOUS ÊTES JOURNALISTE` | `Presse et interview` | Pour une interview, un dossier de presse, une demande d'invitation à un drop. Réponse sous 24h ouvrées. | `hello@dropno.eu` |

### Form

- Eyebrow : `OU SIMPLEMENT`
- Titre : `Laissez un message.`
- Intro : `Une réponse dans les quarante-huit heures ouvrées, depuis Bruxelles. Pas de bot, pas de réponse automatique.`

### SLA

- Titre : `Bruxelles. Un humain. Quarante-huit heures.`
- Meta : `Lundi au vendredi, 9h à 18h CET. Hors jours fériés belges.`

## Schéma du formulaire (Zod)

```ts
import { z } from "zod";

export const ContactSchema = z.object({
  reason: z.enum(["brand", "collector", "press", "other"], {
    errorMap: () => ({ message: "Veuillez sélectionner une option." }),
  }),
  name: z.string().trim().min(2, "Nom trop court.").max(120),
  email: z.string().trim().email("Email invalide."),
  subject: z.string().trim().min(3, "Sujet trop court.").max(200),
  message: z.string().trim().min(20, "Message trop court, au moins 20 caractères.").max(3000),
  // Honeypot, doit rester vide
  website: z.string().max(0, "Bot détecté.").optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;
```

## Routage des emails

Selon `reason`, l'email part vers une boîte différente :

| `reason` | Boîte cible | From |
|---|---|---|
| `brand` | `raph@dropno.eu` | `Drop No. Contact <hello@dropno.eu>` |
| `collector`, `press`, `other` | `hello@dropno.eu` | `Drop No. Contact <hello@dropno.eu>` |

Le `Reply-To` est toujours l'email de l'expéditeur (le visiteur), pour permettre une réponse en un clic.

## Server Action / API Route

Implémentation suggérée comme **Server Action** dans `app/(public)/contact/actions.ts` :

```ts
"use server";

import { Resend } from "resend";
import { ratelimit } from "@/lib/ratelimit";
import { ContactSchema } from "./schema";
import { headers } from "next/headers";
import ContactNotificationEmail from "@/lib/email/templates/contact-notification";

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_FOR = {
  brand: "raph@dropno.eu",
  collector: "hello@dropno.eu",
  press: "hello@dropno.eu",
  other: "hello@dropno.eu",
};

export async function submitContact(formData: FormData) {
  // 1. Validate
  const raw = Object.fromEntries(formData);
  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // 2. Honeypot
  if (parsed.data.website && parsed.data.website.length > 0) {
    // Faux 200 pour ne pas signaler au bot qu'il est détecté
    return { ok: true };
  }

  // 3. Rate limit par IP (max 5 envois / heure)
  const ip = headers().get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
  const { success } = await ratelimit.limit(`contact:${ip}`);
  if (!success) {
    return { ok: false, error: "Trop de messages envoyés. Réessayez dans une heure." };
  }

  // 4. Send via Resend
  const { reason, name, email, subject, message } = parsed.data;
  await resend.emails.send({
    from: "Drop No. Contact <hello@dropno.eu>",
    to: TO_FOR[reason],
    replyTo: email,
    subject: `[${reason}] ${subject}`,
    react: ContactNotificationEmail({ reason, name, email, subject, message }),
  });

  return { ok: true };
}
```

## Rate limiting

Utiliser `@upstash/ratelimit` + Upstash Redis (free tier) :

```ts
// lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
});
```

Variables d'env : `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. À ajouter dans `.env.local.example`.

Si l'infra Upstash n'est pas en place, fallback simple par cookie ou en mémoire — mais le bot bypassera. Privilégier Upstash dès J1.

## Template email reçu par hello@/raph@

`lib/email/templates/contact-notification.tsx` (React Email) :

```tsx
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Hr } from "@react-email/components";

interface Props {
  reason: "brand" | "collector" | "press" | "other";
  name: string;
  email: string;
  subject: string;
  message: string;
}

const REASON_LABEL = {
  brand: "Marque horlogère",
  collector: "Collectionneur",
  press: "Presse",
  other: "Autre",
};

export default function ContactNotificationEmail({ reason, name, email, subject, message }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`${REASON_LABEL[reason]} : ${subject}`}</Preview>
      <Body style={{ background: "#FAFAF7", fontFamily: "Inter, sans-serif", padding: 32 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto" }}>
          <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 28, color: "#0A0A0A", marginBottom: 8 }}>
            Drop №
          </Heading>
          <Text style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 32 }}>
            Nouveau message via /contact
          </Text>

          <Section style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 4 }}>De</Text>
            <Text style={{ fontSize: 16, color: "#0A0A0A", margin: 0 }}>{name} &lt;{email}&gt;</Text>
          </Section>

          <Section style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 4 }}>Profil</Text>
            <Text style={{ fontSize: 16, color: "#0A0A0A", margin: 0 }}>{REASON_LABEL[reason]}</Text>
          </Section>

          <Section style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 4 }}>Sujet</Text>
            <Text style={{ fontSize: 16, color: "#0A0A0A", margin: 0 }}>{subject}</Text>
          </Section>

          <Hr style={{ borderColor: "#D6D2C7", margin: "24px 0" }} />

          <Section>
            <Text style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 12 }}>Message</Text>
            <Text style={{ fontSize: 15, color: "#0A0A0A", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{message}</Text>
          </Section>

          <Hr style={{ borderColor: "#D6D2C7", margin: "32px 0" }} />

          <Text style={{ fontSize: 12, color: "#6B6B6B", fontStyle: "italic" }}>
            Répondre directement à cet email pour reprendre le fil avec {name}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

## États UI

Le formulaire utilise `useFormState` + `useFormStatus` (cohérent avec `BACKOFFICE.md`) :

- **Initial** : champs vides, submit actif
- **Pending** : submit `disabled`, label change vers "Envoi…"
- **Success** : remplace tout le form par un message éditorial :
  > « Reçu. Vous recevrez une réponse dans les 48 heures ouvrées. »
  Format identique à `.italic-light`, taille `clamp(28px, 3vw, 40px)`.
- **Error** : message d'erreur sous le champ concerné en `var(--champagne-deep)`, font 13px

## Accessibilité

- Labels visibles, pas seulement placeholders
- `aria-invalid` sur les champs en erreur
- `aria-describedby` pointe vers le message d'erreur du champ
- Focus visible (border-bottom champagne sur focus, déjà dans le mockup)
- Honeypot a `aria-hidden="true"` et tabindex -1
- Le bouton submit a un état `disabled` pendant l'envoi, avec `aria-busy="true"`

## Anti-spam (3 couches)

1. **Honeypot** : champ `website` invisible, doit rester vide. Si rempli, retour 200 silencieux sans envoi.
2. **Rate limit** : 5 messages par heure par IP (Upstash sliding window).
3. **Validation Zod stricte** : longueurs min/max, format email, enum strict pour reason.

Pas de captcha au MVP. Si spam observé en prod, ajouter hCaptcha ou Cloudflare Turnstile en couche 4.

## Variables d'env à ajouter

```bash
# Resend (déjà présent)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@dropno.eu

# Upstash Redis (nouveau pour rate limit)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Resend doit avoir le domaine `dropno.eu` vérifié avec SPF + DKIM. Procédure : Dashboard Resend → Domains → Add → suivre les instructions DNS.

## Acceptance criteria

- [ ] `/contact` répond 200 avec le rendu du mockup (responsive mobile + desktop)
- [ ] Form envoie un email reçu dans `hello@dropno.eu` (ou `raph@` si reason=brand)
- [ ] Reply-To = email du visiteur, donc répondre depuis Gmail tombe directement chez lui
- [ ] Validation Zod bloque les inputs invalides côté serveur
- [ ] Honeypot rempli → 200 silencieux, aucun email
- [ ] 6e tentative depuis la même IP en 1h → "Trop de messages envoyés"
- [ ] Success state remplace le form par le message éditorial
- [ ] Lien vers `/privacy-policy` fonctionne sous le bouton submit
- [ ] Pas d'em dashes nulle part dans la copy
- [ ] Réponse à curl POST avec payload valide retourne `{ok: true}` en moins de 2s

## Hors scope (différé v2)

- Multilingue FR/EN (toggle dans nav)
- Pièces jointes au formulaire
- Auto-classification ML du message
- Intégration Crisp pour suivre la conversation
- Téléphone Drop No.

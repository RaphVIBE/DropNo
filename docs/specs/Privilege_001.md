# Privilège № 001 — spec

> Décision verrouillée 2026-06-12. Offre privée post-reveal permettant au bid le plus haut de réserver le numéro de série 001 contre supplément.
>
> **Implémenté et déployé le 2026-06-12** : migration 0026, close-drop v3, refund-transaction v2, écran client `/account/offre/[id]`, surfaces admin, tests dans `tests/privilege.test.ts` et `tests/finance-supplement.test.ts`.

## 1. Règles produit

- **Éligibilité** : uniquement le bid gagnant le plus haut du drop (rang 1 strict). Rangs 2-5 : hors scope MVP (dilution du privilège + fuite d'information sur les rangs).
- **Supplément** : `50 % × (bid₁ − clearing)`, plancher `5 % × clearing`, plafond `bid₁ − clearing`.
- **Pas d'offre si** : spread nul (bid₁ = clearing), ex æquo en tête (deux bids au montant max), ou drop annulé.
- **Sous-souscription** (tous gagnent au plancher P) : l'offre fonctionne, spread = bid₁ − P.
- **Validité** : 24h après émission, puis expiration silencieuse.
- **Refus / expiration** : aucune cascade vers le rang 2. Le 001 rentre dans l'attribution normale des numéros, sans trace visible.
- **Discrétion** : l'offre n'apparaît jamais publiquement ni côté autres gagnants. Visible uniquement par le destinataire et dans `/admin`.
- **Pré-annonce** : aucune avant le bidding au MVP. CGV : mention vague « des options de personnalisation peuvent être proposées aux gagnants ».
- **Rétractation 14j** : remboursement intégral, supplément inclus.
- **Fees** : 12 % + 5 € s'appliquent au total (clearing + supplément). Le supplément entre dans le dû maison (`/admin/finance`).

## 2. Paiement — contrainte Stripe

Une PaymentIntent n'autorise qu'**une seule capture** : `close-drop` capture déjà le clearing au reveal, le reliquat de la pré-auth est libéré. Retarder la capture du gagnant est exclu (pré-auth potentiellement vieille de 5 jours, expiration à 7).

→ **Le supplément = nouvelle PaymentIntent on-session**, créée à l'acceptation de l'offre (l'utilisateur est devant son écran, capture immédiate, SCA gérée nativement). Échec de paiement = offre reste `pending` jusqu'à expiration.

## 3. Données (migration 0026)

```sql
CREATE TABLE public.serial_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID UNIQUE NOT NULL REFERENCES public.drops(id),
  bid_id UUID UNIQUE NOT NULL REFERENCES public.bids(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_id UUID UNIQUE NOT NULL REFERENCES public.transactions(id),
  serial_no INTEGER NOT NULL DEFAULT 1,
  supplement_cents BIGINT NOT NULL CHECK (supplement_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'refunded')),
  stripe_payment_intent_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.serial_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_offers FORCE ROW LEVEL SECURITY;
-- SELECT : user_id = auth.uid() OU is_platform_admin(). Jamais la maison (discrétion).
-- INSERT/UPDATE : service role / fonctions SECURITY DEFINER uniquement.

ALTER TABLE public.transactions ADD COLUMN serial_no INTEGER;
CREATE UNIQUE INDEX ux_transactions_drop_serial
  ON public.transactions (drop_id, serial_no) WHERE serial_no IS NOT NULL;
```

Fonctions SQL (SECURITY DEFINER, `search_path` épinglé, REVOKE comme en 0002, service-role-only sauf mention) :

- `create_serial_offer(p_drop_id)` — appelée par `close-drop` (v3) après le step captures. Calcule le spread sur les bids `won`/`captured`, applique plancher/plafond, insère l'offre si éligible. Idempotente (UNIQUE sur drop_id). Service role only.
- `accept_serial_offer(p_offer_id, p_payment_intent_id)` — appelée par le webhook Stripe `payment_intent.succeeded` (metadata `kind=serial_offer`) et par `/api/serial-offers/[id]/confirm` : statut `accepted`, `transactions.serial_no = 1`. Idempotente, tolère `expired` (paiement qui gagne la course contre le cron). Service role only.
- `decline_serial_offer(p_offer_id)` — appelée par le destinataire (session RLS, vérifie `auth.uid()`).
- `admin_expire_serial_offer(p_offer_id)` — expiration manuelle (vérifie `is_platform_admin()`).
- `expire_serial_offers()` — cron toutes les 10 min (`expire_serial_offers_every_10_min`), `pending` + `expires_at < now()` → `expired`, silencieux.

Miroir TS de la formule : `lib/privilege.ts` (`computeSupplementCents`), vérifié identique à la SQL (division entière incluse).

## 4. Flow (implémenté)

1. **Reveal** (`close-drop` v3) : après captures et releases, appel `create_serial_offer()` (step 4, best-effort, rapporté dans `drop_close_runs`). Si offre créée → POST `/api/notifications/serial-offer` (secret `NOTIFY_SECRET`) → email Resend privé (`serialOfferEmail`). Idempotence email par construction : un re-run retourne `already_exists` et ne renvoie rien.
2. **Écran de victoire** : identique pour tous les gagnants. Aucune mention du privilège.
3. **Second temps** : bannière discrète sur `/account/dashboard` + email → écran privé `/account/offre/[id]` (« Une dernière chose »). CTA réserver ou conserver. Compte à rebours 24h.
4. **Acceptation** : POST `/api/serial-offers/[id]/pay` → PaymentIntent on-session (metadata `kind=serial_offer`) → confirmation Elements → webhook `payment_intent.succeeded` (+ `/confirm` synchrone en ceinture-bretelles) → `accept_serial_offer()` → « Le № 001 est à vous ».
5. **Refus** : POST `/api/serial-offers/[id]/decline` → `decline_serial_offer()`.
6. **Admin** : carte Privilège dans `/admin/cloture/[id]` (statut, supplément, expiration manuelle) + supplément accepté intégré au dû maison dans `/admin/finance` (12% de fee, pas de 5€ additionnels — `lib/admin/finance.ts`).
7. **Rétractation** : `refund-transaction` v2 rembourse aussi le supplément accepté (clé `refund-serial-<offer_id>`), statut `refunded`, `serial_no` libéré.

## 5. Copy (FR — pas de em dash, conventions brand)

**Écran victoire (inchangé)**
> Vous avez remporté le Drop № 004. Prix : 8 400 €.

**Écran « Une dernière chose » / email**
> Une dernière chose.
>
> Votre offre était la plus haute de ce drop. À ce titre, la pièce maîtresse, le numéro de série 001/100, vous est réservée.
>
> Vous pouvez la faire vôtre pour un supplément de X €. Cette offre est strictement personnelle et expire dans 24 heures. Personne d'autre ne la recevra.
>
> [Réserver le № 001] [Conserver mon numéro attribué]

**Confirmation**
> Le № 001 est à vous. Votre certificat et votre livraison seront établis à ce numéro.

## 6. Cas limites

| Cas | Comportement |
|---|---|
| Spread nul ou ex æquo en tête | Pas d'offre |
| Paiement supplément échoue | Offre reste `pending`, retry possible jusqu'à expiration |
| Refus ou expiration | 001 retourne au pool, aucune notification à quiconque |
| Rétractation 14j après acceptation | Refund total (deux charges), statut `refunded`, 001 libéré |
| Top bidder banni / bid invalidé entre reveal et acceptation | Offre `expired` par l'admin |

## 7. Incitations (rappel de l'analyse)

Non annoncé pré-bid : zéro distorsion du sealed-bid. Quand les habitués l'apprendront, la règle reste saine : l'option est opt-in et son coût croît avec le bid (50 % du spread), donc sur-bidder pour « gagner le 001 » coûte mécaniquement plus cher. À surveiller post-launch avec la variante Vickrey.

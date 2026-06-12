-- 0025_retours_logistique.sql
-- Flux logistique retour (rétractation) sur deliveries.
--
-- Une livraison modélisait uniquement le trajet aller (UNIQUE transaction_id).
-- On généralise : `direction` outbound|return, au plus une ligne par trajet.
-- Le retour a son propre transporteur/tracking/assurance — la pièce repart
-- chez la maison via le même tier logistique (DHL assuré / Malca-Amit).
-- Ajouts transverses : valeur assurée (cents) + notes opérateur.
--
-- Statuts inchangés (même CHECK) ; les labels diffèrent par direction côté
-- UI (lib/admin/orders.ts) : pour un retour, delivered = « reçue ».

alter table public.deliveries
  add column direction text not null default 'outbound'
    check (direction in ('outbound', 'return')),
  add column insured_value_cents bigint check (insured_value_cents is null or insured_value_cents >= 0),
  add column notes text;

comment on column public.deliveries.direction is
  'outbound = vers le client ; return = retour rétractation vers la maison.';
comment on column public.deliveries.insured_value_cents is
  'Valeur assurée déclarée au transporteur, en cents (reco : prix de clôture).';

-- UNIQUE (transaction_id) → UNIQUE (transaction_id, direction)
alter table public.deliveries drop constraint deliveries_transaction_id_key;
alter table public.deliveries
  add constraint deliveries_tx_direction_unique unique (transaction_id, direction);

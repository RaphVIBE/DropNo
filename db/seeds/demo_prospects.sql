-- demo_prospects.sql
--
-- Drops démo (is_demo = true) pour les calls prospects. Un drop fictif par
-- maison, visible UNIQUEMENT via /demo/<slug>?key=<DEMO_KEY> (voir
-- app/demo/[slug]/route.ts). Jamais listé en vitrine ni traité par les crons.
--
-- IDEMPOTENT et REJOUABLE : à relancer avant chaque call pour recaler le compte
-- à rebours sur le prochain jeudi 18h (Europe/Brussels), rituel de révélation.
--
-- Données fictives. Images : hotlinks Unsplash (même stratégie que le reste du
-- contenu démo). Montants en cents. Pas d'em dash (style de marque).

begin;

-- ── Maisons démo ─────────────────────────────────────────────────────────────
insert into public.brands (slug, name, country_code, description, status, is_demo)
values
  ('furlan-marri', 'Furlan Marri', 'CH',
   'Maison genevoise révélée en 2021, connue pour ses chronographes mécaniques au design vintage et ses séries ultra courtes qui partent en quelques minutes.',
   'active', true),
  ('ressence', 'Ressence', 'BE',
   'Maison anversoise au langage radical : cadrans à modules orbitaux, huile sous la glace, aucune couronne apparente. Une horlogerie d''auteur, produite en très petits volumes.',
   'active', true),
  ('trilobe', 'Trilobe', 'FR',
   'Maison parisienne fondée en 2018. Lecture de l''heure sans aiguilles, par disques tournants. Production confidentielle, esprit collectionneur.',
   'active', true),
  -- slug dédié : un échantillon PUBLIC « raidillon » (drop No.4 Speed) existe
  -- déjà dans la vitrine ; on ne le clobbere pas. Le name affiché reste Raidillon.
  ('raidillon-55', 'Raidillon', 'BE',
   'Maison belge fondée en 2001, nommée d''après la courbe de Spa-Francorchamps. Design belge, mouvements suisses, chaque modèle édité à 55 exemplaires.',
   'active', true),
  ('col-macarthur', 'Col&MacArthur', 'BE',
   'Maison belge de Liège (Sébastien Colen, 2014). Montres commémoratives renfermant un fragment authentique d''Histoire. Séries limitées numérotées, assemblées et gravées à l''atelier.',
   'active', true)
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  description = excluded.description,
  status = 'active',
  is_demo = true,
  updated_at = now();

-- ── Calcul du prochain jeudi 18h (Europe/Brussels) en UTC ────────────────────
with b as (
  select (now() at time zone 'Europe/Brussels') as ln
),
c as (
  select
    ((date_trunc('day', ln)::date
      + (((4 - extract(isodow from ln)::int) + 7) % 7)::int * interval '1 day')
      + time '18:00') as rn,
    ln
  from b
),
reveal as (
  select (
    (case when rn <= ln then rn + interval '7 days' else rn end)
    at time zone 'Europe/Brussels'
  ) as reveal_at
  from c
),
d (drop_number, slug, title, piece_reference, floor_price_cents, exemplaires, description, specs, hero_image_url, images_urls) as (
  values
    (101, 'furlan-marri', 'Mr Grey · Sector Édition',
       'Réf. FM-S101 · Série démo 8 pièces', 350000::bigint, 8,
       E'Chronographe mécanique à cadran sector grené, sous-compteurs azurés et aiguilles bleuies. Boîtier acier 38 mm, mouvement à remontage manuel, glace saphir bombée. Une pièce pensée pour le poignet, pas pour la vitrine.',
       '{"Boîtier":"Acier, 38 mm","Mouvement":"Chronographe à remontage manuel","Glace":"Saphir bombée","Cadran":"Sector grené, compteurs azurés","Étanchéité":"50 m","Bracelet":"Cuir grainé, boucle acier"}'::jsonb,
       'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
       '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1200&q=80"]'::jsonb),
    (102, 'ressence', 'Type 1° Slim Anthracite',
       'Réf. RS-T1S · Série démo 5 pièces', 1200000::bigint, 5,
       E'Cadran à modules orbitaux, sans couronne apparente, lecture par disques affleurants. Titane grade 5, profil ultra fin. Le temps lu comme une marée, pas comme une mécanique.',
       '{"Boîtier":"Titane grade 5, 42 mm","Mouvement":"Automatique, module ROCS","Glace":"Saphir traité antireflet","Cadran":"Disques orbitaux anthracite","Étanchéité":"100 m","Bracelet":"Cuir nubuck, boucle titane"}'::jsonb,
       'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80',
       '["https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?auto=format&fit=crop&w=1200&q=80"]'::jsonb),
    (103, 'trilobe', 'Les Matinaux · Nuit Fathom',
       'Réf. TR-LM103 · Série démo 6 pièces', 480000::bigint, 6,
       E'Lecture de l''heure par trois disques tournants concentriques, sans aiguille. Cadran bleu nuit guilloché main, boîtier acier 40,5 mm. Une autre grammaire du temps.',
       '{"Boîtier":"Acier, 40,5 mm","Mouvement":"Automatique, calibre X-Centric","Glace":"Saphir plat","Cadran":"Bleu nuit guilloché, disques tournants","Étanchéité":"30 m","Bracelet":"Veau bleu, boucle acier"}'::jsonb,
       'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1200&q=80',
       '["https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1200&q=80"]'::jsonb),
    (104, 'raidillon-55', 'Chrono /55 Eau Rouge',
       'Réf. RD-55ER · Série démo 10 pièces', 320000::bigint, 10,
       E'Chronographe de circuit : cadran anthracite, échelle tachymétrique rouge, fond gravé du tracé de Spa-Francorchamps. Boîtier acier 42 mm, mouvement suisse automatique. Dix exemplaires de la série de 55, le plus haut bid choisit son numéro.',
       '{"Boîtier":"Acier, 42 mm","Mouvement":"Suisse automatique, chronographe","Cadran":"Anthracite, tachymètre rouge","Fond":"Gravé du tracé de Spa-Francorchamps","Étanchéité":"100 m","Édition":"10 pièces parmi la série de 55"}'::jsonb,
       'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1200&q=80',
       '["https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?auto=format&fit=crop&w=1200&q=80"]'::jsonb),
    (105, 'col-macarthur', 'Francorchamps 1921 Automatique',
       'Réf. CM-F1921-AUTO · Drop de 12 pièces', 314900::bigint, 12,
       E'Née d''une collaboration officielle avec le Circuit de Spa-Francorchamps. Le cadran est taillé dans l''asphalte même de la piste, les compteurs dans les vibreurs (kerbs) du circuit, les poussoirs usinés dans l''acier de la Tour Uniroyal. Rien n''est symbolique : chaque matière a une provenance.\n\nBoîtier titane 41 mm, mouvement automatique suisse Sellita SW500, glace et fond saphir gravé du tracé du circuit. Édition automatique numérotée, assemblée à l''atelier de Liège. Ce drop en propose douze, par offre scellée.',
       '{"Boîtier":"Titane, 41 mm","Mouvement":"Automatique suisse Sellita SW500","Cadran":"Asphalte du circuit de Spa-Francorchamps","Compteurs":"Vibreurs (kerbs) du circuit","Poussoirs":"Acier de la Tour Uniroyal","Fond":"Saphir, tracé du circuit gravé","Étanchéité":"100 m (10 ATM)","Édition":"Numérotée · collaboration officielle Spa"}'::jsonb,
       'https://colandmacarthur.com/cdn/shop/files/Francorchamps1921_face_cuir_noir.webp?width=1200',
       '["https://colandmacarthur.com/cdn/shop/files/Francorchamps1921_face_cuir_noir.webp?width=1200","https://colandmacarthur.com/cdn/shop/files/Francorchamps1921_face_titane.webp?width=1200","https://colandmacarthur.com/cdn/shop/files/Backcover_automatique_Francorchamps_1921.webp?width=1200"]'::jsonb)
)
insert into public.drops (
  drop_number, brand_id, title, piece_reference, description, specs,
  floor_price_cents, exemplaires, hero_image_url, images_urls,
  bid_window_opens_at, reveal_at, bid_lock_at, status, is_demo
)
select
  d.drop_number,
  br.id,
  d.title,
  d.piece_reference,
  d.description,
  d.specs,
  d.floor_price_cents,
  d.exemplaires,
  d.hero_image_url,
  d.images_urls,
  r.reveal_at - interval '5 days',   -- fenêtre ouverte depuis 5 jours
  r.reveal_at,
  r.reveal_at - interval '1 hour',   -- verrou des bids à T-1h
  'open',
  true
from d
join public.brands br on br.slug = d.slug
cross join reveal r
on conflict (drop_number) do update set
  title = excluded.title,
  piece_reference = excluded.piece_reference,
  description = excluded.description,
  specs = excluded.specs,
  floor_price_cents = excluded.floor_price_cents,
  exemplaires = excluded.exemplaires,
  hero_image_url = excluded.hero_image_url,
  images_urls = excluded.images_urls,
  bid_window_opens_at = excluded.bid_window_opens_at,
  reveal_at = excluded.reveal_at,
  bid_lock_at = excluded.bid_lock_at,
  status = 'open',
  is_demo = true,
  clearing_price_cents = null,
  revealed_at = null,
  updated_at = now();

commit;

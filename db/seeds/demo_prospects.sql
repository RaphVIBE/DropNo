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
       'https://cdn.sanity.io/images/8c019h2s/production/5167b05f6a580fc3f790540923d61e52360d8ac2-1080x1350.jpg?w=1200&auto=format',
       '["https://cdn.sanity.io/images/8c019h2s/production/5167b05f6a580fc3f790540923d61e52360d8ac2-1080x1350.jpg?w=1200&auto=format","https://cdn.sanity.io/images/8c019h2s/production/4cc4c46bf5c4e88bc806146b64a269cf3ec2f08b-3020x4686.jpg?w=1200&h=1200&fit=crop&auto=format","https://cdn.sanity.io/images/8c019h2s/production/f92a7c243de2b61731b488c17e275df3db377ea1-1080x1920.jpg?w=1200&h=1200&fit=crop&auto=format"]'::jsonb),
    (102, 'ressence', 'Type 3 · Édition Anthracite',
       'Réf. RS-T3 · Série démo 5 pièces', 1200000::bigint, 5,
       E'Cadran à modules orbitaux, sans couronne apparente, lecture par disques affleurants. Titane grade 5, profil ultra fin. Le temps lu comme une marée, pas comme une mécanique.',
       '{"Boîtier":"Titane grade 5, 42 mm","Mouvement":"Automatique, module ROCS","Glace":"Saphir traité antireflet","Cadran":"Disques orbitaux anthracite","Étanchéité":"100 m","Bracelet":"Cuir nubuck, boucle titane"}'::jsonb,
       'https://ressencewatches.com/cdn/shop/files/8E5A8722-square_1200x.jpg?v=1669120920',
       '["https://ressencewatches.com/cdn/shop/files/8E5A8722-square_1200x.jpg?v=1669120920","https://ressencewatches.com/cdn/shop/files/T3B-product-page_1200x.jpg?v=1692957207","https://ressencewatches.com/cdn/shop/files/T3W-product-page_1200x.jpg?v=1692957240"]'::jsonb),
    (103, 'trilobe', 'Les Matinaux · Nuit Fathom',
       'Réf. TR-LM103 · Série démo 6 pièces', 480000::bigint, 6,
       E'Lecture de l''heure par trois disques tournants concentriques, sans aiguille. Cadran bleu nuit guilloché main, boîtier acier 40,5 mm. Une autre grammaire du temps.',
       '{"Boîtier":"Acier, 40,5 mm","Mouvement":"Automatique, calibre X-Centric","Glace":"Saphir plat","Cadran":"Bleu nuit guilloché, disques tournants","Étanchéité":"30 m","Bracelet":"Veau bleu, boucle acier"}'::jsonb,
       null,
       null::jsonb),
    (104, 'raidillon-55', 'SPEED-C10-260 SPA',
       'Réf. SPEED-C10-260 SPA · Série de 55', 350000::bigint, 10,
       E'La SPEED-C10-260 SPA porte un fragment authentique de l''ancien tarmac du raidillon, le virage qui a donné son nom à la maison, retiré lors du réasphaltage du circuit de Spa-Francorchamps avant le Grand Prix de Belgique 2022. Un morceau de piste devenu pièce d''horlogerie.\n\nFidèle à l''esprit de la collection Speed, le cadran s''inspire des compteurs de vitesse : une lecture dense en chiffres, profonde, lisible d''un coup d''œil. Le fond de boîte reste épuré. Mouvement automatique, boîtier acier.\n\nÉdition limitée à 55 exemplaires, chacun numéroté et accompagné d''un socle en acier portant le même numéro. Ce drop en propose dix, par offre scellée ; le plus haut bid choisit son numéro.',
       '{"Boîtier":"Acier","Mouvement":"Automatique","Cadran":"Compteurs de vitesse, dense en chiffres","Matière signature":"Fragment du tarmac du raidillon (réasphaltage 2022)","Fond":"Épuré","Série":"55 exemplaires numérotés, socle acier assorti","Édition":"10 pièces parmi la série de 55"}'::jsonb,
       '/demo/raidillon-speed-c10-260-spa-2.jpg',
       '["/demo/raidillon-speed-c10-260-spa-2.jpg","/demo/raidillon-speed-c10-260-spa-1.jpg"]'::jsonb),
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

-- Compteur d'offres plausible (démo) : évite l'affichage « 0 offre soumise ».
update public.drops d
set bid_count = v.bc
from (values (101, 11), (102, 7), (103, 9), (104, 13), (105, 16)) as v(drop_number, bc)
where d.drop_number = v.drop_number and d.is_demo;

-- ── Contenu EN (migration 0038) ──────────────────────────────────────────────
-- Description + specs traduites, rendues sur /en (fallback FR sinon). Bloc
-- séparé pour ne pas alourdir le CTE ci-dessus ; idempotent.
update public.drops set
  description_en = E'A mechanical chronograph with a grained sector dial, snailed sub-counters and blued hands. 38 mm steel case, manual-winding movement, domed sapphire crystal. A piece made for the wrist, not the display case.',
  specs_en = '{"Case":"Steel, 38 mm","Movement":"Manual-winding chronograph","Crystal":"Domed sapphire","Dial":"Grained sector, snailed counters","Water resistance":"50 m","Strap":"Grained leather, steel buckle"}'::jsonb
where drop_number = 101 and is_demo;

update public.drops set
  description_en = E'An orbital-module dial, no visible crown, read through flush-mounted discs. Grade 5 titanium, ultra-thin profile. Time read like a tide, not like a mechanism.',
  specs_en = '{"Case":"Grade 5 titanium, 42 mm","Movement":"Automatic, ROCS module","Crystal":"Treated anti-reflective sapphire","Dial":"Anthracite orbital discs","Water resistance":"100 m","Strap":"Nubuck leather, titanium buckle"}'::jsonb
where drop_number = 102 and is_demo;

update public.drops set
  description_en = E'Time read through three concentric rotating discs, no hands. Hand-guilloche midnight-blue dial, 40.5 mm steel case. Another grammar of time.',
  specs_en = '{"Case":"Steel, 40.5 mm","Movement":"Automatic, X-Centric calibre","Crystal":"Flat sapphire","Dial":"Midnight blue guilloche, rotating discs","Water resistance":"30 m","Strap":"Blue calf, steel buckle"}'::jsonb
where drop_number = 103 and is_demo;

update public.drops set
  description_en = E'The SPEED-C10-260 SPA carries an authentic fragment of the old tarmac from the raidillon, the corner that gave the maison its name, lifted during the resurfacing of the Spa-Francorchamps circuit ahead of the 2022 Belgian Grand Prix. A piece of the track turned into a piece of watchmaking.\n\nTrue to the Speed collection, the dial draws on speedometers: a dense, legible reading rich in numerals. The caseback stays clean. Automatic movement, steel case.\n\nLimited to 55 pieces, each numbered and paired with a steel stand bearing the same number. This drop offers ten, by sealed bid; the highest bid chooses its number.',
  specs_en = '{"Case":"Steel","Movement":"Automatic","Dial":"Speedometer style, rich in numerals","Signature material":"Fragment of the raidillon tarmac (2022 resurfacing)","Caseback":"Clean","Series":"55 numbered pieces, matching steel stand","Edition":"10 pieces from the series of 55"}'::jsonb
where drop_number = 104 and is_demo;

update public.drops set
  description_en = E'Born of an official collaboration with the Spa-Francorchamps Circuit. The dial is cut from the track''s own asphalt, the counters from the circuit''s kerbs, the pushers machined from the steel of the Uniroyal Tower. Nothing is symbolic: every material has a provenance.\n\n41 mm titanium case, Swiss Sellita SW500 automatic movement, sapphire crystal and caseback engraved with the circuit layout. A numbered automatic edition, assembled at the Liege workshop. This drop offers twelve, by sealed bid.',
  specs_en = '{"Case":"Titanium, 41 mm","Movement":"Swiss automatic Sellita SW500","Dial":"Asphalt of the Spa-Francorchamps circuit","Counters":"Circuit kerbs","Pushers":"Steel of the Uniroyal Tower","Caseback":"Sapphire, engraved circuit layout","Water resistance":"100 m (10 ATM)","Edition":"Numbered, official Spa collaboration"}'::jsonb
where drop_number = 105 and is_demo;

commit;

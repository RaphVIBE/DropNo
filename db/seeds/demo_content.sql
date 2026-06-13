-- Enrichissement du contenu démo (drops + maison) pour donner au site un rendu
-- réaliste de bout en bout : galeries, specs, descriptions, références.
--
-- ⚠️ Données DÉMO, destinées à être supprimées avant le hard launch
-- (voir soft-launch-plan). Ciblé par id sur les lignes démo existantes en prod.
-- Images : hotlinks Unsplash (stratégie déjà en place sur les heros).
-- Contenu en FR (la colonne description/specs n'est pas localisée au MVP).

begin;

-- ── Maison Lévrier : vraie story de maison indépendante ──────────────────────
update brands set
  description = 'Maison indépendante fondée à Paris en 1998. Quelques dizaines de pièces par an, assemblées main, mouvements préparés à l''atelier du Marais. Une horlogerie de proximité, sans réseau de revente : chaque montre part directement au poignet de son premier propriétaire.'
where id = 'f992992f-628b-4fb6-aa70-945c5acebb63';

-- ── № 003 Plongeur Bronze (le drop en cours) : fiche complète ────────────────
update drops set
  piece_reference = 'Réf. LV-300 · Édition limitée à 3 pièces',
  description = E'Le Plongeur Bronze est notre première plongée. Un boîtier de bronze CuSn8 de 42 mm qui se patine avec le temps, propre à chaque poignet, et un cadran brun fumé qui vire au miel sous la lumière rasante.\n\nSous la glace saphir bombée, le calibre automatique LV-300 assure 300 mètres d''étanchéité et soixante heures de réserve de marche. Lunette tournante unidirectionnelle à insert céramique, couronne vissée, fond gravé du numéro de série.\n\nTrois exemplaires seulement, numérotés 1 à 3. Livré dans son écrin atelier avec bracelet cuir huilé et bracelet caoutchouc tropic de rechange, certificat signé et révision offerte à cinq ans.',
  specs = '{
    "Boîtier": "Bronze CuSn8, 42 mm",
    "Étanchéité": "300 m",
    "Mouvement": "Automatique, calibre maison LV-300",
    "Réserve de marche": "60 heures",
    "Glace": "Saphir bombée, double antireflet",
    "Lunette": "Tournante unidirectionnelle, insert céramique",
    "Cadran": "Laqué brun fumé, index Super-LumiNova",
    "Bracelet": "Cuir de veau huilé, boucle bronze",
    "Garantie": "5 ans"
  }'::jsonb,
  -- Galerie sombre/dramatique cohérente : plongeuse sur fond noir + chrono sur
  -- reflet rouge (écho au velours du héros). Set curaté visuellement.
  images_urls = '[
    "https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1200&q=80"
  ]'::jsonb
where id = '5013369f-3ed7-4b69-a201-6937f0dfdd3e';

-- ── № 000 Type Zéro Prototype (révélé) ───────────────────────────────────────
update drops set
  piece_reference = 'Prototype 0 · 4 pièces d''archive',
  description = E'Le prototype fondateur, celui par lequel tout a commencé. Quatre exemplaires sortis de l''établi avant la première série, conservés tels quels : cadran nu, gravures manuelles, imperfections assumées.\n\nMouvement automatique préparé à l''atelier, boîtier acier 38 mm brossé main. Une pièce d''archive autant qu''une montre.',
  specs = '{
    "Boîtier": "Acier brossé, 38 mm",
    "Mouvement": "Automatique, base retravaillée atelier",
    "Étanchéité": "50 m",
    "Glace": "Saphir plat",
    "Cadran": "Argenté guilloché, sans logo",
    "Bracelet": "Veau noir, boucle acier",
    "Garantie": "5 ans"
  }'::jsonb,
  images_urls = '[
    "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1200&q=80"
  ]'::jsonb
where id = '072475be-3ac3-44b6-af9e-ba2d6a073a33';

-- ── № 002 Sport Cadran Crème (révélé) ────────────────────────────────────────
update drops set
  piece_reference = 'Réf. LV-S2 · 8 exemplaires',
  description = E'Sport chic, esprit course des années soixante. Cadran laqué crème, compteurs azurés, aiguilles bâton chauffées au bleu.\n\nBoîtier acier 39 mm, lunette tachymètre fixe, mouvement chronographe automatique. Huit exemplaires, bracelet acier à maillons ou cuir perforé au choix.',
  specs = '{
    "Boîtier": "Acier poli-brossé, 39 mm",
    "Mouvement": "Chronographe automatique",
    "Réserve de marche": "48 heures",
    "Étanchéité": "100 m",
    "Glace": "Saphir bombée",
    "Cadran": "Laqué crème, compteurs azurés",
    "Bracelet": "Acier ou cuir perforé",
    "Garantie": "5 ans"
  }'::jsonb
where id = 'c85444d2-d3dc-4f2c-b0ea-681add74aa64';

-- ── № 004 Speed — Raidillon (programmé) ──────────────────────────────────────
update drops set
  piece_reference = 'Réf. RDX-Speed · Série 55',
  description = E'Inspirée du raidillon de Spa-Francorchamps, la Speed condense l''esprit course dans un boîtier de 42 mm. Cadran à effet carbone, rehauts rouge signal, trotteuse laquée.\n\nMouvement automatique, étanchéité 100 m, fond transparent sur le rotor signé. Cinquante-cinq exemplaires, bracelet caoutchouc gaufré et boucle déployante.',
  specs = '{
    "Boîtier": "Acier, 42 mm",
    "Mouvement": "Automatique, fond transparent",
    "Réserve de marche": "40 heures",
    "Étanchéité": "100 m",
    "Glace": "Saphir",
    "Cadran": "Effet carbone, rehauts rouge",
    "Bracelet": "Caoutchouc gaufré, boucle déployante",
    "Garantie": "2 ans"
  }'::jsonb
where id = 'cdfc27a4-1bfa-42ef-9e02-371a1811ca9c';

commit;

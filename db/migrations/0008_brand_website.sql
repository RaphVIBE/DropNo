-- 0008_brand_website.sql
-- Ajoute l'URL du site officiel de la maison, affichée sur la fiche marque
-- et la page drop. Lecture publique déjà couverte par la RLS "brands active".

alter table public.brands
  add column if not exists website_url text;

comment on column public.brands.website_url is
  'URL du site officiel de la maison (lien sortant, https attendu).';

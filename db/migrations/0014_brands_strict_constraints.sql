-- 0014_brands_strict_constraints.sql
-- "Hyper cadenassé" : règles de contenu maison appliquées au niveau base, pour
-- qu'elles tiennent quel que soit l'éditeur (admin-plateforme OU responsable de
-- maison). La maison existante (Maison Lévrier) satisfait déjà ces contraintes.

do $$
begin
  alter table public.brands drop constraint if exists brands_name_len;
  alter table public.brands drop constraint if exists brands_slug_format;
  alter table public.brands drop constraint if exists brands_description_len;
  alter table public.brands drop constraint if exists brands_logo_format;
  alter table public.brands drop constraint if exists brands_website_https;
  alter table public.brands drop constraint if exists brands_country_iso2;

  alter table public.brands add constraint brands_name_len
    check (char_length(name) between 2 and 60);
  alter table public.brands add constraint brands_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 50);
  alter table public.brands add constraint brands_description_len
    check (description is null or char_length(description) <= 280);
  -- logo : URL https terminant par une extension image connue (raster/vectoriel)
  alter table public.brands add constraint brands_logo_format
    check (logo_url is null or logo_url ~* '^https://[^[:space:]]+\.(png|jpe?g|webp|svg)$');
  -- site : https avec hôte pointé
  alter table public.brands add constraint brands_website_https
    check (website_url is null or website_url ~* '^https://[^[:space:]/]+\.[^[:space:]]+');
  alter table public.brands add constraint brands_country_iso2
    check (country_code is null or country_code ~ '^[A-Z]{2}$');
end $$;

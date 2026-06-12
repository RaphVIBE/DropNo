-- 0019 — Expose `format` dans drops_public.
--
-- La vitrine « À venir » ne met en avant un drop programmé qu'à partir de sa date
-- d'annonce (ouverture − lead du format). Le gating est calculé côté app à partir
-- des presets TS (source unique des délais) ; la vue doit donc exposer le format.
-- `format` ajouté en fin de SELECT (compatible CREATE OR REPLACE VIEW).

CREATE OR REPLACE VIEW public.drops_public WITH (security_invoker = true) AS
SELECT id, drop_number, brand_id, title, piece_reference, description,
  floor_price_cents, exemplaires, bid_window_opens_at, reveal_at, bid_lock_at, status,
  CASE WHEN status = 'revealed' THEN clearing_price_cents ELSE NULL END AS clearing_price_cents,
  bid_count, hero_image_url, images_urls, specs, revealed_at, format
FROM public.drops
WHERE status IN ('scheduled', 'open', 'closed', 'revealed');

GRANT SELECT ON public.drops_public TO anon, authenticated;

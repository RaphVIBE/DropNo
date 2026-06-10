-- 0016_fix_log_bid_change_digest.sql
-- CORRECTIF BLOQUANT (production). Le trigger d'audit log_bid_change() (défini
-- au hardening, migration 0002) est SECURITY DEFINER avec search_path figé à
-- 'public', mais appelle digest() qui vit dans le schéma `extensions`. Résultat :
-- TOUTE insertion/modification d'enchère échouait avec
--   "function digest(text, unknown) does not exist"
-- → aucun bid possible. Correctif : qualifier les appels en extensions.digest().
-- Corps par ailleurs inchangé. (NB : 'public, extensions' entre quotes ne marche
-- PAS — interprété comme un seul nom de schéma ; d'où la qualification explicite.)

create or replace function public.log_bid_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE v_action TEXT; v_prev_hash TEXT; v_new_hash TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN v_action := 'create'; v_prev_hash := NULL;
  ELSIF NEW.status = 'withdrawn' AND OLD.status <> 'withdrawn' THEN v_action := 'withdraw';
  ELSIF NEW.status = 'won' THEN v_action := 'finalize_won';
  ELSIF NEW.status = 'lost' THEN v_action := 'finalize_lost';
  ELSIF NEW.status = 'invalid' THEN v_action := 'invalidate';
  ELSE v_action := 'modify';
  END IF;
  IF TG_OP <> 'INSERT' THEN
    v_prev_hash := encode(extensions.digest(OLD.id::text || OLD.amount_cents::text || OLD.updated_at::text, 'sha256'), 'hex');
  END IF;
  v_new_hash := encode(extensions.digest(NEW.id::text || NEW.amount_cents::text || NEW.updated_at::text || COALESCE(v_prev_hash, ''), 'sha256'), 'hex');
  INSERT INTO public.bid_audit_log (bid_id, drop_id, user_id, action, amount_cents_at_time, amount_hash, previous_hash)
  VALUES (NEW.id, NEW.drop_id, NEW.user_id, v_action, NEW.amount_cents, v_new_hash, v_prev_hash);
  NEW.amount_hash := v_new_hash;
  RETURN NEW;
END;
$function$;

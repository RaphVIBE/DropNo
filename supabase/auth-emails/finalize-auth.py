#!/usr/bin/env python3
"""
Finalise la config auth Supabase en UNE commande (à lancer avec un PAT frais) :

  1. crée une nouvelle clé Resend dédiée au SMTP (jamais exposée ailleurs),
  2. branche le SMTP Supabase sur cette clé fraîche,
  3. règle Site URL + complète la liste des redirections autorisées (prod + dev).

La clé Resend fuitée précédemment ne sert alors plus qu'au transactionnel
(à faire tourner de ton côté dans l'hébergeur). Sépare proprement les clés
auth / transactionnel, comme recommandé par Resend.

Secrets (env, ou .env.local en repli) :
  SUPABASE_ACCESS_TOKEN  PAT Supabase frais  (https://supabase.com/dashboard/account/tokens)
  RESEND_API_KEY         clé Resend FULL ACCESS (pour créer la nouvelle clé SMTP)

Options :
  --site-url URL   (défaut https://dropno.eu)
  --no-rotate      réutilise RESEND_API_KEY comme mot de passe SMTP (pas de nouvelle clé)
  --dry-run        n'écrit rien

Usage :
  SUPABASE_ACCESS_TOKEN=sbp_… RESEND_API_KEY=re_… python3 supabase/auth-emails/finalize-auth.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

PROJECT_REF = os.environ.get("PROJECT_REF", "ygzyzvjxregoqbzmcmyq")
HERE = os.path.dirname(os.path.abspath(__file__))
ENV_LOCAL = os.path.join(HERE, "..", "..", ".env.local")
UA = "DropNo-EmailSetup/1.0"

SMTP_HOST = "smtp.resend.com"
SMTP_PORT = "465"  # l'API valide une chaîne
SMTP_USER = "resend"
SENDER_NAME = "Drop No."
NEW_KEY_NAME = "drop-no-supabase-smtp"


def arg(name, default=None):
    if name in sys.argv:
        i = sys.argv.index(name)
        return sys.argv[i + 1] if i + 1 < len(sys.argv) else default
    return default


def from_env_or_dotenv(key, default=""):
    v = os.environ.get(key, "").strip()
    if v:
        return v
    try:
        for line in open(ENV_LOCAL, encoding="utf-8"):
            if line.strip().startswith(f"{key}="):
                return line.split("=", 1)[1].strip().strip("'\"")
    except FileNotFoundError:
        pass
    return default


def mask(s):
    return f"{s[:3]}…({len(s)} car.)" if s else "<absent>"


def req_json(url, token, method="GET", payload=None, header_key="Authorization", header_val=None):
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header(header_key, header_val or f"Bearer {token}")
    r.add_header("Content-Type", "application/json")
    r.add_header("User-Agent", UA)
    with urllib.request.urlopen(r) as resp:
        body = resp.read().decode()
        return resp.status, (json.loads(body) if body.strip() else {})


def merge_allow_list(current, additions):
    items = [x.strip() for x in (current or "").split(",") if x.strip()]
    for a in additions:
        if a not in items:
            items.append(a)
    return ",".join(items)


def main():
    dry = "--dry-run" in sys.argv
    rotate = "--no-rotate" not in sys.argv
    site_url = arg("--site-url", "https://dropno.eu").rstrip("/")

    pat = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
    resend_key = from_env_or_dotenv("RESEND_API_KEY")

    print("Finalisation config auth Supabase :")
    print(f"  projet     : {PROJECT_REF}")
    print(f"  site_url   : {site_url}")
    print(f"  rotation   : {'oui (nouvelle clé Resend)' if rotate else 'non'}")
    print(f"  PAT        : {mask(pat)}")
    print(f"  Resend key : {mask(resend_key)}")

    missing = []
    if not pat:
        missing.append("SUPABASE_ACCESS_TOKEN")
    if not resend_key:
        missing.append("RESEND_API_KEY")
    if missing:
        print("\n" + ("[dry-run] " if dry else "ERREUR : ") + "manque : " + ", ".join(missing),
              file=sys.stderr if not dry else sys.stdout)
        if not dry:
            return 1

    allow_additions = [f"{site_url}/**", "http://localhost:3000/**"]

    if dry:
        print(f"\n[dry-run] créerait la clé Resend « {NEW_KEY_NAME} »" if rotate else "\n[dry-run] réutiliserait la clé Resend fournie")
        print(f"[dry-run] PATCH site_url + uri_allow_list (+ {', '.join(allow_additions)}) + SMTP")
        print("[dry-run] rien envoyé.")
        return 0

    # 1) nouvelle clé Resend dédiée SMTP (sending access)
    smtp_pass = resend_key
    if rotate:
        try:
            _, res = req_json(
                "https://api.resend.com/api-keys", resend_key, "POST",
                {"name": NEW_KEY_NAME, "permission": "sending_access"},
            )
            smtp_pass = res.get("token") or ""
            if not smtp_pass:
                print(f"ÉCHEC : pas de token dans la réponse Resend : {res}", file=sys.stderr)
                return 1
            print(f"  ✓ nouvelle clé Resend créée (id {res.get('id')}) — mot de passe SMTP frais")
        except urllib.error.HTTPError as e:
            print(f"ÉCHEC création clé Resend HTTP {e.code} : {e.read().decode()[:200]}", file=sys.stderr)
            return 1

    # 2) lire la config actuelle (pour fusionner uri_allow_list)
    try:
        _, cfg = req_json(
            f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth", pat
        )
    except urllib.error.HTTPError as e:
        print(f"ÉCHEC lecture config HTTP {e.code} : {e.read().decode()[:200]}", file=sys.stderr)
        return 1
    new_allow = merge_allow_list(cfg.get("uri_allow_list"), allow_additions)

    # 3) PATCH : SMTP + site_url + allow list
    payload = {
        "external_email_enabled": True,
        "smtp_admin_email": from_env_or_dotenv("RESEND_FROM_EMAIL", "hello@dropno.eu"),
        "smtp_host": SMTP_HOST,
        "smtp_port": SMTP_PORT,
        "smtp_user": SMTP_USER,
        "smtp_pass": smtp_pass,
        "smtp_sender_name": SENDER_NAME,
        "site_url": site_url,
        "uri_allow_list": new_allow,
    }
    try:
        status, _ = req_json(
            f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth",
            pat, "PATCH", payload,
        )
        print(f"  ✓ Supabase config mise à jour ({status})")
        print(f"    site_url       = {site_url}")
        print(f"    uri_allow_list = {new_allow}")
        print("\nOK. SMTP (clé fraîche) + Site URL + redirections posés.")
        if rotate:
            print("La clé Resend fuitée ne sert plus au SMTP : fais-la tourner côté hébergeur (transactionnel) puis révoque-la.")
        return 0
    except urllib.error.HTTPError as e:
        print(f"ÉCHEC PATCH HTTP {e.code} : {e.read().decode()[:300]}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

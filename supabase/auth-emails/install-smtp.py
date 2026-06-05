#!/usr/bin/env python3
"""
Branche Resend comme serveur SMTP custom des emails d'auth Supabase
(PATCH /v1/projects/{ref}/config/auth).

Pourquoi : par défaut les emails d'auth partent via le SMTP intégré Supabase,
fortement rate-limité (~30/h) et sans SLA. En prod on veut Resend (même domaine
expéditeur que le transactionnel, meilleure délivrabilité).

Réglages Resend (https://resend.com/docs/send-with-supabase-smtp) :
    host = smtp.resend.com   port = 465   user = resend
    pass = clé API Resend (re_...)        expéditeur = domaine vérifié

Secrets lus dans l'environnement (ou, à défaut, dans .env.local) :
    SUPABASE_ACCESS_TOKEN   PAT Supabase  -> https://supabase.com/dashboard/account/tokens
    RESEND_API_KEY          clé re_...    = mot de passe SMTP
    RESEND_FROM_EMAIL       expéditeur    (défaut hello@dropno.eu, doit être vérifié chez Resend)

Usage :
    python3 supabase/auth-emails/install-smtp.py --dry-run   # vérifie, n'envoie rien
    python3 supabase/auth-emails/install-smtp.py             # branche
"""
import json
import os
import sys
import urllib.error
import urllib.request

PROJECT_REF = os.environ.get("PROJECT_REF", "ygzyzvjxregoqbzmcmyq")
HERE = os.path.dirname(os.path.abspath(__file__))
ENV_LOCAL = os.path.join(HERE, "..", "..", ".env.local")

SMTP_HOST = "smtp.resend.com"
SMTP_PORT = "465"  # l'API valide une chaîne, pas un nombre
SMTP_USER = "resend"
SENDER_NAME = "Drop No."


def from_env_or_dotenv(key: str, default: str = "") -> str:
    """Valeur d'env, sinon parse .env.local (sans dépendance externe)."""
    val = os.environ.get(key, "").strip()
    if val:
        return val
    try:
        with open(ENV_LOCAL, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line.startswith(f"{key}="):
                    return line.split("=", 1)[1].strip().strip("'\"")
    except FileNotFoundError:
        pass
    return default


def mask(secret: str) -> str:
    if not secret:
        return "<absent>"
    return f"{secret[:3]}…({len(secret)} car.)"


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
    resend_key = from_env_or_dotenv("RESEND_API_KEY")
    sender = from_env_or_dotenv("RESEND_FROM_EMAIL", "hello@dropno.eu")

    print("Config SMTP Resend pour les emails d'auth :")
    print(f"  projet        : {PROJECT_REF}")
    print(f"  smtp_host     : {SMTP_HOST}")
    print(f"  smtp_port     : {SMTP_PORT}")
    print(f"  smtp_user     : {SMTP_USER}")
    print(f"  smtp_pass     : {mask(resend_key)}   (= RESEND_API_KEY)")
    print(f"  smtp_admin    : {sender}")
    print(f"  sender_name   : {SENDER_NAME}")
    print(f"  PAT Supabase  : {mask(token)}")

    missing = []
    if not resend_key:
        missing.append("RESEND_API_KEY (clé Resend = mot de passe SMTP)")
    if not token:
        missing.append("SUPABASE_ACCESS_TOKEN (PAT Supabase)")

    if dry_run:
        if missing:
            print("\n[dry-run] Manque : " + ", ".join(missing))
        print("\n[dry-run] Rien n'a été envoyé.")
        return 0

    if missing:
        print("\nERREUR : secret(s) manquant(s) : " + ", ".join(missing), file=sys.stderr)
        print("  Exporte-les puis relance. Le PAT : https://supabase.com/dashboard/account/tokens", file=sys.stderr)
        return 1

    payload = {
        "external_email_enabled": True,
        "smtp_admin_email": sender,
        "smtp_host": SMTP_HOST,
        "smtp_port": SMTP_PORT,
        "smtp_user": SMTP_USER,
        "smtp_pass": resend_key,
        "smtp_sender_name": SENDER_NAME,
    }
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth"
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"), method="PATCH"
    )
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    # Cloudflare (devant l'API Supabase) bloque le UA par défaut de urllib (1010).
    req.add_header("User-Agent", "DropNo-EmailSetup/1.0")

    print(f"\nPATCH {url} …")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"OK ({resp.status}). Resend branché comme SMTP des emails d'auth.")
            print("Pense à relever le rate-limit (défaut 30/h) : Dashboard -> Auth -> Rate Limits.")
            return 0
    except urllib.error.HTTPError as e:
        print(f"ÉCHEC HTTP {e.code} : {e.read().decode('utf-8', 'replace')}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"ÉCHEC réseau : {e.reason}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

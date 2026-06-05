#!/usr/bin/env python3
"""
Pose les templates d'email d'authentification Drop No. sur le projet Supabase
via la Management API (PATCH /v1/projects/{ref}/config/auth).

Les templates d'auth font partie de la config GoTrue : ils ne se posent ni en
SQL ni en migration. Ce script lit les fichiers HTML voisins et les pousse
(contenu + sujet) en un seul appel.

Usage :
    export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx      # PAT, jamais committé
    python3 supabase/auth-emails/install.py                # pose tout
    python3 supabase/auth-emails/install.py --dry-run      # n'envoie rien, vérifie

Le PAT se génère ici : https://supabase.com/dashboard/account/tokens
Le ref projet par défaut est celui de Drop No. ; surchargeable via PROJECT_REF.
"""
import json
import os
import sys
import urllib.error
import urllib.request

PROJECT_REF = os.environ.get("PROJECT_REF", "ygzyzvjxregoqbzmcmyq")
HERE = os.path.dirname(os.path.abspath(__file__))

# fichier -> (champ contenu, champ sujet, sujet FR)
TEMPLATES = {
    "magic-link.html": (
        "mailer_templates_magic_link_content",
        "mailer_subjects_magic_link",
        "Votre lien de connexion · Drop No.",
    ),
    "confirm-signup.html": (
        "mailer_templates_confirmation_content",
        "mailer_subjects_confirmation",
        "Confirmez votre email · Drop No.",
    ),
    "recovery.html": (
        "mailer_templates_recovery_content",
        "mailer_subjects_recovery",
        "Réinitialisez votre mot de passe · Drop No.",
    ),
    "email-change.html": (
        "mailer_templates_email_change_content",
        "mailer_subjects_email_change",
        "Confirmez votre nouvelle adresse · Drop No.",
    ),
    "invite.html": (
        "mailer_templates_invite_content",
        "mailer_subjects_invite",
        "Vous êtes convié · Drop No.",
    ),
}


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()

    if not token and not dry_run:
        print("ERREUR : SUPABASE_ACCESS_TOKEN manquant.", file=sys.stderr)
        print("  export SUPABASE_ACCESS_TOKEN=sbp_...  (https://supabase.com/dashboard/account/tokens)", file=sys.stderr)
        return 1

    payload: dict[str, str] = {}
    for filename, (content_field, subject_field, subject) in TEMPLATES.items():
        path = os.path.join(HERE, filename)
        try:
            with open(path, encoding="utf-8") as fh:
                html = fh.read()
        except FileNotFoundError:
            print(f"ERREUR : fichier introuvable : {path}", file=sys.stderr)
            return 1
        payload[content_field] = html
        payload[subject_field] = subject
        print(f"  • {filename:22s} -> {content_field} ({len(html)} octets), sujet « {subject} »")

    if dry_run:
        print(f"\n[dry-run] {len(TEMPLATES)} templates prêts pour le projet {PROJECT_REF}. Rien n'a été envoyé.")
        return 0

    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="PATCH")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")

    print(f"\nPATCH {url} …")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"OK ({resp.status}). {len(TEMPLATES)} templates d'auth posés sur {PROJECT_REF}.")
            return 0
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        print(f"ÉCHEC HTTP {e.code} : {detail}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"ÉCHEC réseau : {e.reason}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

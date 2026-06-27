# business/ — matériel hors-site (non-code)

Tout ce qui n'est pas l'application Next.js : prospection, pitch, finance, social.
**Une source unique par artefact.** Les exports « prêts pour Drive » (.docx, .pdf)
se **régénèrent à la demande**, ils ne sont jamais committés comme arbre parallèle.

## Structure

| Dossier | Contenu |
|---|---|
| `prospection/` | Emails de prospection (`emails/<maison>.md`), `pipeline.xlsx`, `message-demo.md`, pré-accord maison (`pre-accord-maison.fr.md` / `.en.md`), runbooks, notes par maison (`maisons/`) |
| `pitch/` | Présentation maisons (`presentation-maisons.fr.pptx` / `.en.pptx` / `.pdf`), `ai-workflow-talk.pptx`, captures du deck (`assets/`) |
| `finance/` | `business-plan.docx`, `modele-financier.xlsx` |
| `social/` | `strategie/`, `calendrier/`, `batch-01/` & `batch-02/` (md + `media/`), `renders/` (reels HTML), `visuels/` (PNG stories/highlights), `ai-talk-video/` (sous-projet Remotion), `reel-generator.py` |

## Convention de nommage

- **kebab-case minuscule**, sans espaces ni accents dans les noms.
- **Langue en suffixe** : `nom.fr.md` / `nom.en.md` (binaires : `nom-fr.pptx`).
- **Pas de numéro de version dans le nom.** La version courante porte le nom
  canonique ; l'historique vit dans git. Archivage exceptionnel → `_archive/AAAA-MM-JJ/`.
- **Médias datés** : `AAAA-MM-JJ_type_slug.ext` (ex. `2026-06-16_post_welcome.png`).

## Exports Drive

Pour produire un .docx/.pdf signable ou « uploadable », demander la génération
depuis la source (`.md`) au moment voulu. On ne stocke pas de copie figée ici.

> Hors versionnement Git : `social/ai-talk-video/node_modules/` (gitignoré).

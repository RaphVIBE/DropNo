# Drop No. — AI talk videos (Remotion)

Two compositions, both 1920×1080, 30 fps:

**`SiteWalkthrough`** (~24 s) — a recreated product demo to drop into the slide deck:
a user opens the homepage, opens the *Plongeur Bronze* drop, types and seals a bid,
then (Thursday 18h) the reveal shows the single price. An animated cursor drives it.
It recreates the real screens with the real design system — it is not a capture of the
running site (see "Real-site capture" below).

**`DropNoAITalk`** (~62 s) — the workflow explainer (Loop · Toolbox · Feedback→code ·
Demo beats · Closing).

> Authored here but **not rendered** — this environment has no npm/registry access.
> Render on your machine with the steps below (~2 min each).

## Run it

```bash
cd ai-talk-video
npm install
npm run dev          # Remotion Studio — preview & scrub both compositions
npm run render:demo  # out/dropno-site-demo.mp4  ← the one for the deck
npm run render       # out/dropno-ai-talk.mp4    ← the full explainer
```

## Put the demo into the deck

- **PowerPoint**: open the slide → Insert ▸ Video ▸ This Device ▸
  `out/dropno-site-demo.mp4` ▸ set "Start: Automatically". A full-bleed slide works best.
- Or tell me once `dropno-site-demo.mp4` exists and I can embed it into
  `decks/Drop-No-AI-Workflow-Talk.pptx` programmatically (replacing the "Live demo" slide).

## Real-site capture (if you want the literal site instead)

The recreation is faithful but synthetic. For the real thing, screen-record locally
following `decks/Drop-No-AI-Demo-Script.md` (QuickTime ▸ New Screen Recording, or
Cmd-Shift-5 on macOS), then drop that clip into the deck the same way — or hand it to
me and I'll splice it into the Demo scene via `<Video>` from `public/`.

## If install hits a version mismatch

Remotion requires every `remotion` / `@remotion/*` package to share the same
version. If `npm install` resolves mismatched patches, align them:

```bash
npx remotion versions          # shows what's installed
npm i remotion@latest @remotion/cli@latest @remotion/google-fonts@latest
```

Alternative clean path: scaffold a fresh blank project and drop in this `src/`:

```bash
npm create video@latest -- --yes --blank --no-tailwind dropno-ai-talk
cp -r ai-talk-video/src/* dropno-ai-talk/src/
cp ai-talk-video/remotion.config.ts dropno-ai-talk/
cd dropno-ai-talk && npm i @remotion/google-fonts && npx remotion studio
```

## Tweaks

- Copy and timing live in `src/scenes/*` and `src/Video.tsx` (per-scene `d` = frames).
- Brand colours / fonts: `src/theme.ts` (Fraunces italic + Inter via `@remotion/google-fonts`;
  needs network on first run, then cached).
- Format/size: `src/Root.tsx` (`width`, `height`, `fps`).
- No real screen capture is embedded; to splice in real screens, drop clips in
  `public/` and add a `<Video>` (`@remotion/media`) inside the Demo scene.

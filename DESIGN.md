---
name: Drop No.
description: Maison de drops scellés multi-gagnants pour montres premium, brand-direct.
colors:
  warm-offwhite: "oklch(0.975 0.006 80)"
  elevated-cream: "oklch(0.99 0.004 80)"
  deep-ink: "oklch(0.18 0.012 60)"
  ink-press: "oklch(0.12 0.012 60)"
  ink-soft: "oklch(0.32 0.012 60)"
  muted-stone: "oklch(0.52 0.01 60)"
  champagne: "oklch(0.72 0.07 80)"
  champagne-deep: "oklch(0.52 0.06 70)"
  hairline: "oklch(0.85 0.01 70)"
  hairline-soft: "oklch(0.92 0.008 70)"
  alert-rust: "oklch(0.55 0.18 25)"
typography:
  display:
    fontFamily: "Fraunces, 'Times New Roman', serif"
    fontSize: "clamp(3.5rem, 8vw, 6.875rem)"
    fontWeight: 300
    lineHeight: 0.92
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Fraunces, 'Times New Roman', serif"
    fontSize: "clamp(1.25rem, 3vw, 2.25rem)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.18em"
  mono:
    fontFamily: "ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
    letterSpacing: "0.18em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  gutter-mobile: "1.75rem"
  gutter-desktop: "4rem"
  section-y: "5rem"
  block: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.deep-ink}"
    textColor: "{colors.warm-offwhite}"
    rounded: "{rounded.md}"
    padding: "0.625rem 2rem"
  button-primary-hover:
    backgroundColor: "{colors.ink-press}"
  button-outline:
    backgroundColor: "{colors.warm-offwhite}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "0.625rem 2rem"
  cta-block:
    backgroundColor: "{colors.deep-ink}"
    textColor: "{colors.warm-offwhite}"
    typography: "{typography.label}"
    padding: "18px 24px"
  cta-block-hover:
    backgroundColor: "{colors.ink-press}"
  panel:
    backgroundColor: "{colors.elevated-cream}"
    textColor: "{colors.deep-ink}"
    padding: "1.75rem"
  input-underline:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink}"
    typography: "{typography.display}"
    padding: "0.75rem 0"
---

# Design System: Drop No.

## 1. Overview

**Creative North Star: "La Vente Feutrée"**

Drop No. is a sealed-bid house for premium watches, and the interface behaves like a quiet auction room, not a marketplace. The mood is hushed authority: a maison that has nothing to prove and therefore raises its voice for nothing. Restraint is the luxury. Vast warm off-white, a deep brown-black ink, and a champagne accent that appears so rarely it reads as gold leaf rather than UI color. The Fraunces italic display carries the entire emotional register; everything else recedes to let it speak.

The system rejects the marketplace reflex completely: no urgency banners, no price-war energy, no neon, no dark "luxury tech" mode, no glassy product cards stacked in grids. It also rejects decorative noise. Depth comes from hairline rules and generous negative space, never from drop shadows or boxes. Where the product earns a flourish, it does so through a single, technically precise idea: the blueprint, drawn in line, annotated like a watchmaker's plan, with a slow clockwork that turns in the background.

The register is mobile-first (≈80% of traffic) and light-only, by doctrine. Every screen opens with an editorial entrance that reveals its elements in a slow, decelerating cascade, the way a vendor lays objects on felt one at a time.

**Key Characteristics:**
- Editorial silence: type and whitespace do the work, not chrome.
- Champagne as gold leaf: the one accent, rationed.
- Hairlines over shadows: structure by 1px rules, not elevation.
- Blueprint as signature: technical line-art, watermark dials, slow gears.
- Warm, never clinical: every neutral is tinted toward the brand hue.

## 2. Colors

A warm-tinted, near-monochrome palette: deep ink on warm off-white, with a single champagne accent held in reserve.

### Primary
- **Deep Ink** (`oklch(0.18 0.012 60)`): The voice of the system. All primary text, the wordmark, full CTAs, and every hairline that needs to assert itself. Brown-black, never pure black.
- **Ink Press** (`oklch(0.12 0.012 60)`): The pressed/hover state of ink surfaces. Hover darkens toward this; contrast increases, it never fades.

### Secondary
- **Champagne** (`oklch(0.72 0.07 80)`): The single accent. Focus rings, the live status pulse, the winning-bid fill, blueprint construction lines. Soft metallic gold.
- **Champagne Deep** (`oklch(0.52 0.06 70)`): Champagne legible on light surfaces, for small accent text, mono annotations, and figure numerals.

### Neutral
- **Warm Off-White** (`oklch(0.975 0.006 80)`): The page. A warm-tinted canvas, the felt of the auction room.
- **Elevated Cream** (`oklch(0.99 0.004 80)`): Panels and the nav glass, one step brighter than the page.
- **Ink Soft** (`oklch(0.32 0.012 60)`): Secondary prose, supporting copy.
- **Muted Stone** (`oklch(0.52 0.01 60)`): Labels, eyebrows, captions, the quietest text tier.
- **Hairline** (`oklch(0.85 0.01 70)`): Asserted borders and dividers.
- **Hairline Soft** (`oklch(0.92 0.008 70)`): Whisper-weight rules, secondary surfaces, disabled fills.

### Tertiary
- **Alert Rust** (`oklch(0.55 0.18 25)`): Validation and error only. The single time saturation is allowed outside champagne.

### Named Rules
**The Gold-Leaf Rule.** Champagne covers ≤10% of any screen. Its rarity is the entire point: it marks exactly one thing per view (a live status, a focus, the clearing price). If two champagne elements compete, one is wrong.

**The No-Pure-Black, No-Pure-White Rule.** `#000` and `#fff` are forbidden. Every neutral is tinted toward the warm brand hue (60–80 hue, chroma 0.004–0.012). Clinical greys break the room.

## 3. Typography

**Display Font:** Fraunces (with Times New Roman fallback), always italic, weight 300.
**Body Font:** Inter (with system-ui fallback).
**Label / Mono Font:** Inter for eyebrows; `ui-monospace` for blueprint annotations.

**Character:** A light Fraunces italic against a neutral Inter is the whole personality: literary, couture, unhurried, paired with quiet Swiss legibility. The serif is never upright and never bold; its thinness is its confidence.

### Hierarchy
- **Display** (Fraunces italic 300, `clamp(3.5rem, 8vw, 6.875rem)`, line-height 0.92, tracking -0.025em): Hero and page titles only. Tight leading so multi-line headlines lock into a single mass.
- **Title** (Fraunces italic 300, `1.25–2.25rem`, line-height 1.1): Section headings, drop names, sealed-bid amounts. The serif also carries numerals (prices) for editorial weight.
- **Body** (Inter 400, `1rem`, line-height 1.55): Running copy. Capped at 50–75ch (`max-w-xl`, `max-w-[52ch]`).
- **Label** (Inter 500, `0.6875rem`, tracking 0.18em, UPPERCASE): Eyebrows, field labels, status text, step names. Muted Stone by default.
- **Mono** (`ui-monospace`, `0.625rem`, tracking 0.18em, UPPERCASE): Blueprint annotations only (`T-1H`, `Nᵉ`, figure numbers, the DEV bar). Champagne Deep.

### Named Rules
**The Italic-Voice Rule.** The display serif is always italic, always 300. Upright or bold Fraunces is prohibited; reach for size or the sans before weight.

**The No-Em-Dash Rule.** Em dashes are forbidden in user-facing copy (also `--`). Use commas, colons, periods, parentheses, or a middot for separators.

## 4. Elevation

The system is flat by doctrine. Depth is built from hairline rules (`oklch(0.85 0.01 70)` and its softer sibling) and negative space, not from shadows. Surfaces sit on the page; they do not float above it. The one exception is the fixed navigation, which separates from scrolling content with a backdrop blur rather than a shadow.

### Shadow Vocabulary
- **Soft Lift** (`box-shadow: 0 1px 0 oklch(0.85 0.01 70 / 0.5), 0 24px 60px -30px oklch(0.18 0.012 60 / 0.18)`): Defined but used sparingly, reserved for a genuinely lifted surface. Default is no shadow.

### Named Rules
**The Hairline-First Rule.** Before reaching for a shadow or a card, separate content with a 1px rule and space. Borders define structure here; elevation is the exception, not the tool.

## 5. Components

### Buttons
- **Shape:** Subtle 6px radius (`rounded-md`) on the shadcn primitive; brand CTAs run square. Square is the editorial default.
- **Primary:** Deep Ink fill, Warm Off-White text, padding `0.625rem 2rem` (size `lg`).
- **Hover / Focus:** Hover darkens to Ink Press (contrast up, never opacity). Focus shows a 2px Champagne ring with a 2px offset (`focus-visible:ring-ring`). Transitions are color only.
- **Outline:** Off-white fill, hairline border, ink text; hover fills to Hairline Soft.
- **CTA Block:** Full-width, square, Deep Ink, Label typography (uppercase, 0.16em tracking), padding `18px 24px`. The commitment button on forms and the verification flow.

### Cards / Containers (Panels)
- **Corner Style:** Square. No radius on content panels.
- **Background:** Elevated Cream over the Off-White page.
- **Shadow Strategy:** None. See Elevation; structure is the border.
- **Border:** 1px Hairline (asserted) or Hairline Soft (quiet).
- **Internal Padding:** `1.5–1.75rem` (p-6 / p-7).
- Nested cards are forbidden.

### Inputs / Fields
- **Underline field (signature):** No box. A single bottom rule (`border-b`, Deep Ink) under a large Fraunces italic value, with a trailing `€`. The bid amount input.
- **Focus:** The underline shifts to Champagne Deep via `focus-within`; never a bare `outline-none`.
- **Boxed field:** Off-white fill, 1px border, square; focus shows the 2px champagne ring.
- **Error:** Alert Rust helper text below the field.

### Navigation
- **Style:** Fixed top bar, Elevated Cream at 85% with `backdrop-blur`, separated by a Hairline Soft rule, never a shadow.
- **Wordmark:** "Drop No." in Fraunces italic with a superscript "No.", `translate="no"`.
- **Links:** Inter `13px`, Muted Stone, hover to Deep Ink; focus-visible champagne ring. The "Se connecter" link is a square ink CTA.

### Filigrane (signature component)
A technical watermark dial (graduated bezel, center crosshair, corner registration ticks) drawn in `currentColor` and dropped behind page headers at ~6–7% opacity in Champagne Deep. The recurring mark of the maison across every screen. Decorative only (`aria-hidden`).

### Mechanism Flow (signature component)
The sealed-bid mechanism rendered as three blueprint plates (sealed box, reveal at T, uniform-price clearing) drawn in line, annotated in mono, linked by dashed champagne arrows, over a slow background clockwork. Honors `prefers-reduced-motion`.

## 6. Do's and Don'ts

### Do:
- **Do** let Fraunces italic 300 carry the hierarchy; reach for size before weight.
- **Do** keep champagne to ≤10% of any screen, marking exactly one thing.
- **Do** separate content with 1px hairlines and whitespace, not boxes or shadows.
- **Do** tint every neutral toward the warm hue (chroma 0.004–0.012).
- **Do** reveal page content in a slow decelerating cascade (`cubic-bezier(0.16, 1, 0.3, 1)`), and disable it under `prefers-reduced-motion`.
- **Do** increase contrast on hover (darken to Ink Press), and give every interactive element a champagne `focus-visible` ring.
- **Do** carry the filigrane watermark onto every new screen as the maison's signature.

### Don't:
- **Don't** use em dashes (or `--`) in any user-facing copy.
- **Don't** ship a dark mode. The maison is light-only, by doctrine.
- **Don't** use `#000` or `#fff`, or any untinted clinical grey.
- **Don't** fade interactive states with `opacity` (it lowers contrast and shows the background through); shift color instead.
- **Don't** stack identical product cards in a grid, nest cards, or use side-stripe (`border-left`) accents.
- **Don't** add marketplace urgency: countdown-pressure styling, "selling fast" banners, price-war energy.
- **Don't** spend champagne twice on one screen, or let it carry anything but a single point of attention.

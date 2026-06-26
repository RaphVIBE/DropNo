# Drop No. — Components reference

Composants extraits des mockups existants (`../mockups/dropno-mockups.html`, `../mockups/reveal-hero.html`).
À porter dans le futur Next.js comme composants React, ou à utiliser comme spec pour Tailwind classes.

---

## Layout

### `<Eyebrow>`
Label uppercase tracked qui précède une section. Réservé aux changements de section éditoriale.

```jsx
<span className="eyebrow">DROP № 001 · MAISON LÉVRIER</span>
// fontSize 11, letter-spacing 0.22em, uppercase, color muted
```

### `<Wordmark>`
Signature de marque. Italique, fontSize variable selon le contexte.

```jsx
<span className="italic-light text-xl">Drop №</span>
// Fraunces italic 300, le glyphe № est en superscript
```

### `<Rule>`
Trait fin horizontal, séparateur de sections. Jamais d'épaisseur > 1px.

```jsx
<hr className="rule" />
// height: 0, border-top: 1px solid var(--rule)
// variante: var(--rule-soft) pour separator inter-row
```

---

## Status & feedback

### `<StatusDot>`
Pulse champagne pour signaler "live", "ouvert", "en attente".

```jsx
<span className="status-dot" />
// 6px circle, champagne fill, pulse 2.4s ease-out infinite
// box-shadow: 0 0 0 4px rgba(champagne, 0.2)
```

### `<Countdown>`
Affichage temps restant, Fraunces italic, font-feature-settings tnum.

```jsx
<Countdown to={revealAt} />
// XXh XXm XXs ou plus large avec jours
// Format: 03 : 14 : 02 : 45 (j:h:m:s)
```

---

## Drop UI

### `<DropCard>` (calendar row)
Une ligne dans le Drop Calendar. Hover = légère élévation, padding-x augmente.

```
[№ 001] [titre + marque] [plancher] [révélation] [statut]
```

Status pills :
- `Ouvert` : champagne text + pulse dot
- `À venir` : ink-2 text
- `Clôturé` : muted text

### `<SealedBidInput>`
Input principal pour soumettre une offre. Border-bottom 1px, fontSize énorme.

```jsx
<div className="bid-input">
  <input placeholder="6 200" />
  <span>€</span>
</div>
<button className="bid-cta">Sceller mon offre</button>
```

### `<DropArt>`
Placeholder/réel visuel d'une pièce. Aspect-ratio 4/5 ou 1/1.
Fond : gradient radial sur ink (`oklch(0.32 0.025 60)` → `oklch(0.18 0.012 60)`).
Pas de bordure. Label discret en haut à gauche.

### `<ClearingPrice>`
Le moment hero : prix unitaire de clôture, géant.

```jsx
<div className="reveal">
  <span className="eyebrow">PRIX UNITAIRE DE CLÔTURE</span>
  <div className="display">6 240 €</div>
  <p className="detail italic-light">Huit pièces attribuées sur huit.</p>
</div>
// font-size: clamp(96px, 19vw, 260px)
// reveal: clip-path inset(100% 0 0 0) → inset(0)
// duration: 1100ms ease-out-expo
```

---

## Forms

### `<NewsletterInput>`
Pas de bouton "Subscribe". Input large avec underline.

```jsx
<input
  type="email"
  placeholder="vous@maison.eu"
  className="news-input"
/>
<button className="news-cta">S'inscrire</button>
```

### `<KYCNotice>`
Apparaît quand user non-KYC essaie de bidder. Sobre, pas modal.

```jsx
<div className="kyc-notice">
  <p>Une vérification d'identité Stripe est requise.</p>
  <button>Commencer (cinq minutes)</button>
</div>
```

---

## Navigation

### `<NavBar>`
Fixed top, blur transparent (45% backdrop-filter). Wordmark gauche, links centre, CTA droite.

```
[Drop №]    Maison · Calendrier · Lire    [Rejoindre]
```

### `<Tabs>` (mockup demo only)
Navigation entre vues. Lien actif souligné 1px ink.

---

## Editorial

### `<Manifesto>`
Bloc plein écran avec citation centrale en Fraunces italic, large.

```jsx
<section className="manifesto">
  <p className="italic-light text-2xl">
    Les pièces qui comptent ne devraient pas être attribuées
    au plus rapide ni au plus bruyant.
  </p>
</section>
// background: var(--bg-elev)
// padding-y: var(--space-9)
// max-width: 760px center
```

### `<EssayCard>`
Lien vers un essai sur /lire. Pas de bordure, pas de carte. Title + meta + lede.

```jsx
<article className="essay">
  <span className="eyebrow">MÉCANIQUE</span>
  <h3 className="italic-light">Vickrey, le Trésor américain...</h3>
  <p className="text-muted">9 min de lecture · 15 juin 2026</p>
</article>
```

---

## Patterns interdits

- **Glassmorphism partout** : utilisé seulement sur la NavBar fixed. Jamais sur des cards de contenu.
- **Side stripes** sur cards/alerts : jamais. Si tu veux signaler un état, utilise un dot, un label, ou rien.
- **Gradient text** : interdit. Une seule couleur, contraste via weight ou taille.
- **Cards icon + heading + paragraph répétées** : pattern saas-cliché. Si besoin de grille, prefer rows pleine largeur (cf. DropCard).
- **Modals comme premier réflexe** : KYC, login, settings, tous inline ou dédiés. Modal uniquement pour confirmations destructives.

---

## Tableau de mapping vers Tailwind config

```js
// tailwind.config.ts
export default {
  theme: {
    fontFamily: {
      serif: ['Fraunces', 'Georgia', 'serif'],
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    colors: {
      bg:        'oklch(0.975 0.006 80)',
      'bg-elev': 'oklch(0.990 0.004 80)',
      ink:       'oklch(0.180 0.012 60)',
      'ink-2':   'oklch(0.320 0.012 60)',
      muted:     'oklch(0.520 0.010 60)',
      rule:      'oklch(0.850 0.010 70)',
      champagne: 'oklch(0.720 0.07 80)',
    },
    fontSize: {
      xs:  '0.6875rem',
      sm:  '0.875rem',
      base:'1rem',
      lg:  '1.25rem',
      xl:  '1.75rem',
      '2xl':'2.5rem',
    },
    transitionTimingFunction: {
      quart: 'cubic-bezier(0.25, 1, 0.5, 1)',
      expo:  'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },
}
```

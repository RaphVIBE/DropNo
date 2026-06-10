/**
 * Hero « vitrine » d'une maison — illustration SVG editoriale, 100% locale
 * (aucune dependance reseau ni image binaire), dans l'esprit d'une belle
 * devanture de boutique sur une grande avenue parisienne au crepuscule :
 * facade haussmannienne, store, vitrine arquee eclairee avec une piece en
 * presentation, arbre et lampadaire.
 *
 * La teinte d'accent (store + halo chaud) est choisie de facon deterministe
 * a partir d'un seed (le nom de la maison), pour que chaque maison ait une
 * devanture distincte mais coherente avec la charte ink / champagne.
 */

type Accent = {
  awning: [string, string]; // degrade du store
  glow: string; // halo chaud de la vitrine
  upper: string; // fenetres de l'etage, eclairees
};

const ACCENTS: Accent[] = [
  // Champagne / or
  {
    awning: ["oklch(0.74 0.08 82)", "oklch(0.58 0.07 80)"],
    glow: "oklch(0.88 0.08 82)",
    upper: "oklch(0.86 0.07 84)",
  },
  // Vert anglais
  {
    awning: ["oklch(0.46 0.07 150)", "oklch(0.32 0.06 150)"],
    glow: "oklch(0.84 0.07 92)",
    upper: "oklch(0.84 0.06 88)",
  },
  // Bleu nuit
  {
    awning: ["oklch(0.42 0.08 250)", "oklch(0.28 0.06 250)"],
    glow: "oklch(0.86 0.07 80)",
    upper: "oklch(0.85 0.06 82)",
  },
  // Bordeaux
  {
    awning: ["oklch(0.44 0.11 25)", "oklch(0.30 0.09 25)"],
    glow: "oklch(0.86 0.07 70)",
    upper: "oklch(0.85 0.07 76)",
  },
];

// Hash stable d'une chaine -> entier positif (pas de Math.random : rendu
// identique serveur / client).
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function BoutiqueHero({
  seed = "",
  className,
}: {
  seed?: string;
  className?: string;
}) {
  const accent = ACCENTS[hashString(seed) % ACCENTS.length];
  const uid = `bh${hashString(seed)}`;

  // Etage haut : 4 fenetres reparties, intensite variant legerement par seed.
  const windows = [0, 1, 2, 3].map((i) => ({
    x: 360 + i * 130,
    lit: (hashString(seed + i) % 3) !== 0, // certaines eteintes
  }));

  return (
    <svg
      viewBox="0 0 1200 540"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.20 0.018 60)" />
          <stop offset="0.7" stopColor="oklch(0.26 0.022 56)" />
          <stop offset="1" stopColor="oklch(0.30 0.03 50)" />
        </linearGradient>
        <linearGradient id={`${uid}-stone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.34 0.012 60)" />
          <stop offset="1" stopColor="oklch(0.27 0.012 58)" />
        </linearGradient>
        <linearGradient id={`${uid}-awning`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent.awning[0]} />
          <stop offset="1" stopColor={accent.awning[1]} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.62" r="0.6">
          <stop offset="0" stopColor={accent.glow} stopOpacity="0.95" />
          <stop offset="0.6" stopColor={accent.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={accent.glow} stopOpacity="0.12" />
        </radialGradient>
        <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.24 0.012 58)" />
          <stop offset="1" stopColor="oklch(0.18 0.01 58)" />
        </linearGradient>
      </defs>

      {/* Ciel crepusculaire */}
      <rect width="1200" height="540" fill={`url(#${uid}-sky)`} />

      {/* Facade haussmannienne */}
      <rect x="150" y="40" width="900" height="420" fill={`url(#${uid}-stone)`} />
      {/* Corniche + bandeaux */}
      <rect x="150" y="40" width="900" height="10" fill="oklch(0.40 0.012 60)" />
      <rect x="150" y="208" width="900" height="6" fill="oklch(0.22 0.01 58)" />
      {/* Pilastres */}
      <g fill="oklch(0.31 0.012 60)">
        <rect x="150" y="50" width="22" height="410" />
        <rect x="1028" y="50" width="22" height="410" />
      </g>

      {/* Etage : balcon + fenetres */}
      <g>
        {windows.map((w, i) => (
          <g key={i}>
            <rect
              x={w.x}
              y="78"
              width="86"
              height="112"
              rx="6"
              fill={w.lit ? accent.upper : "oklch(0.20 0.01 58)"}
              opacity={w.lit ? 0.9 : 1}
            />
            {/* meneau */}
            <line
              x1={w.x + 43}
              y1="80"
              x2={w.x + 43}
              y2="188"
              stroke="oklch(0.24 0.01 58)"
              strokeWidth="3"
            />
            {/* garde-corps */}
            <rect
              x={w.x - 6}
              y="190"
              width="98"
              height="14"
              fill="oklch(0.36 0.012 60)"
            />
          </g>
        ))}
      </g>

      {/* Halo chaud projete par la vitrine sur le trottoir */}
      <ellipse
        cx="600"
        cy="470"
        rx="430"
        ry="90"
        fill={`url(#${uid}-glow)`}
        opacity="0.5"
      />

      {/* Store / banne */}
      <g>
        <rect x="300" y="236" width="600" height="20" fill="oklch(0.18 0.01 58)" />
        <path
          d="M300 248 H900 V274 L300 274 Z"
          fill={`url(#${uid}-awning)`}
        />
        {/* festons */}
        <path
          d="M300 274 q18 26 36 0 q18 26 36 0 q18 26 36 0 q18 26 36 0 q18 26 36 0
             q18 26 36 0 q18 26 36 0 q18 26 36 0 q18 26 36 0 q18 26 36 0
             q18 26 36 0 q18 26 36 0 q18 26 36 0 q18 26 36 0 q18 26 36 0
             q18 26 36 0 V274 Z"
          fill={`url(#${uid}-awning)`}
          opacity="0.92"
        />
      </g>

      {/* Vitrine arquee */}
      <g>
        {/* embrasure sombre */}
        <path
          d="M330 460 V360 a270 150 0 0 1 540 0 V460 Z"
          fill="oklch(0.16 0.01 58)"
        />
        {/* interieur eclaire */}
        <path
          d="M348 452 V362 a252 138 0 0 1 504 0 V452 Z"
          fill={`url(#${uid}-glow)`}
        />
        {/* meneaux verticaux */}
        <g stroke="oklch(0.16 0.01 58)" strokeWidth="6">
          <line x1="470" y1="360" x2="470" y2="452" />
          <line x1="600" y1="318" x2="600" y2="452" />
          <line x1="730" y1="360" x2="730" y2="452" />
        </g>
        {/* imposte (ligne d'arc) */}
        <path
          d="M360 372 a240 132 0 0 1 480 0"
          fill="none"
          stroke="oklch(0.16 0.01 58)"
          strokeWidth="5"
        />

        {/* Piece en presentation : socle + montre stylisee */}
        <g>
          <rect x="566" y="392" width="68" height="58" fill="oklch(0.20 0.012 58)" />
          <rect x="572" y="386" width="56" height="10" rx="3" fill="oklch(0.30 0.015 60)" />
          {/* support */}
          <rect x="596" y="350" width="8" height="40" fill="oklch(0.30 0.015 60)" />
          {/* boitier */}
          <circle cx="600" cy="340" r="22" fill="oklch(0.92 0.02 86)" opacity="0.95" />
          <circle
            cx="600"
            cy="340"
            r="22"
            fill="none"
            stroke={accent.awning[0]}
            strokeWidth="4"
          />
          {/* aiguilles 10:10 */}
          <line x1="600" y1="340" x2="589" y2="329" stroke="oklch(0.24 0.01 60)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="600" y1="340" x2="611" y2="330" stroke="oklch(0.24 0.01 60)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>

      {/* Trottoir */}
      <rect x="0" y="452" width="1200" height="88" fill={`url(#${uid}-ground)`} />
      <line x1="0" y1="452" x2="1200" y2="452" stroke="oklch(0.34 0.012 60)" strokeWidth="2" />
      {/* reflet chaud sur le sol */}
      <ellipse cx="600" cy="470" rx="250" ry="22" fill={accent.glow} opacity="0.16" />

      {/* Arbre de l'avenue (gauche) */}
      <g>
        <rect x="92" y="300" width="20" height="170" fill="oklch(0.17 0.012 50)" />
        <g fill="oklch(0.20 0.02 150)">
          <circle cx="102" cy="250" r="74" />
          <circle cx="56" cy="290" r="52" />
          <circle cx="150" cy="288" r="56" />
          <circle cx="102" cy="320" r="58" />
        </g>
      </g>

      {/* Lampadaire parisien (droite) */}
      <g stroke="oklch(0.15 0.012 55)" strokeWidth="7" fill="none">
        <line x1="1110" y1="470" x2="1110" y2="250" />
        <path d="M1110 262 q0 -22 24 -22" />
      </g>
      <circle cx="1140" cy="240" r="22" fill={accent.glow} opacity="0.85" />
      <circle cx="1140" cy="240" r="40" fill={accent.glow} opacity="0.18" />
    </svg>
  );
}

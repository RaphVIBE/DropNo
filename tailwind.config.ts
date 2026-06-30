import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
          // texte tertiaire des écrans acheteur (plus clair que -foreground)
          2: "var(--muted-2)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Tokens de marque Drop No. (usage direct)
        champagne: {
          DEFAULT: "var(--champagne)",
          deep: "var(--champagne-deep)",
        },
        ink: {
          DEFAULT: "var(--foreground)",
          2: "var(--ink-2)",
        },
        rule: {
          DEFAULT: "var(--border)",
          soft: "var(--rule-soft)",
        },
        sand: "var(--sand)",
        masthead: "var(--masthead)",
        // bande de fond profonde des écrans acheteur (plus sombre que --background)
        "bg-deep": "var(--bg-deep)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Times New Roman", "serif"],
      },
      // Échelle des titres display (validée passe 1 de l'affinage desktop).
      // Bornes hautes des clamp resserrées sur desktop, line-height plus aéré.
      // `display-hero` = le plus grand titre du site (hero vide d'accueil).
      // `display-page` = titre de masthead des pages éditoriales/index.
      fontSize: {
        "display-hero": ["clamp(2.5rem,5vw,4.25rem)", { lineHeight: "1.05" }],
        "display-page": ["clamp(2.5rem,5vw,3.5rem)", { lineHeight: "1.05" }],
      },
      // Largeur de contenu et gouttière fluide des écrans acheteur (reveal).
      maxWidth: {
        content: "var(--max-w)",
      },
      spacing: {
        gutter: "var(--gutter)",
      },
      // Courbe ease-out-quart : motion law du parcours acheteur (cf. handoff).
      // Distincte du cubic-bezier(0.16,1,0.3,1) des révélations vitrine.
      transitionTimingFunction: {
        quart: "var(--ease-quart)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 1px 0 oklch(0.85 0.01 70 / 0.5), 0 24px 60px -30px oklch(0.18 0.012 60 / 0.18)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

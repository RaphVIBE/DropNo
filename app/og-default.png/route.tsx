import { ImageResponse } from "next/og";

/**
 * Image OG par défaut (1200x630), générée à la volée par `next/og`.
 * Servie à l'URL stable `/og-default.png` pour être référencée en absolu dans
 * la metadata racine. Reprend les tokens marque : fond off-white warm, encre
 * brun-noir, accent champagne, wordmark serif.
 *
 * Pas de dépendance image binaire dans le repo : tout est dessiné en CSS.
 */

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

const BG = "#f6f3ec"; // --background off-white warm
const INK = "#26211c"; // --ink deep brown-black
const CHAMPAGNE = "#b89a63"; // accent champagne

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BG,
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            color: INK,
            fontSize: 30,
            letterSpacing: "0.06em",
          }}
        >
          <span style={{ fontStyle: "italic" }}>Drop No.</span>
          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: CHAMPAGNE,
            }}
          >
            dropno.eu
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontStyle: "italic",
              fontSize: 78,
              lineHeight: 1.05,
              color: INK,
              maxWidth: 900,
            }}
          >
            Drops scellés pour montres premium
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              lineHeight: 1.4,
              color: "#5b5248",
              maxWidth: 820,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            Offre cachée, prix unique a la revelation. Chaque jeudi a 18h.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: "#5b5248",
            fontSize: 22,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          <div style={{ width: 56, height: 2, backgroundColor: CHAMPAGNE }} />
          <span style={{ letterSpacing: "0.04em" }}>
            Vente directe par les maisons horlogeres
          </span>
        </div>
      </div>
    ),
    { ...SIZE }
  );
}

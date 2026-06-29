/**
 * Données éditoriales + chiffres de simulation des maisons en démo prospect.
 *
 * Source unique partagée par la page maison (`/demo/[slug]/maison`) et la fiche
 * drop (`/demo/[slug]`, reveal éphémère). Les `sim` sont des chiffres ILLUSTRATIFS
 * (attendu → prix révélé), pas une vente réelle : ils n'existent qu'ici, jamais
 * en base, pour ne pas laisser croire à un résultat réel.
 */

export type Repere = { label: string; value: string };
export type SimGain = { attenduCents: number; clearingCents: number };
export type MaisonContent = {
  founded: string;
  signature: string;
  lead: string[];
  reperes: Repere[];
  sim: SimGain;
};

export const MAISONS: Record<string, MaisonContent> = {
  "furlan-marri": {
    founded: "2021",
    signature: "Chronographes néo-vintage",
    lead: [
      "Fondée à Genève en 2021 par Andrea Furlan et Hamad Al Marri, Furlan Marri s'est imposée en une saison comme l'une des révélations de l'horlogerie indépendante, distinguée dès sa première année au Grand Prix d'Horlogerie de Genève.",
      "Sa signature : des chronographes au dessin néo-vintage, cadrans sector et teintes sourdes, produits en séries courtes qui s'épuisent en quelques minutes. Une demande qui dépasse de loin l'offre, drop après drop.",
    ],
    reperes: [
      { label: "Fondateurs", value: "Andrea Furlan & Hamad Al Marri" },
      { label: "Atelier", value: "Genève, Suisse" },
      { label: "Pièces", value: "Chronographes méca-quartz et mécaniques" },
      { label: "Distribution", value: "Vente directe, séries limitées" },
    ],
    sim: { attenduCents: 390000, clearingCents: 546000 },
  },
  ressence: {
    founded: "2010",
    signature: "Cadrans à modules orbitaux",
    lead: [
      "Née à Anvers en 2010 sous l'impulsion du designer Benoît Mintiens, Ressence réinvente la lecture du temps : pas de couronne, pas d'aiguilles classiques, mais des disques orbitaux affleurants, parfois immergés dans l'huile pour fondre les indications dans la glace.",
      "Une horlogerie d'auteur, radicale et belge, produite en très petits volumes. Chaque pièce relève autant du dessin industriel que de la haute horlogerie.",
    ],
    reperes: [
      { label: "Fondateur", value: "Benoît Mintiens" },
      { label: "Atelier", value: "Anvers, Belgique" },
      { label: "Système", value: "ROCS, modules orbitaux sous glace" },
      { label: "Distribution", value: "Très petits volumes" },
    ],
    sim: { attenduCents: 1350000, clearingCents: 1720000 },
  },
  trilobe: {
    founded: "2018",
    signature: "Heure sans aiguilles",
    lead: [
      "Fondée à Paris en 2018 par Gautier Massonneau, Trilobe lit l'heure autrement : trois disques concentriques tournants, sans aiguille, autour d'un cadran souvent guilloché à la main.",
      "Une manufacture intégrée au cœur de Paris, une production confidentielle et un esprit résolument collectionneur. Une grammaire du temps qui lui est propre.",
    ],
    reperes: [
      { label: "Fondateur", value: "Gautier Massonneau" },
      { label: "Atelier", value: "Paris, France" },
      { label: "Calibre", value: "X-Centric, lecture par disques" },
      { label: "Distribution", value: "Production confidentielle" },
    ],
    sim: { attenduCents: 520000, clearingCents: 718000 },
  },
  "raidillon-55": {
    founded: "2001",
    signature: "Séries de 55, esprit course",
    lead: [
      "Fondée en 2001 par Bernard Julémont et aujourd'hui portée par Fabien de Schaetzen, Raidillon tire son nom de la courbe mythique du circuit de Spa-Francorchamps. Un design belge, des mouvements suisses, une obsession : la course automobile.",
      "Chaque modèle est édité à 55 exemplaires, numérotés de 0 à 55, sans jamais le 13, comme au départ d'une grille. Une rareté inscrite dans l'ADN de la maison.",
    ],
    reperes: [
      { label: "Propriétaire", value: "Fabien de Schaetzen" },
      { label: "Atelier", value: "Bruxelles, Belgique" },
      { label: "Mouvement", value: "Suisse (Sellita)" },
      { label: "Série", value: "55 exemplaires, jamais de n°13" },
    ],
    sim: { attenduCents: 375000, clearingCents: 512000 },
  },
  "col-macarthur": {
    founded: "2014",
    signature: "Un fragment d'Histoire au poignet",
    lead: [
      "Fondée à Liège par Sébastien Colen, Col&MacArthur conçoit des montres commémoratives qui renferment un fragment authentique d'Histoire : sable de Dunkerque, météorite, éclat du Mur de Berlin. Chaque pièce est une histoire qui se porte, assemblée à l'atelier en séries numérotées.",
      "La collection Francorchamps 1921, née d'une collaboration officielle avec le circuit de Spa-Francorchamps, pousse l'idée à l'extrême : cadran taillé dans l'asphalte de la piste, compteurs dans les vibreurs, poussoirs dans l'acier de la Tour Uniroyal. Version automatique limitée à 500 pièces numérotées.",
    ],
    reperes: [
      { label: "Fondateur", value: "Sébastien Colen" },
      { label: "Atelier", value: "Liège, Belgique" },
      { label: "Collaboration", value: "Officielle, Circuit de Spa-Francorchamps" },
      { label: "Francorchamps 1921", value: "Auto Sellita SW500, titane 41 mm, /500" },
    ],
    sim: { attenduCents: 330000, clearingCents: 456000 },
  },
};

/**
 * Calcule la simulation de gain pour une maison, sur une édition de `exemplaires`
 * pièces. Renvoie null si la maison n'a pas de contenu démo.
 */
export function computeSim(slug: string, exemplaires: number) {
  const content = MAISONS[slug];
  if (!content) return null;
  const { attenduCents, clearingCents } = content.sim;
  const editionPieces = exemplaires > 0 ? exemplaires : 1;
  const perPieceCents = clearingCents - attenduCents;
  // Offre « réservée » simulée du gagnant : son bid scellé, au-dessus du
  // clearing (en sealed-bid uniform price, on bid haut et on paie le clearing).
  // Arrondi à 500 € pour un montant net affiché en dernière heure.
  const reservedBidCents = Math.round((clearingCents * 1.12) / 50000) * 50000;
  return {
    attenduCents,
    clearingCents,
    perPieceCents,
    editionPieces,
    editionGainCents: perPieceCents * editionPieces,
    gainPct: Math.round((perPieceCents / attenduCents) * 100),
    reservedBidCents,
  };
}

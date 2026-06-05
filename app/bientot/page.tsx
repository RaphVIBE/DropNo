import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drop No. — Bientôt",
  description: "Une maison de drops scellés pour montres premium.",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-champagne" aria-hidden />

      <span className="font-serif text-3xl font-light italic tracking-tight text-foreground">
        Drop <sup className="align-super text-[0.6em] text-champagne-deep">N&ordm;</sup>
      </span>

      <h1 className="font-display mt-10 text-[clamp(3rem,10vw,6rem)] leading-[0.95]">
        Bientôt.
      </h1>

      <p className="mt-8 max-w-md text-base leading-relaxed text-ink-2">
        Une maison de drops scellés pour montres premium, en direct des marques.
        Nous mettons la dernière main à l&apos;expérience.
      </p>

      <p className="mt-12 text-sm text-muted-foreground">
        Une question, une marque à présenter ?{" "}
        <a
          href="mailto:hello@dropno.eu"
          className="text-champagne-deep underline-offset-4 hover:underline"
        >
          hello@dropno.eu
        </a>
      </p>
    </main>
  );
}

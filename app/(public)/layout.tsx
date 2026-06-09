import { SiteNav } from "@/components/site-nav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      {/* La nav a deux barres sur mobile (logo+CTA, puis liens) et une seule
          sur desktop : on compense la hauteur en consequence. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="pt-[124px] outline-none sm:pt-[72px]"
      >
        {children}
      </main>
    </>
  );
}

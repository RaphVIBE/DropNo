import { SiteNav } from "@/components/site-nav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main id="main-content" tabIndex={-1} className="pt-[72px] outline-none">
        {children}
      </main>
    </>
  );
}

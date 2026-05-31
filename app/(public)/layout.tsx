import { SiteNav } from "@/components/site-nav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main className="pt-[72px]">{children}</main>
    </>
  );
}

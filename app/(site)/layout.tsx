/**
 * Layout for the community surface (landing, explore, dashboard, profiles,
 * settings). Full-screen routes (studio, viewer) live outside this group so they
 * don't get the site header.
 */
import SiteHeader from "@/components/site/SiteHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}

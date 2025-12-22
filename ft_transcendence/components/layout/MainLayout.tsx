import type { ReactNode } from "react";
import { MainNavbar } from "./MainNavbar";
import { MainFooter } from "@/components/layout/MainFooter";

export function MainLayout({
  userLabel,
  children,
  showNav = true,
}: {
  userLabel?: string;
  children: ReactNode;
  showNav?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(900px_circle_at_50%_90%,rgba(244,114,182,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent,rgba(255,255,255,0.02))]" />
      </div>

      {/* Navbar */}
      {showNav ? <MainNavbar userLabel={userLabel ?? "User"} /> : null}
      
      {/* Main content */}
      <main
        className={`flex-1 px-4 sm:px-6 lg:px-8 ${
          showNav ? "pt-20" : ""
        }`}
      >
        {children}
      </main>

      <MainFooter />
    </div>
  );
}

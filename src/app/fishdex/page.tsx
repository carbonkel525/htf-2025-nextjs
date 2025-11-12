import { UserInfo } from "@/components/AuthProvider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function FishDex() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-3 border-b-2 border-panel-border flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold [text-shadow:--shadow-glow-text] text-sonar-green">
            FISH TRACKER
          </div>
          <div className="text-xs text-text-secondary font-mono">
            GLOBAL MARINE MONITORING SYSTEM
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <Link href="/fishdex">
              <span className="text-text-secondary">MY FISH DEX</span>
            </Link>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <UserInfo />
          </div>
        </div>
      </div>    
    </div>
  );
}

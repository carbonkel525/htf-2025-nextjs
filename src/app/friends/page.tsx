import { UserInfo } from "@/components/AuthProvider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import FriendsClient from "@/components/FriendsClient";

export default async function Friends() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden">
      {/* Scanline effect */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--color-sonar-green)_10%,transparent)] to-transparent animate-scanline pointer-events-none z-[9999]"></div>

      {/* Header */}
      <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-3 border-b-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold [text-shadow:--shadow-glow-text] text-sonar-green">
            FRIENDS
          </div>
          <div className="text-xs text-text-secondary font-mono">
            SOCIAL NETWORK
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <Link href="/">
              <span className="text-text-secondary hover:text-sonar-green transition-colors">
                TRACKER
              </span>
            </Link>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <Link href="/fishdex">
              <span className="text-text-secondary hover:text-sonar-green transition-colors">
                MY FISH DEX
              </span>
            </Link>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <UserInfo />
          </div>
        </div>
      </div>

      {/* Friends Content */}
      <FriendsClient userId={session.user.id} />
    </div>
  );
}


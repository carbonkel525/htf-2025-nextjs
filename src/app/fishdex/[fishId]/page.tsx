import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fishDex } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { fetchFishById } from "@/api/fish";
import FishDetailClient from "@/components/FishDetailClient";

interface FishDetailPageProps {
  params: { fishId: string };
}

export default async function FishDetailPage({ params }: FishDetailPageProps) {
  const { fishId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const fish = await fetchFishById(fishId).catch(() => null);

  if (!fish) {
    notFound();
  }

  const dexEntry = await db
    .select({
      id: fishDex.id,
      createdAt: fishDex.createdAt,
    })
    .from(fishDex)
    .where(and(eq(fishDex.userId, session.user.id), eq(fishDex.fishId, fishId)))
    .limit(1);

  const isCollected = dexEntry.length > 0;
  const collectedAt = dexEntry[0]?.createdAt
    ? new Date(dexEntry[0].createdAt).toISOString()
    : null;

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-[color-mix(in_srgb,var(--color-sonar-green)_10%,transparent)] to-transparent animate-scanline pointer-events-none z-9999"></div>

      <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-3 border-b-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-shadow-[--shadow-glow-text] text-sonar-green">
            FISH DETAIL
          </div>
          <div className="text-xs text-text-secondary font-mono">
            TARGET INTELLIGENCE REPORT
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
                BACK TO FISH DEX
              </span>
            </Link>
          </div>
        </div>
      </div>

      <FishDetailClient
        fish={fish}
        isCollected={isCollected}
        collectedAt={collectedAt}
      />
    </div>
  );
}

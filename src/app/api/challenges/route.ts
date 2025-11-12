import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getUserChallengeProgress,
  regenerateTodaysChallenges,
} from "@/services/challengeService";

/**
 * GET /api/challenges
 * Get current user's daily challenge progress
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's challenge progress for today
    const challenges = await getUserChallengeProgress(session.user.id);

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/challenges
 * Regenerate today's challenges
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Regenerate today's challenges
    const newChallenges = await regenerateTodaysChallenges();

    // Get user's progress for the new challenges
    const challenges = await getUserChallengeProgress(session.user.id);

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error("Error regenerating challenges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


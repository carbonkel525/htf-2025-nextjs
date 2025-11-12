import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fish } from "@/db/schema";
import { eq } from "drizzle-orm";

const EXTERNAL_API_BASE_URL =
  process.env.NEXT_PUBLIC_FISH_API_URL ?? "http://localhost:5555/api";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fishId, latitude, longitude, timestamp } = body;

    if (!fishId || latitude === undefined || longitude === undefined || !timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: fishId, latitude, longitude, timestamp" },
        { status: 400 }
      );
    }

    // Create sighting in external API
    const externalResponse = await fetch(`${EXTERNAL_API_BASE_URL}/fish-sightings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fishId,
        latitude,
        longitude,
        timestamp,
      }),
    });

    if (!externalResponse.ok) {
      const errorData = await externalResponse.json().catch(() => ({ error: "Failed to create sighting in external API" }));
      return NextResponse.json(
        { error: errorData.error || errorData.message || "Failed to create sighting" },
        { status: externalResponse.status }
      );
    }

    const sightingData = await externalResponse.json();

    // Update the fish's latestSighting in local database
    const now = new Date();
    await db
      .update(fish)
      .set({
        latestSightingLatitude: latitude,
        latestSightingLongitude: longitude,
        latestSightingTimestamp: timestamp,
        updatedAt: now,
      })
      .where(eq(fish.id, fishId));

    return NextResponse.json(sightingData);
  } catch (error) {
    console.error("Error creating fish sighting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


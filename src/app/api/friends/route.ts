import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { friends, user } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

// GET /api/friends - Get user's friends list
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get friends where user is the initiator (userId)
  const friendsAsUser = await db
    .select({
      id: friends.id,
      friend: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      createdAt: friends.createdAt,
    })
    .from(friends)
    .innerJoin(user, eq(friends.friendId, user.id))
    .where(eq(friends.userId, session.user.id));

  // Get friends where user is the friend (friendId)
  const friendsAsFriend = await db
    .select({
      id: friends.id,
      friend: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      createdAt: friends.createdAt,
    })
    .from(friends)
    .innerJoin(user, eq(friends.userId, user.id))
    .where(eq(friends.friendId, session.user.id));

  // Combine both lists
  const allFriends = [...friendsAsUser, ...friendsAsFriend];

  // Transform to simplify the response
  const friendsList = allFriends.map((f) => ({
    id: f.id,
    userId: f.friend.id,
    name: f.friend.name,
    email: f.friend.email,
    image: f.friend.image,
    createdAt: f.createdAt,
  }));

  return NextResponse.json({ friends: friendsList });
}

// POST /api/friends - Add a new friend
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { friendId } = body;

    if (!friendId || typeof friendId !== "string") {
      return NextResponse.json(
        { error: "friendId is required" },
        { status: 400 }
      );
    }

    // Prevent self-friending
    if (friendId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot add yourself as a friend" },
        { status: 400 }
      );
    }

    // Check if friend exists
    const friendUser = await db
      .select()
      .from(user)
      .where(eq(user.id, friendId))
      .limit(1);

    if (friendUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if friendship already exists (in either direction)
    const existingFriendship = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId, session.user.id), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, session.user.id))
        )
      )
      .limit(1);

    if (existingFriendship.length > 0) {
      return NextResponse.json(
        { error: "Friendship already exists" },
        { status: 409 }
      );
    }

    // Create friendship
    const now = new Date();
    const friendshipId = nanoid();

    await db.insert(friends).values({
      id: friendshipId,
      userId: session.user.id,
      friendId: friendId,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      friendship: {
        id: friendshipId,
        userId: session.user.id,
        friendId: friendId,
      },
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


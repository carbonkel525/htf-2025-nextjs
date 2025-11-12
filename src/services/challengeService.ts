/**
 * Challenge Service
 *
 * Manages daily challenges for users.
 * Generates challenges, tracks progress, and updates challenge completion status.
 */

import { db } from "@/db";
import { dailyChallenge, challengeProgress, fish, user } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export type ChallengeType =
  | "CATCH_COMMON_FISH"
  | "CATCH_RARE_FISH"
  | "CATCH_EPIC_FISH"
  | "CATCH_ANY_FISH";

export interface Challenge {
  id: string;
  challengeType: ChallengeType;
  target: number;
  description: string;
  date: string;
  currentProgress?: number;
  completed?: boolean;
  completedAt?: Date | null;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Generate a random daily challenge
 */
function generateDailyChallenge(date: string): {
  challengeType: ChallengeType;
  target: number;
  description: string;
} {
  const challenges: Array<{
    type: ChallengeType;
    targets: number[];
    getDescription: (target: number) => string;
  }> = [
    {
      type: "CATCH_COMMON_FISH",
      targets: [2, 3, 5],
      getDescription: (target) => `Catch ${target} common fish`,
    },
    {
      type: "CATCH_RARE_FISH",
      targets: [1, 2, 3],
      getDescription: (target) => `Catch ${target} rare fish`,
    },
    {
      type: "CATCH_EPIC_FISH",
      targets: [1, 2],
      getDescription: (target) => `Catch ${target} epic fish`,
    },
    {
      type: "CATCH_ANY_FISH",
      targets: [3, 5, 7, 10],
      getDescription: (target) => `Catch ${target} fish`,
    },
  ];

  // Select a random challenge
  const challenge = challenges[Math.floor(Math.random() * challenges.length)];
  const target =
    challenge.targets[Math.floor(Math.random() * challenge.targets.length)];
  const description = challenge.getDescription(target);

  return {
    challengeType: challenge.type,
    target,
    description,
  };
}

/**
 * Get or create today's daily challenges
 * Ensures challenges exist for today
 */
export async function getOrCreateTodaysChallenges(): Promise<Challenge[]> {
  const today = getTodayDate();

  // Check if challenges already exist for today
  const existingChallenges = await db
    .select()
    .from(dailyChallenge)
    .where(eq(dailyChallenge.date, today));

  // If challenges exist, return them
  if (existingChallenges.length > 0) {
    return existingChallenges.map((c) => ({
      id: c.id,
      challengeType: c.challengeType as ChallengeType,
      target: c.target,
      description: c.description,
      date: c.date,
    }));
  }

  // Generate and create 3 new challenges for today
  // Handle race condition where multiple requests might try to create challenges
  try {
    const now = new Date();
    const allChallengeTypes: ChallengeType[] = [
      "CATCH_COMMON_FISH",
      "CATCH_RARE_FISH",
      "CATCH_EPIC_FISH",
      "CATCH_ANY_FISH",
    ];

    // Shuffle challenge types and select 3 unique types
    const shuffledTypes = [...allChallengeTypes].sort(
      () => Math.random() - 0.5
    );
    const selectedTypes = shuffledTypes.slice(0, 3);

    // Define challenge templates
    const challengeTemplates: Array<{
      type: ChallengeType;
      targets: number[];
      getDescription: (target: number) => string;
    }> = [
      {
        type: "CATCH_COMMON_FISH",
        targets: [2, 3, 5],
        getDescription: (target) => `Catch ${target} common fish`,
      },
      {
        type: "CATCH_RARE_FISH",
        targets: [1, 2, 3],
        getDescription: (target) => `Catch ${target} rare fish`,
      },
      {
        type: "CATCH_EPIC_FISH",
        targets: [1, 2],
        getDescription: (target) => `Catch ${target} epic fish`,
      },
      {
        type: "CATCH_ANY_FISH",
        targets: [3, 5, 7, 10],
        getDescription: (target) => `Catch ${target} fish`,
      },
    ];

    // Generate challenges for the selected types
    const finalChallenges = selectedTypes.map((type) => {
      const challengeTemplate = challengeTemplates.find((c) => c.type === type)!;
      const target =
        challengeTemplate.targets[
          Math.floor(Math.random() * challengeTemplate.targets.length)
        ];
      return {
        challengeType: type,
        target,
        description: challengeTemplate.getDescription(target),
      };
    });

    // Insert all challenges
    const insertedChallenges = await db
      .insert(dailyChallenge)
      .values(
        finalChallenges.map((challenge) => ({
          id: nanoid(),
          challengeType: challenge.challengeType,
          target: challenge.target,
          description: challenge.description,
          date: today,
          createdAt: now,
          updatedAt: now,
        }))
      )
      .returning();

    return insertedChallenges.map((c) => ({
      id: c.id,
      challengeType: c.challengeType as ChallengeType,
      target: c.target,
      description: c.description,
      date: c.date,
    }));
  } catch (error: any) {
    // If challenges already exist (race condition), fetch them instead
    if (error?.message?.includes("UNIQUE constraint") || error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      const existingChallenges = await db
        .select()
        .from(dailyChallenge)
        .where(eq(dailyChallenge.date, today));

      if (existingChallenges.length > 0) {
        return existingChallenges.map((c) => ({
          id: c.id,
          challengeType: c.challengeType as ChallengeType,
          target: c.target,
          description: c.description,
          date: c.date,
        }));
      }
    }
    // Re-throw if it's a different error
    throw error;
  }
}

/**
 * Get user's challenge progress for today
 */
export async function getUserChallengeProgress(
  userId: string
): Promise<Challenge[]> {
  const today = getTodayDate();

  // Ensure today's challenges exist
  await getOrCreateTodaysChallenges();

  // Get all challenges for today
  const challenges = await db
    .select()
    .from(dailyChallenge)
    .where(eq(dailyChallenge.date, today));

  // Get user's progress for today's challenges
  const progress = await db
    .select()
    .from(challengeProgress)
    .where(
      and(
        eq(challengeProgress.userId, userId),
        eq(challengeProgress.date, today)
      )
    );

  // Create a map of challenge progress by challengeId
  const progressMap = new Map(
    progress.map((p) => [p.challengeId, p])
  );

  // Combine challenges with progress
  return challenges.map((challenge) => {
    const userProgress = progressMap.get(challenge.id);
    return {
      id: challenge.id,
      challengeType: challenge.challengeType as ChallengeType,
      target: challenge.target,
      description: challenge.description,
      date: challenge.date,
      currentProgress: userProgress?.currentProgress ?? 0,
      completed: !!userProgress?.completedAt,
      completedAt: userProgress?.completedAt ?? null,
    };
  });
}

/**
 * Update challenge progress when a fish is caught
 */
export async function updateChallengeProgress(
  userId: string,
  fishId: string
): Promise<void> {
  const today = getTodayDate();

  // Ensure today's challenges exist
  await getOrCreateTodaysChallenges();

  // Get the fish to check its rarity
  const [caughtFish] = await db
    .select()
    .from(fish)
    .where(eq(fish.id, fishId))
    .limit(1);

  if (!caughtFish) {
    return; // Fish doesn't exist, can't update challenges
  }

  // Get today's challenges
  const challenges = await db
    .select()
    .from(dailyChallenge)
    .where(eq(dailyChallenge.date, today));

  const now = new Date();

  // Update progress for each relevant challenge
  for (const challenge of challenges) {
    let shouldUpdate = false;

    // Check if this catch counts toward the challenge
    switch (challenge.challengeType) {
      case "CATCH_COMMON_FISH":
        shouldUpdate = caughtFish.rarity === "COMMON";
        break;
      case "CATCH_RARE_FISH":
        shouldUpdate = caughtFish.rarity === "RARE";
        break;
      case "CATCH_EPIC_FISH":
        shouldUpdate = caughtFish.rarity === "EPIC";
        break;
      case "CATCH_ANY_FISH":
        shouldUpdate = true;
        break;
    }

    if (!shouldUpdate) {
      continue;
    }

    // Get or create progress entry
    const [existingProgress] = await db
      .select()
      .from(challengeProgress)
      .where(
        and(
          eq(challengeProgress.userId, userId),
          eq(challengeProgress.challengeId, challenge.id)
        )
      )
      .limit(1);

    if (existingProgress) {
      // Update existing progress if not already completed
      if (!existingProgress.completedAt) {
        const newProgress = existingProgress.currentProgress + 1;
        const isCompleted = newProgress >= challenge.target;

        await db
          .update(challengeProgress)
          .set({
            currentProgress: newProgress,
            completedAt: isCompleted ? now : null,
            updatedAt: now,
          })
          .where(eq(challengeProgress.id, existingProgress.id));

        // Award coins if challenge is completed
        if (isCompleted) {
          await awardCoinsForChallenge(userId);
        }
      }
    } else {
      // Create new progress entry
      const newProgress = 1;
      const isCompleted = newProgress >= challenge.target;

      await db.insert(challengeProgress).values({
        id: nanoid(),
        userId,
        challengeId: challenge.id,
        currentProgress: newProgress,
        completedAt: isCompleted ? now : null,
        date: today,
        createdAt: now,
        updatedAt: now,
      });

      // Award coins if challenge is completed
      if (isCompleted) {
        await awardCoinsForChallenge(userId);
      }
    }
  }
}

/**
 * Award coins to user when they complete a challenge
 * Awards 100 coins per challenge completion
 */
async function awardCoinsForChallenge(userId: string): Promise<void> {
  const coinsToAward = 100;
  
  // Get current user to read current coins value
  const [currentUser] = await db
    .select({ coins: user.coins })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (currentUser) {
    // Atomically increment user's coins
    await db
      .update(user)
      .set({
        coins: currentUser.coins + coinsToAward,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  }
}

/**
 * Get user's completed challenges for today
 */
export async function getUserCompletedChallenges(
  userId: string
): Promise<Challenge[]> {
  const challenges = await getUserChallengeProgress(userId);
  return challenges.filter((c) => c.completed);
}

/**
 * Regenerate today's challenges
 * Deletes existing challenges for today and creates new ones
 */
export async function regenerateTodaysChallenges(): Promise<Challenge[]> {
  const today = getTodayDate();

  // Delete existing challenges and their progress for today
  // First, get all challenge IDs for today
  const existingChallenges = await db
    .select({ id: dailyChallenge.id })
    .from(dailyChallenge)
    .where(eq(dailyChallenge.date, today));

  if (existingChallenges.length > 0) {
    const challengeIds = existingChallenges.map((c) => c.id);

    // Delete progress entries for these challenges
    if (challengeIds.length > 0) {
      await db
        .delete(challengeProgress)
        .where(
          and(
            eq(challengeProgress.date, today),
            inArray(challengeProgress.challengeId, challengeIds)
          )
        );
    }

    // Delete the challenges
    await db
      .delete(dailyChallenge)
      .where(eq(dailyChallenge.date, today));
  }

  // Generate and create new challenges
  return await getOrCreateTodaysChallenges();
}


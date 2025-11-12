import {
  sqliteTable,
  text,
  integer,
  real,
  unique,
} from "drizzle-orm/sqlite-core";

// User table
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Session table
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Account table
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Verification table
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// Fish table - stores all tracked fishes from external API
export const fish = sqliteTable("fish", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image"),
  rarity: text("rarity").notNull(),
  latestSightingLatitude: real("latestSightingLatitude"),
  latestSightingLongitude: real("latestSightingLongitude"),
  latestSightingTimestamp: text("latestSightingTimestamp"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Fish Dex table - user's collected fish references
// Allows multiple catches of the same fish with different CP scores
export const fishDex = sqliteTable("fishDex", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  fishId: text("fishId")
    .notNull()
    .references(() => fish.id, { onDelete: "cascade" }),
  cpScore: integer("cpScore").notNull(), // CP score (0-1000)
  catchAttempts: integer("catchAttempts").notNull(), // Number of attempts to catch
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Friends table - bidirectional friendship relationships
export const friends = sqliteTable("friends", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  friendId: text("friendId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
}, (table) => ({
  // Ensure unique friendship pairs
  uniqueFriendship: unique().on(table.userId, table.friendId),
}));

// Daily Challenge table - stores daily challenges
export const dailyChallenge = sqliteTable("dailyChallenge", {
  id: text("id").primaryKey(),
  challengeType: text("challengeType").notNull(), // e.g., "CATCH_COMMON_FISH", "CATCH_RARE_FISH", "CATCH_ANY_FISH"
  target: integer("target").notNull(), // Target count (e.g., 2, 5, 10)
  description: text("description").notNull(), // Human-readable description
  date: text("date").notNull(), // Date in YYYY-MM-DD format
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
}, (table) => ({
  // Ensure one challenge per type per date
  uniqueChallengeDate: unique().on(table.challengeType, table.date),
}));

// Challenge Progress table - tracks user progress on challenges
export const challengeProgress = sqliteTable("challengeProgress", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  challengeId: text("challengeId")
    .notNull()
    .references(() => dailyChallenge.id, { onDelete: "cascade" }),
  currentProgress: integer("currentProgress").notNull().default(0),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  date: text("date").notNull(), // Date in YYYY-MM-DD format (matches challenge date)
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
}, (table) => ({
  // Ensure one progress entry per user per challenge
  uniqueUserChallenge: unique().on(table.userId, table.challengeId),
}));
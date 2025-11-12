CREATE TABLE `fish` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`rarity` text NOT NULL,
	`latestSightingLatitude` real NOT NULL,
	`latestSightingLongitude` real NOT NULL,
	`latestSightingTimestamp` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_fishDex` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`fishId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fishId`) REFERENCES `fish`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_fishDex`("id", "userId", "fishId", "createdAt", "updatedAt") SELECT "id", "userId", "fishId", "createdAt", "updatedAt" FROM `fishDex`;--> statement-breakpoint
DROP TABLE `fishDex`;--> statement-breakpoint
ALTER TABLE `__new_fishDex` RENAME TO `fishDex`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `fishDex_userId_fishId_unique` ON `fishDex` (`userId`,`fishId`);
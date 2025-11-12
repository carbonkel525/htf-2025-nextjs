PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_fish` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`rarity` text NOT NULL,
	`latestSightingLatitude` real,
	`latestSightingLongitude` real,
	`latestSightingTimestamp` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_fish`("id", "name", "image", "rarity", "latestSightingLatitude", "latestSightingLongitude", "latestSightingTimestamp", "createdAt", "updatedAt") SELECT "id", "name", "image", "rarity", "latestSightingLatitude", "latestSightingLongitude", "latestSightingTimestamp", "createdAt", "updatedAt" FROM `fish`;--> statement-breakpoint
DROP TABLE `fish`;--> statement-breakpoint
ALTER TABLE `__new_fish` RENAME TO `fish`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
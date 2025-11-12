ALTER TABLE `fishDex` ADD `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `fishDex` ADD `image` text;--> statement-breakpoint
ALTER TABLE `fishDex` ADD `rarity` text NOT NULL;--> statement-breakpoint
ALTER TABLE `fishDex` ADD `latestSightingLatitude` real NOT NULL;--> statement-breakpoint
ALTER TABLE `fishDex` ADD `latestSightingLongitude` real NOT NULL;--> statement-breakpoint
ALTER TABLE `fishDex` ADD `latestSightingTimestamp` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `fishDex_userId_fishId_unique` ON `fishDex` (`userId`,`fishId`);
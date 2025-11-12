CREATE TABLE `challengeProgress` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`challengeId` text NOT NULL,
	`currentProgress` integer DEFAULT 0 NOT NULL,
	`completedAt` integer,
	`date` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challengeId`) REFERENCES `dailyChallenge`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `challengeProgress_userId_challengeId_unique` ON `challengeProgress` (`userId`,`challengeId`);--> statement-breakpoint
CREATE TABLE `dailyChallenge` (
	`id` text PRIMARY KEY NOT NULL,
	`challengeType` text NOT NULL,
	`target` integer NOT NULL,
	`description` text NOT NULL,
	`date` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dailyChallenge_challengeType_date_unique` ON `dailyChallenge` (`challengeType`,`date`);
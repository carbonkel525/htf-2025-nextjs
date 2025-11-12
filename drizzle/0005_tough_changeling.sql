DROP INDEX `fishDex_userId_fishId_unique`;--> statement-breakpoint
ALTER TABLE `fishDex` ADD `cpScore` integer NOT NULL DEFAULT 1000;--> statement-breakpoint
ALTER TABLE `fishDex` ADD `catchAttempts` integer NOT NULL DEFAULT 1;
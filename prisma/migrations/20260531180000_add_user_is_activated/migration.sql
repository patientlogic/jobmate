-- AlterTable
ALTER TABLE `User` ADD COLUMN `isActivated` BOOLEAN NOT NULL DEFAULT false;

-- Existing accounts remain able to sign in
UPDATE `User` SET `isActivated` = true;

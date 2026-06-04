-- AlterTable
ALTER TABLE `Meeting` ADD COLUMN `jobUrl` VARCHAR(2048) NULL;

-- DropForeignKey
ALTER TABLE `Meeting` DROP FOREIGN KEY `Meeting_jobId_fkey`;

-- AlterTable
ALTER TABLE `Meeting` MODIFY `jobId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

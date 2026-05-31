-- AlterTable
ALTER TABLE `Meeting` ADD COLUMN `assignedDeveloperId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Meeting_assignedDeveloperId_idx` ON `Meeting`(`assignedDeveloperId`);

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_assignedDeveloperId_fkey` FOREIGN KEY (`assignedDeveloperId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

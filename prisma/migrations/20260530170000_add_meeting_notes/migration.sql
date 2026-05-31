-- CreateTable
CREATE TABLE `MeetingNote` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MeetingNote_meetingId_idx`(`meetingId`),
    INDEX `MeetingNote_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MeetingNote` ADD CONSTRAINT `MeetingNote_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `Meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingNote` ADD CONSTRAINT `MeetingNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

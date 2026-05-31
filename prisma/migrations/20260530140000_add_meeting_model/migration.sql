-- CreateTable
CREATE TABLE `Meeting` (
    `id` VARCHAR(191) NOT NULL,
    `mid` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `positionRole` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL DEFAULT '',
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `meetingLink` VARCHAR(191) NULL,
    `interviewStep` VARCHAR(191) NOT NULL,
    `meetingType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Waiting',
    `area` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `dob` DATETIME(3) NULL,
    `resumeUrl` VARCHAR(2048) NULL,
    `salaryExpectation` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Meeting_mid_key`(`mid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `Meeting_userId_idx` ON `Meeting`(`userId`);

-- CreateIndex
CREATE INDEX `Meeting_jobId_idx` ON `Meeting`(`jobId`);

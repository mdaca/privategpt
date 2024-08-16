CREATE TABLE `stores` (
  `useName` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `userId` text NOT NULL,
  `id` text NOT NULL,
  `createdAt` text NOT NULL,
  `isDeleted` tinyint NOT NULL DEFAULT '0',
  `isPrivate` tinyint NOT NULL DEFAULT '1',
  `collectionName` text NOT NULL,
  `collectionDesc` text NULL,
  `collectionPrompt` text NULL,
  `storeType` text NOT NULL
);
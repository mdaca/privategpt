CREATE TABLE `threads` (
  `name` text NOT NULL,
  `useName` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `userId` text NOT NULL,
  `model` tinytext NOT NULL,
  `id` text NOT NULL,
  `createdAt` text NOT NULL,
  `isDeleted` tinyint NOT NULL DEFAULT '0',
  `type` text NOT NULL,
  `collectionName` text NULL,
  `category` text NULL
);
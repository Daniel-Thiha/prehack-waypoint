/*
  Warnings:

  - You are about to drop the column `roomId` on the `RoomStroke` table. All the data in the column will be lost.
  - Added the required column `roomCode` to the `RoomStroke` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoomStroke" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomCode" TEXT NOT NULL,
    "data" TEXT NOT NULL
);
INSERT INTO "new_RoomStroke" ("data", "id") SELECT "data", "id" FROM "RoomStroke";
DROP TABLE "RoomStroke";
ALTER TABLE "new_RoomStroke" RENAME TO "RoomStroke";
CREATE INDEX "RoomStroke_roomCode_idx" ON "RoomStroke"("roomCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

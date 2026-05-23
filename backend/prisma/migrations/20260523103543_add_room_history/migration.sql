-- CreateTable
CREATE TABLE "RoomHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RoomHistory_userId_joinedAt_idx" ON "RoomHistory"("userId", "joinedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RoomHistory_userId_roomCode_key" ON "RoomHistory"("userId", "roomCode");

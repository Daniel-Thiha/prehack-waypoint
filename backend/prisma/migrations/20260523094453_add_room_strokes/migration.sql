-- CreateTable
CREATE TABLE "RoomStroke" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    CONSTRAINT "RoomStroke_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

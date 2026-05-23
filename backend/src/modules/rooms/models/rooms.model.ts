import { prisma } from "../../../db";

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createRoom(
  name: string,
  ownerId: string,
  options: { isPrivate?: boolean; passcode?: string } = {}
) {
  let code = generateCode();
  while (await prisma.room.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const room = await prisma.room.create({
    data: {
      name,
      code,
      ownerId,
      isPrivate: options.isPrivate ?? false,
      passcode: options.isPrivate ? (options.passcode ?? null) : null,
      members: { create: { userId: ownerId } },
    },
    include: { owner: { select: { id: true, username: true } } },
  });

  return room;
}

export async function joinRoom(code: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!room) {
    throw Object.assign(new Error("Room not found"), { status: 404 });
  }

  const existing = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId: room.id } },
  });
  if (!existing) {
    await prisma.roomMember.create({ data: { userId, roomId: room.id } });
  }

  return prisma.room.findUnique({
    where: { id: room.id },
    include: { owner: { select: { id: true, username: true } } },
  });
}

export async function getUserRooms(userId: string) {
  return prisma.room.findMany({
    where: { members: { some: { userId } } },
    include: {
      owner: { select: { id: true, username: true } },
      members: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function leaveRoom(roomId: string, userId: string) {
  await prisma.roomMember.deleteMany({ where: { roomId, userId } });
}

export async function getRoomByCode(code: string) {
  return prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      owner: { select: { id: true, username: true } },
      members: { include: { user: { select: { id: true, username: true } } } },
    },
  });
}

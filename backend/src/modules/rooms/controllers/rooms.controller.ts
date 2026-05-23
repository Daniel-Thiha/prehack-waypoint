import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../../middlewares/auth.middleware";
import { createRoom, joinRoom, getUserRooms, leaveRoom, getRoomByCode } from "../models/rooms.model";
import { prisma } from "../../../db";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, isPrivate, passcode } = req.body as { name?: string; isPrivate?: boolean; passcode?: string };
    if (!name || name.trim().length < 1) {
      throw Object.assign(new Error("Room name is required"), { status: 400 });
    }
    const room = await createRoom(name.trim(), req.user!.userId, { isPrivate, passcode });
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
}

export async function join(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body as { code?: string };
    if (!code) throw Object.assign(new Error("Room code is required"), { status: 400 });
    const room = await joinRoom(code.trim(), req.user!.userId);
    res.json(room);
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rooms = await getUserRooms(req.user!.userId);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
}

export async function leave(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const roomId = String(req.params.roomId);
    await leaveRoom(roomId, req.user!.userId);
    res.json({ message: "Left room" });
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const code = String(req.params.code);
    const room = await getRoomByCode(code);
    if (!room) throw Object.assign(new Error("Room not found"), { status: 404 });
    const isMember = room.members.some((m) => m.userId === req.user!.userId);
    if (!isMember) throw Object.assign(new Error("Not a member of this room"), { status: 403 });
    res.json(room);
  } catch (err) {
    next(err);
  }
}

export async function logHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, name } = req.body as { code?: string; name?: string };
    if (!code || !name) throw Object.assign(new Error("code and name required"), { status: 400 });
    await prisma.roomHistory.upsert({
      where: { userId_roomCode: { userId: req.user!.userId, roomCode: code.toUpperCase() } },
      create: { userId: req.user!.userId, roomCode: code.toUpperCase(), roomName: name },
      update: { roomName: name, joinedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.roomHistory.findMany({
      where: { userId: req.user!.userId },
      orderBy: { joinedAt: "desc" },
    });
    res.json(rows.map((r) => ({ code: r.roomCode, name: r.roomName, visitedAt: r.joinedAt.getTime() })));
  } catch (err) {
    next(err);
  }
}

// Public — no auth required
export async function verifyRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const code = String(req.params.code).toUpperCase();
    const room = await prisma.room.findUnique({
      where: { code },
      select: { id: true, name: true, code: true, isPrivate: true },
    });
    if (!room) {
      res.status(404).json({ exists: false });
      return;
    }
    res.json({ exists: true, ...room });
  } catch (err) {
    next(err);
  }
}

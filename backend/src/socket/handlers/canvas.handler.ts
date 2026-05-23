import type { Socket, Server } from "socket.io";
import type { Stroke } from "../types";
import { prisma } from "../../db";

// In-memory cache keyed by room code — warmed from DB on first join
const roomCache = new Map<string, Stroke[]>();

export async function registerCanvasHandlers(io: Server, socket: Socket, roomCode: string) {
  if (!roomCache.has(roomCode)) {
    const rows = await prisma.roomStroke.findMany({ where: { roomCode } });
    roomCache.set(roomCode, rows.map((r) => JSON.parse(r.data) as Stroke));
  }

  socket.emit("canvas:state", roomCache.get(roomCode));

  socket.on("canvas:stroke", async (stroke: Stroke) => {
    try {
      const strokes = roomCache.get(roomCode)!;
      strokes.push(stroke);
      await prisma.roomStroke.upsert({
        where: { id: stroke.id },
        create: { id: stroke.id, roomCode, data: JSON.stringify(stroke) },
        update: { data: JSON.stringify(stroke) },
      });
      socket.to(roomCode).emit("canvas:stroke", stroke);
    } catch (err) {
      console.error("[canvas:stroke]", err);
    }
  });

  socket.on("canvas:undo", async (strokeId: string) => {
    try {
      const strokes = roomCache.get(roomCode);
      if (!strokes) return;
      const idx = strokes.findLastIndex((s) => s.id === strokeId);
      if (idx !== -1) {
        strokes.splice(idx, 1);
        await prisma.roomStroke.deleteMany({ where: { id: strokeId } });
        socket.to(roomCode).emit("canvas:state", strokes);
      }
    } catch (err) {
      console.error("[canvas:undo]", err);
    }
  });

  socket.on("canvas:move", async ({ id, dx, dy }: { id: string; dx: number; dy: number }) => {
    try {
      const strokes = roomCache.get(roomCode);
      if (!strokes) return;
      const stroke = strokes.find((s) => s.id === id);
      if (stroke) {
        stroke.points = stroke.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        await prisma.roomStroke.upsert({
          where: { id },
          create: { id, roomCode, data: JSON.stringify(stroke) },
          update: { data: JSON.stringify(stroke) },
        });
        socket.to(roomCode).emit("canvas:move", { id, dx, dy });
      }
    } catch (err) {
      console.error("[canvas:move]", err);
    }
  });

  socket.on("canvas:clear", async () => {
    try {
      roomCache.set(roomCode, []);
      await prisma.roomStroke.deleteMany({ where: { roomCode } });
      io.to(roomCode).emit("canvas:clear");
    } catch (err) {
      console.error("[canvas:clear]", err);
    }
  });
}

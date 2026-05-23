import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { registerCanvasHandlers } from "./handlers/canvas.handler";
import { registerCursorHandlers } from "./handlers/cursor.handler";
import { registerChatHandlers } from "./handlers/chat.handler";
import { registerVoiceHandlers } from "./handlers/voice.handler";

const CURSOR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

function parseCookies(cookieHeader = ""): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
}

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: [process.env.ALLOW_ORIGIN!], credentials: true },
  });

  // Allow both authenticated users and guests
  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies["token"];

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
          username: string;
        };
        socket.data.userId = payload.userId;
        socket.data.username = payload.username;
        socket.data.isGuest = false;
        return next();
      } catch {
        // invalid token — fall through to guest
      }
    }

    // Guest connection
    const guestNum = Math.floor(Math.random() * 9000) + 1000;
    socket.data.userId = `guest_${socket.id}`;
    socket.data.username = `Guest${guestNum}`;
    socket.data.isGuest = true;
    next();
  });

  const roomColorIndex = new Map<string, number>();

  io.on("connection", (socket) => {
    const { userId, username } = socket.data as { userId: string; username: string };

    socket.on("room:join", async (payload: { code: string; displayName?: string; color?: string; passcode?: string } | string) => {
      // Support legacy string payload
      const roomCode = (typeof payload === "string" ? payload : payload.code).toUpperCase();
      const displayName = typeof payload === "object" ? payload.displayName : undefined;
      const preferredColor = typeof payload === "object" ? payload.color : undefined;
      const passcode = typeof payload === "object" ? payload.passcode : undefined;

      // Verify room exists and check passcode for private rooms
      const room = await prisma.room.findUnique({
        where: { code: roomCode },
        select: { isPrivate: true, passcode: true },
      });

      if (!room) {
        socket.emit("room:error", { code: "NOT_FOUND", message: "Room not found" });
        return;
      }

      if (room.isPrivate && room.passcode && room.passcode !== passcode) {
        socket.emit("room:error", { code: "WRONG_PASSCODE", message: "Incorrect passcode" });
        return;
      }

      // Override username with displayName if provided
      if (displayName?.trim()) {
        socket.data.username = displayName.trim();
      }

      socket.join(roomCode);

      const color = preferredColor ?? CURSOR_COLORS[(roomColorIndex.get(roomCode) ?? 0) % CURSOR_COLORS.length];
      if (!preferredColor) {
        roomColorIndex.set(roomCode, (roomColorIndex.get(roomCode) ?? 0) + 1);
      }

      socket.data.roomCode = roomCode;
      socket.data.color = color;

      const effectiveUsername = socket.data.username as string;

      socket.to(roomCode).emit("room:user-joined", {
        socketId: socket.id,
        userId,
        username: effectiveUsername,
        color,
      });

      const roomSockets = io.sockets.adapter.rooms.get(roomCode);
      const peers: Array<{ socketId: string; userId: string; username: string; color: string }> = [];
      if (roomSockets) {
        for (const sid of roomSockets) {
          if (sid !== socket.id) {
            const peer = io.sockets.sockets.get(sid);
            if (peer) {
              peers.push({
                socketId: sid,
                userId: peer.data.userId,
                username: peer.data.username,
                color: peer.data.color,
              });
            }
          }
        }
      }
      socket.emit("room:peers", { peers, myColor: color });

      await registerCanvasHandlers(io, socket, roomCode);
      registerCursorHandlers(socket, roomCode);
      registerChatHandlers(io, socket, roomCode);
      registerVoiceHandlers(socket, roomCode);
    });

    socket.on("room:leave", () => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (roomCode) {
        socket.leave(roomCode);
        socket.to(roomCode).emit("room:user-left", { socketId: socket.id, userId, username });
      }
    });

    socket.on("disconnecting", () => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (roomCode) {
        socket.to(roomCode).emit("room:user-left", { socketId: socket.id, userId, username });
      }
    });
  });

  return io;
}

import type { Socket, Server } from "socket.io";
import type { ChatMessage } from "../types";

export function registerChatHandlers(io: Server, socket: Socket, roomId: string) {
  socket.on("chat:message", (text: string) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId: (socket.data as { userId: string }).userId,
      username: (socket.data as { username: string }).username,
      text: String(text).slice(0, 500),
      timestamp: Date.now(),
    };
    io.to(roomId).emit("chat:message", message);
  });
}

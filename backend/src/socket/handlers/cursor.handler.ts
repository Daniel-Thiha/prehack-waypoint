import type { Socket } from "socket.io";

export function registerCursorHandlers(socket: Socket, roomId: string) {
  socket.on("cursor:move", (data: { x: number; y: number }) => {
    socket.to(roomId).emit("cursor:move", {
      socketId: socket.id,
      ...data,
    });
  });
}

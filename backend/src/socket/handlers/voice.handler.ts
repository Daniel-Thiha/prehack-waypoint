import type { Socket } from "socket.io";

export function registerVoiceHandlers(socket: Socket, roomId: string) {
  socket.on("voice:offer", (data: { to: string; offer: RTCSessionDescriptionInit }) => {
    socket.to(data.to).emit("voice:offer", {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on("voice:answer", (data: { to: string; answer: RTCSessionDescriptionInit }) => {
    socket.to(data.to).emit("voice:answer", {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on("voice:ice-candidate", (data: { to: string; candidate: RTCIceCandidateInit }) => {
    socket.to(data.to).emit("voice:ice-candidate", {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  socket.on("voice:toggle", (enabled: boolean) => {
    socket.to(roomId).emit("voice:peer-toggle", {
      socketId: socket.id,
      enabled,
    });
  });
}

import type { Socket } from "socket.io";

// In-memory voice channel presence per room
const roomVoiceParticipants = new Map<string, Set<string>>();

function leaveVoice(socket: Socket, roomCode: string) {
  const participants = roomVoiceParticipants.get(roomCode);
  if (participants?.has(socket.id)) {
    participants.delete(socket.id);
    if (participants.size === 0) roomVoiceParticipants.delete(roomCode);
    socket.to(roomCode).emit("voice:peer-left", { socketId: socket.id });
  }
}

export function registerVoiceHandlers(socket: Socket, roomCode: string) {
  // Signaling relay — server never inspects SDP/ICE, just forwards
  socket.on("voice:offer", (data: { to: string; offer: RTCSessionDescriptionInit }) => {
    socket.to(data.to).emit("voice:offer", { from: socket.id, offer: data.offer });
  });

  socket.on("voice:answer", (data: { to: string; answer: RTCSessionDescriptionInit }) => {
    socket.to(data.to).emit("voice:answer", { from: socket.id, answer: data.answer });
  });

  socket.on("voice:ice-candidate", (data: { to: string; candidate: RTCIceCandidateInit }) => {
    socket.to(data.to).emit("voice:ice-candidate", { from: socket.id, candidate: data.candidate });
  });

  socket.on("voice:toggle", (enabled: boolean) => {
    socket.to(roomCode).emit("voice:peer-toggle", { socketId: socket.id, enabled });
  });

  // Voice channel presence
  socket.on("voice:join", () => {
    if (!roomVoiceParticipants.has(roomCode)) {
      roomVoiceParticipants.set(roomCode, new Set());
    }
    const participants = roomVoiceParticipants.get(roomCode)!;
    // Tell joiner who is already in voice (they'll send us offers)
    socket.emit("voice:participants", { socketIds: [...participants] });
    participants.add(socket.id);
    // Tell existing voice participants a newcomer arrived (they send the offer)
    socket.to(roomCode).emit("voice:peer-joined", { socketId: socket.id });
  });

  // Clean up on all exit paths
  socket.on("voice:leave", () => leaveVoice(socket, roomCode));
  socket.on("room:leave", () => leaveVoice(socket, roomCode));
  socket.on("disconnecting", () => leaveVoice(socket, roomCode));
}

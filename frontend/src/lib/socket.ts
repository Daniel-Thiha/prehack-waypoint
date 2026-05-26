import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function initSocket(url: string = import.meta.env.VITE_API_URL || "http://localhost:5000"): Socket {
  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(url, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    autoConnect: false,
    withCredentials: true,
  });

  socketInstance.on("connect", () => {
    console.log("Socket connected:", socketInstance?.id);
  });

  socketInstance.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socketInstance.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socketInstance;
}

export function getSocket(): Socket {
  if (!socketInstance) {
    throw new Error("Socket not initialized. Call initSocket first.");
  }
  return socketInstance;
}

export function closeSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

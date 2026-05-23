import api from "../../../api";
import type { Room } from "../types/rooms.types";

export const getRooms = () => api.get<Room[]>("/rooms").then((r) => r.data);

export const createRoom = (name: string, options: { isPrivate?: boolean; passcode?: string } = {}) =>
  api.post<Room>("/rooms", { name, ...options }).then((r) => r.data);

export const joinRoom = (code: string) =>
  api.post<Room>("/rooms/join", { code }).then((r) => r.data);

export const leaveRoom = (roomId: string) =>
  api.delete(`/rooms/${roomId}/leave`).then((r) => r.data);

export interface HistoryEntry {
  code: string;
  name: string;
  visitedAt: number;
}

export const fetchRoomHistory = () =>
  api.get<HistoryEntry[]>("/rooms/history").then((r) => r.data);

export const logRoomHistory = (code: string, name: string) =>
  api.post("/rooms/history", { code, name }).catch(() => {}); // fire-and-forget, don't crash on failure

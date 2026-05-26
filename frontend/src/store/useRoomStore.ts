import { create } from "zustand";

interface RoomMember {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  color: string;
  role: "owner" | "member";
  lastSeen: string;
  isAFK: boolean;
}

interface Room {
  id: string;
  slug: string;
  name: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
}

interface RoomStore {
  room: Room | null;
  members: RoomMember[];
  setRoom: (room: Room) => void;
  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  updateMember: (userId: string, updates: Partial<RoomMember>) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  members: [],

  setRoom: (room: Room) =>
    set({
      room,
    }),

  setMembers: (members: RoomMember[]) =>
    set({
      members,
    }),

  addMember: (member: RoomMember) =>
    set((state) => ({
      members: [...state.members.filter((m) => m.userId !== member.userId), member],
    })),

  removeMember: (userId: string) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),

  updateMember: (userId: string, updates: Partial<RoomMember>) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, ...updates } : m
      ),
    })),

  leaveRoom: () =>
    set({
      room: null,
      members: [],
    }),
}));

import { create } from "zustand";

interface VoiceStore {
  isMuted: boolean;
  isDeafened: boolean;
  speakingUsers: Set<string>;
  localStream: MediaStream | null;

  setMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
  addSpeakingUser: (userId: string) => void;
  removeSpeakingUser: (userId: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isMuted: false,
  isDeafened: false,
  speakingUsers: new Set(),
  localStream: null,

  setMuted: (muted: boolean) =>
    set({
      isMuted: muted,
    }),

  setDeafened: (deafened: boolean) =>
    set({
      isDeafened: deafened,
      isMuted: deafened ? true : undefined,
    }),

  addSpeakingUser: (userId: string) =>
    set((state) => {
      const newSet = new Set(state.speakingUsers);
      newSet.add(userId);
      return { speakingUsers: newSet };
    }),

  removeSpeakingUser: (userId: string) =>
    set((state) => {
      const newSet = new Set(state.speakingUsers);
      newSet.delete(userId);
      return { speakingUsers: newSet };
    }),

  setLocalStream: (stream: MediaStream | null) =>
    set({
      localStream: stream,
    }),
}));

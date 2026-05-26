import { create } from "zustand";
import { Point } from "../tools/types";

interface Cursor {
  userId: string;
  x: number;
  y: number;
  username: string;
  color: string;
  avatar: string;
  activeMode: string | null;
  isAFK: boolean;
}

interface CursorStore {
  cursors: Map<string, Cursor>;
  setCursor: (userId: string, cursor: Cursor) => void;
  removeCursor: (userId: string) => void;
  setAFK: (userId: string, isAFK: boolean) => void;
}

export const useCursorStore = create<CursorStore>((set) => ({
  cursors: new Map(),

  setCursor: (userId: string, cursor: Cursor) =>
    set((state) => {
      const newCursors = new Map(state.cursors);
      newCursors.set(userId, cursor);
      return { cursors: newCursors };
    }),

  removeCursor: (userId: string) =>
    set((state) => {
      const newCursors = new Map(state.cursors);
      newCursors.delete(userId);
      return { cursors: newCursors };
    }),

  setAFK: (userId: string, isAFK: boolean) =>
    set((state) => {
      const newCursors = new Map(state.cursors);
      const cursor = newCursors.get(userId);
      if (cursor) {
        newCursors.set(userId, { ...cursor, isAFK });
      }
      return { cursors: newCursors };
    }),
}));

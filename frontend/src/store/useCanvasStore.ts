import { create } from "zustand";
import { Stroke, Point } from "../tools/types";

interface CanvasStore {
  strokes: Stroke[];
  inProgressStroke: Stroke | null;
  viewport: { x: number; y: number; scale: number };

  addStroke: (stroke: Stroke) => void;
  removeStroke: (id: string) => void;
  updateStroke: (id: string, updates: Partial<Stroke>) => void;
  setStrokes: (strokes: Stroke[]) => void;

  setInProgressStroke: (stroke: Stroke | null) => void;

  setViewport: (viewport: { x: number; y: number; scale: number }) => void;
  panViewport: (dx: number, dy: number) => void;
  zoomViewport: (scale: number, centerX: number, centerY: number) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  strokes: [],
  inProgressStroke: null,
  viewport: { x: 0, y: 0, scale: 1 },

  addStroke: (stroke: Stroke) =>
    set((state) => ({
      strokes: [...state.strokes, stroke],
    })),

  removeStroke: (id: string) =>
    set((state) => ({
      strokes: state.strokes.filter((s) => s.id !== id),
    })),

  updateStroke: (id: string, updates: Partial<Stroke>) =>
    set((state) => ({
      strokes: state.strokes.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  setStrokes: (strokes: Stroke[]) =>
    set({
      strokes,
    }),

  setInProgressStroke: (stroke: Stroke | null) =>
    set({
      inProgressStroke: stroke,
    }),

  setViewport: (viewport) =>
    set({
      viewport,
    }),

  panViewport: (dx: number, dy: number) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + dx,
        y: state.viewport.y + dy,
      },
    })),

  zoomViewport: (scale: number, centerX: number, centerY: number) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        scale,
      },
    })),
}));

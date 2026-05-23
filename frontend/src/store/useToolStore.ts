import { create } from "zustand";
import { Tool } from "../tools/types";
import { toolRegistry } from "../tools/registry";

interface ToolStore {
  activeTool: Tool | null;
  activeMode: string | null;
  selectedElements: string[];
  setActiveTool: (tool: Tool) => void;
  setActiveMode: (mode: string | null) => void;
  setSelectedElements: (ids: string[]) => void;
  addSelectedElement: (id: string) => void;
  removeSelectedElement: (id: string) => void;
  clearSelection: () => void;
}

export const useToolStore = create<ToolStore>((set) => ({
  activeTool: null,
  activeMode: null,
  selectedElements: [],

  setActiveTool: (tool: Tool) =>
    set((state) => ({
      activeTool: tool,
      activeMode: tool.mode === "universal" ? state.activeMode : tool.mode,
    })),

  setActiveMode: (mode: string | null) =>
    set({
      activeMode: mode,
      activeTool: null,
    }),

  setSelectedElements: (ids: string[]) =>
    set({
      selectedElements: ids,
    }),

  addSelectedElement: (id: string) =>
    set((state) => ({
      selectedElements: [...new Set([...state.selectedElements, id])],
    })),

  removeSelectedElement: (id: string) =>
    set((state) => ({
      selectedElements: state.selectedElements.filter((id2) => id2 !== id),
    })),

  clearSelection: () =>
    set({
      selectedElements: [],
    }),
}));

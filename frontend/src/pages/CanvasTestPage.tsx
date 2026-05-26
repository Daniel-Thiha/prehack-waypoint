import React, { useState, useEffect } from "react";
import { KonvaCanvas } from "../components/canvas/KonvaCanvas";
import { useToolStore } from "../store/useToolStore";
import { useCursorStore } from "../store/useCursorStore";
import { universalTools } from "../tools/universal/tools";
import { toolRegistry } from "../tools/registry";
import { MODES } from "../tools/types";

export const CanvasTestPage: React.FC = () => {
  const { activeTool, setActiveTool, activeMode, setActiveMode } = useToolStore();
  const [modeTools, setModeTools] = useState<any[]>([]);

  useEffect(() => {
    setActiveTool(universalTools[1]); // Start with pen
  }, [setActiveTool]);

  async function handleModeSelect(modeId: string) {
    if (activeMode === modeId) {
      setActiveMode(null);
      return;
    }

    const tools = await toolRegistry.loadModeTools(modeId);
    setModeTools(tools);
    setActiveMode(modeId);
  }

  const modeArray = Object.values(MODES);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950">
      {/* Top toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center gap-2">
        <div className="flex gap-1 bg-slate-800 rounded p-1">
          {universalTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool)}
              className={`px-3 py-2 rounded text-sm transition ${
                activeTool?.id === tool.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
              title={tool.name}
            >
              {tool.icon} {tool.name}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* Modes */}
        <div className="flex gap-1">
          {modeArray.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className={`px-3 py-2 rounded text-sm transition ${
                activeMode === mode.id
                  ? "text-white"
                  : "text-slate-300 hover:text-slate-100"
              }`}
              style={{
                backgroundColor:
                  activeMode === mode.id ? mode.accent + "33" : "transparent",
                border: activeMode === mode.id ? `1px solid ${mode.accent}` : "1px solid transparent",
              }}
              title={mode.name}
            >
              {mode.icon} {mode.name}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Active tool info */}
        <div className="text-xs text-slate-400">
          {activeTool && (
            <>
              Active: <span className="text-slate-200">{activeTool.name}</span>
              {activeMode && (
                <>
                  {" "}
                  in <span className="text-slate-200">{MODES[activeMode]?.name}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <KonvaCanvas />
      </div>

      {/* Mode tools sidebar (if mode active) */}
      {activeMode && modeTools.length > 0 && (
        <div
          className="fixed right-4 bottom-4 bg-slate-900 border rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto"
          style={{
            backgroundColor: MODES[activeMode].bg,
            borderColor: MODES[activeMode].accent,
          }}
        >
          <h3 className="text-sm font-bold mb-2" style={{ color: MODES[activeMode].accent }}>
            {MODES[activeMode].name}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {modeTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool)}
                className={`px-2 py-2 rounded text-xs transition text-center ${
                  activeTool?.id === tool.id
                    ? "bg-white/20 font-semibold"
                    : "bg-white/10 hover:bg-white/15"
                }`}
                title={tool.description}
              >
                {tool.icon}
                <div>{tool.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 text-slate-300 text-xs p-3 rounded border border-slate-700 max-w-xs">
        <div className="font-semibold mb-1">Foundation Demo</div>
        <ul className="space-y-1 list-disc pl-4">
          <li>Select a universal tool (left toolbar)</li>
          <li>Draw on canvas with mouse</li>
          <li>Select a mode to load mode-specific tools</li>
          <li>Mode tools appear bottom-right</li>
        </ul>
      </div>
    </div>
  );
};

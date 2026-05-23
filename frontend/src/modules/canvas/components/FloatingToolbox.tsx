import { useEffect, useRef, useState } from "react";
import { MODES } from "../../../tools/types";
import type { Tool } from "../../../tools/types";
import { toolRegistry } from "../../../tools/registry";

interface FloatingToolboxProps {
  modeId: string;
  activeModeToolId: string | null;
  onToolSelect: (toolId: string | null) => void;
  onClose: () => void;
}

const FloatingToolbox = ({
  modeId,
  activeModeToolId,
  onToolSelect,
  onClose,
}: FloatingToolboxProps) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [pos, setPos] = useState({ x: 80, y: 100 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const mode = MODES[modeId];

  useEffect(() => {
    toolRegistry.loadModeTools(modeId).then(setTools);
  }, [modeId]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const onMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  };

  if (!mode) return null;

  return (
    <div
      style={{ left: pos.x, top: pos.y, position: "fixed", zIndex: 50 }}
      className="w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden select-none"
    >
      {/* Drag handle / header */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing border-b border-gray-800"
        style={{ backgroundColor: mode.accent + "22" }}
      >
        <span className="text-base leading-none">{mode.icon}</span>
        <span
          className="text-xs font-semibold flex-1 truncate"
          style={{ color: mode.accent }}
        >
          {mode.name}
        </span>
        <button
          onClick={onClose}
          title="Close toolbox"
          className="text-gray-500 hover:text-white transition-colors shrink-0"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-3.5 h-3.5"
          >
            <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Tool list */}
      <div className="flex flex-col gap-0.5 p-1.5 max-h-96 overflow-y-auto">
        {tools.length === 0 ? (
          <p className="text-center text-[11px] text-gray-600 py-4">
            Loading…
          </p>
        ) : (
          tools.map((tool) => {
            const isActive = activeModeToolId === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(isActive ? null : tool.id)}
                title={tool.description ?? tool.name}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
                style={
                  isActive
                    ? {
                        backgroundColor: mode.accent + "2e",
                        color: mode.accent,
                      }
                    : {}
                }
              >
                <span
                  className={`w-5 text-center text-base leading-none ${
                    isActive ? "" : "text-gray-400"
                  }`}
                >
                  {tool.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-medium truncate ${
                      isActive ? "" : "text-gray-300"
                    }`}
                  >
                    {tool.name}
                  </span>
                  {tool.description && (
                    <span className="text-[10px] text-gray-500 truncate">
                      {tool.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FloatingToolbox;

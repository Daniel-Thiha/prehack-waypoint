import { useEffect, useRef, useState } from "react";
import type { ToolType } from "../types/canvas.types";
import { MODES } from "../../../tools/types";

interface ToolbarProps {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  stickyBg: string;
  activeMode: string | null;
  onToolChange: (t: ToolType) => void;
  onColorChange: (c: string) => void;
  onWidthChange: (w: number) => void;
  onStickyBgChange: (c: string) => void;
  onImageFile: (dataUrl: string) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onModeChange: (mode: string | null) => void;
}

const TOOLS: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select (V)", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M3 2l14 8-7 1.5L8 18 3 2z" />
    </svg>
  )},
  { id: "pen", label: "Pen (P)", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M13 3l4 4-9 9H4v-4l9-9z" strokeLinejoin="round" />
    </svg>
  )},
  { id: "eraser", label: "Eraser (E)", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M3 17h14M6 17L3 11l9-8 5 5-8 9H6z" strokeLinejoin="round" />
    </svg>
  )},
  { id: "line", label: "Line (L)", icon: (
    <svg viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="3" y1="17" x2="17" y2="3" strokeLinecap="round" />
    </svg>
  )},
  { id: "rect", label: "Rectangle (R)", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <rect x="3" y="5" width="14" height="10" rx="1" />
    </svg>
  )},
  { id: "circle", label: "Ellipse (C)", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <ellipse cx="10" cy="10" rx="7" ry="5" />
    </svg>
  )},
  { id: "sticky", label: "Sticky Note (S)", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M4 4h12v8l-4 4H4V4z" strokeLinejoin="round" />
      <path d="M12 12v4l4-4h-4z" fill="currentColor" fillOpacity="0.3" strokeLinejoin="round" />
    </svg>
  )},
  { id: "text", label: "Text (T)", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M3 4h14v2.5H11.5V16h-3V6.5H3V4z" />
    </svg>
  )},
  { id: "image", label: "Image", icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <rect x="2" y="4" width="16" height="12" rx="1.5" />
      <circle cx="7" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M2 14l4-4 3 3 3-3 6 5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )},
];

const DRAW_COLORS = [
  "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6",
  "#ec4899", "#000000",
];

const STICKY_COLORS = [
  "#fef08a", "#fda4af", "#86efac", "#93c5fd",
  "#d8b4fe", "#fed7aa", "#6ee7b7", "#f9a8d4",
];

const WIDTHS = [
  { value: 2, label: "Thin" },
  { value: 5, label: "Medium" },
  { value: 10, label: "Thick" },
  { value: 20, label: "XL" },
];

const hasColorPanel = (t: ToolType) => ["pen", "line", "rect", "circle", "text"].includes(t);
const hasWidthPanel = (t: ToolType) => ["pen", "line", "rect", "circle"].includes(t);
const hasStickyPanel = (t: ToolType) => t === "sticky";
const hasImagePanel = (t: ToolType) => t === "image";

const Toolbar = ({ tool, color, strokeWidth, stickyBg, activeMode, onToolChange, onColorChange, onWidthChange, onStickyBgChange, onImageFile, onClear, onUndo, onRedo, onModeChange }: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modePickerRef = useRef<HTMLDivElement>(null);
  const [modePickerOpen, setModePickerOpen] = useState(false);

  useEffect(() => {
    if (!modePickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modePickerRef.current && !modePickerRef.current.contains(e.target as Node)) {
        setModePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modePickerOpen]);
  const showSubPanel = hasColorPanel(tool) || hasWidthPanel(tool) || hasStickyPanel(tool) || hasImagePanel(tool);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) onImageFile(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-row shrink-0 relative">

      {/* Main icon strip */}
      <div className="flex flex-col p-1.5 bg-gray-900 border-r border-gray-800 w-12 items-center overflow-y-auto">
        <div className="flex flex-col gap-0.5 w-full">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => onToolChange(t.id)}
              title={t.label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors mx-auto ${
                tool === t.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-7 h-px bg-gray-700 my-2 shrink-0" />

        <div className="flex flex-col gap-0.5 w-full">
          <button
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors mx-auto"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M4 8H12a4 4 0 0 1 0 8H8" strokeLinecap="round" />
              <path d="M4 8l3-3M4 8l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors mx-auto"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M16 8H8a4 4 0 0 0 0 8h4" strokeLinecap="round" />
              <path d="M16 8l-3-3M16 8l-3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mt-auto pt-2 flex flex-col gap-0.5 w-full items-center">
          {/* Modes button */}
          <button
            onClick={() => setModePickerOpen((o) => !o)}
            title={activeMode ? `Mode: ${MODES[activeMode]?.name}` : "Select mode toolbox"}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors mx-auto text-base leading-none ${
              activeMode
                ? "ring-1 ring-inset"
                : modePickerOpen
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            style={
              activeMode
                ? {
                    backgroundColor: MODES[activeMode].accent + "22",
                    color: MODES[activeMode].accent,
                  }
                : {}
            }
          >
            {activeMode ? (
              MODES[activeMode].icon
            ) : (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                <rect x="3" y="3" width="5" height="5" rx="1" />
                <rect x="12" y="3" width="5" height="5" rx="1" />
                <rect x="3" y="12" width="5" height="5" rx="1" />
                <rect x="12" y="12" width="5" height="5" rx="1" />
              </svg>
            )}
          </button>

          <button
            onClick={onClear}
            title="Clear canvas"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-red-950 hover:text-red-400 transition-colors mx-auto"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mode picker popup — outside overflow container, positioned relative to toolbar wrapper */}
      {modePickerOpen && (
        <div ref={modePickerRef} className="absolute left-12 bottom-0 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-gray-800">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Mode Toolboxes
            </span>
          </div>
          <div className="flex flex-col gap-0.5 p-1.5">
            {Object.values(MODES).map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  onModeChange(activeMode === mode.id ? null : mode.id);
                  setModePickerOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-gray-800"
                style={
                  activeMode === mode.id
                    ? { backgroundColor: mode.accent + "2e", color: mode.accent }
                    : {}
                }
              >
                <span className="text-base leading-none w-5 text-center">
                  {mode.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-medium truncate ${
                      activeMode === mode.id ? "" : "text-gray-300"
                    }`}
                  >
                    {mode.name}
                  </span>
                  {mode.description && (
                    <span className="text-[10px] text-gray-500 truncate">
                      {mode.description}
                    </span>
                  )}
                </div>
                {activeMode === mode.id && (
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3 h-3 ml-auto shrink-0"
                  >
                    <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contextual sub-panel */}
      {showSubPanel && (
        <div className="flex flex-col gap-3 px-3 py-3 bg-gray-900/98 border-r border-gray-800 w-36 overflow-y-auto shrink-0">

          {hasColorPanel(tool) && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Color</span>
              <div className="grid grid-cols-5 gap-1.5">
                {DRAW_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onColorChange(c)}
                    title={c}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c ? "border-white scale-110" : "border-gray-700"
                    }`}
                  />
                ))}
              </div>

              {/* Active color preview */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-5 h-5 rounded-full border border-gray-600 shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-gray-500 font-mono truncate">{color}</span>
              </div>
            </div>
          )}

          {hasColorPanel(tool) && hasWidthPanel(tool) && (
            <div className="w-full h-px bg-gray-800" />
          )}

          {hasWidthPanel(tool) && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Width</span>
              {WIDTHS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onWidthChange(value)}
                  title={`${label} — ${value}px`}
                  className={`w-full h-7 flex items-center gap-2.5 px-2 rounded-lg transition-colors ${
                    strokeWidth === value ? "bg-blue-600" : "hover:bg-gray-800"
                  }`}
                >
                  <div
                    className="rounded-full bg-white shrink-0"
                    style={{ width: Math.min(value * 1.6, 22), height: Math.max(value * 0.7, 1.5) }}
                  />
                  <span className="text-[11px] text-gray-300">{label}</span>
                </button>
              ))}
            </div>
          )}

          {hasStickyPanel(tool) && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Color</span>
              <div className="grid grid-cols-4 gap-1.5">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onStickyBgChange(c)}
                    title={c}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                      stickyBg === c ? "border-gray-200 scale-110" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {hasImagePanel(tool) && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                  <path d="M8 2v8M4 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12h12" strokeLinecap="round" />
                </svg>
                Upload file
              </button>
              <p className="text-[10px] text-gray-500 leading-tight">
                or paste image<br/>with Ctrl+V / ⌘V
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Toolbar;

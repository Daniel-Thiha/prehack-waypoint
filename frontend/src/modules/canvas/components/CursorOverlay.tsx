import type { CursorData } from "../types/canvas.types";

interface Viewport { x: number; y: number; scale: number; }

interface CursorOverlayProps {
  cursors: Map<string, CursorData>;
  viewport: Viewport;
}

const CursorOverlay = ({ cursors, viewport }: CursorOverlayProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from(cursors.values()).map((cursor) => {
        const sx = cursor.wx * viewport.scale + viewport.x;
        const sy = cursor.wy * viewport.scale + viewport.y;
        return (
          <div
            key={cursor.socketId}
            className="absolute flex flex-col items-start"
            style={{ left: sx, top: sy, transform: "translate(-2px, -2px)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M0 0L0 11L3 8L5.5 14L7 13.5L4.5 7.5L8 7.5L0 0Z"
                fill={cursor.color}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="0.5"
              />
            </svg>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
              style={{ backgroundColor: cursor.color, color: "#fff" }}
            >
              {cursor.username}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CursorOverlay;

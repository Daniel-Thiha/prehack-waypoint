import { useNavigate } from "react-router-dom";
import type { HistoryEntry } from "../utils/roomHistory";

interface HistoryPanelProps {
  open: boolean;
  onToggle: () => void;
  history: HistoryEntry[];
}

export default function HistoryPanel({ open, onToggle, history }: HistoryPanelProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Sliding panel */}
      <div
        className={`fixed right-0 top-0 h-full w-72 bg-gray-900 border-l border-gray-800 shadow-2xl z-30 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <h2 className="text-sm font-semibold text-white">Room History</h2>
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-white text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {history.length === 0 ? (
            <p className="text-gray-600 text-sm text-center pt-8">No rooms visited yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {history.map((entry) => (
                <li key={entry.code}>
                  <button
                    onClick={() => navigate(`/room/${entry.code}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                      <p className="text-xs text-gray-500 font-mono tracking-widest">{entry.code}</p>
                    </div>
                    <span className="text-xs text-gray-600 shrink-0">{formatRelative(entry.visitedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 sm:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

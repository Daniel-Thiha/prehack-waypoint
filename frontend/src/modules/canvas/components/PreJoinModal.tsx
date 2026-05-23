import { useState } from "react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

interface PreJoinModalProps {
  roomName: string;
  roomCode: string;
  isPrivate: boolean;
  defaultName: string;
  onJoin: (displayName: string, color: string, passcode?: string) => void;
}

export default function PreJoinModal({ roomName, roomCode, isPrivate, defaultName, onJoin }: PreJoinModalProps) {
  const [displayName, setDisplayName] = useState(defaultName);
  const [color, setColor] = useState(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) { setError("Enter a display name"); return; }
    if (isPrivate && !passcode.trim()) { setError("This room requires a passcode"); return; }
    setError("");
    onJoin(name, color, isPrivate ? passcode.trim() : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
        <div className="mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Joining room</p>
          <h2 className="text-xl font-bold text-white truncate">{roomName}</h2>
          <span className="text-xs font-mono text-gray-500 tracking-widest">{roomCode}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Display name */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Your name</label>
            <input
              autoFocus
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError(""); }}
              placeholder="Display name"
              maxLength={40}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-2">Cursor color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c,
                    ring: color === c ? `3px solid ${c}` : undefined,
                    outline: color === c ? `3px solid white` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Passcode (only for private rooms) */}
          {isPrivate && (
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                Room passcode <span className="text-red-400">*</span>
              </label>
              <input
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(""); }}
                placeholder="Enter passcode"
                type="password"
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm ${
                  error ? "border-red-500 focus:border-red-400" : "border-gray-700 focus:border-blue-500"
                }`}
              />
              {error && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
                  </svg>
                  {error}
                </p>
              )}
            </div>
          )}

          {/* General errors (non-passcode) */}
          {error && !isPrivate && <p className="text-red-400 text-sm -mt-2">{error}</p>}

          <button
            type="submit"
            disabled={!displayName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Join room
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useSpeakingDetector } from "../hooks/useSpeakingDetector";

interface VoicePeerChipProps {
  socketId: string;
  username: string;
  color: string;
  isSelf: boolean;
  muted: boolean;      // peer muted themselves
  volume: number;      // 0-1, our local volume override
  stream: MediaStream | null;
  onVolumeChange: (volume: number) => void;
}

export default function VoicePeerChip({
  username,
  color,
  isSelf,
  muted,
  volume,
  stream,
  onVolumeChange,
}: VoicePeerChipProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const speaking = useSpeakingDetector(stream);

  return (
    <div className="relative">
      <button
        onClick={() => !isSelf && setPopoverOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all ${
          speaking ? "ring-2 ring-green-400 ring-offset-1 ring-offset-gray-900" : ""
        }`}
        style={{ backgroundColor: color + "33", color }}
        title={isSelf ? "You" : username}
      >
        <span>{isSelf ? "🎤" : muted ? "🔇" : "🔊"}</span>
        <span className="max-w-[80px] truncate">{isSelf ? "You" : username}</span>
      </button>

      {popoverOpen && !isSelf && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setPopoverOpen(false)}
          />
          {/* Popover */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-gray-800 border border-gray-700 rounded-xl p-3 w-44 shadow-xl">
            <p className="text-xs text-gray-400 mb-2 truncate font-medium">{username}</p>

            {muted && (
              <p className="text-xs text-yellow-400 mb-2">Muted by self</p>
            )}

            <label className="text-xs text-gray-400 block mb-1">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
              className="w-full accent-blue-500"
            />

            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
              className="mt-2 w-full text-xs py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              {volume === 0 ? "Unmute for me" : "Mute for me"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

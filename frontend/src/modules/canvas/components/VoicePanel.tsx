import type { Socket } from "socket.io-client";
import type { Peer } from "../types/canvas.types";
import { useVoiceRoom } from "../hooks/useVoiceRoom";
import { useSpeakingDetector } from "../hooks/useSpeakingDetector";
import VoicePeerChip from "./VoicePeerChip";

interface VoicePanelProps {
  socket: Socket;
  peers: Peer[];
  mySocketId: string;
}

export default function VoicePanel({ socket, peers, mySocketId }: VoicePanelProps) {
  const {
    voiceJoined,
    micEnabled,
    pttActive,
    deafened,
    pttMode,
    peerMuted,
    peerVolumes,
    voicePeers,
    remoteStreams,
    localStream,
    micError,
    audioContainerRef,
    getPeerInfo,
    joinVoice,
    leaveVoice,
    toggleMic,
    toggleDeafen,
    togglePtt,
    acquireMicForPtt,
    setPeerVolume,
  } = useVoiceRoom({ socket, peers, mySocketId });

  const selfSpeaking = useSpeakingDetector(localStream);

  // Peers currently in voice, excluding self (self is shown separately)
  const otherVoicePeers = voicePeers.filter((id) => id !== mySocketId);

  return (
    <div className="border-t border-gray-800 bg-gray-900">
      {/* Hidden container so DOM-attached audio elements autoplay on Safari */}
      <div ref={audioContainerRef} className="hidden" />

      <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
        {!voiceJoined ? (
          <button
            onClick={joinVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            🎙 Join voice
          </button>
        ) : (
          <>
            {/* Leave */}
            <button
              onClick={leaveVoice}
              className="px-2 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-red-900/60 text-gray-400 hover:text-red-300 transition-colors"
              title="Leave voice"
            >
              Leave
            </button>

            {/* Mic / PTT button */}
            {pttMode ? (
              <button
                onClick={acquireMicForPtt}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pttActive
                    ? "bg-green-600 text-white"
                    : localStream
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-400"
                }`}
                title={localStream ? "PTT ready — hold SPACE" : "Click to allow mic access"}
              >
                🎙 {pttActive ? "Talking…" : localStream ? "PTT" : "Allow mic"}
              </button>
            ) : (
              <button
                onClick={toggleMic}
                title={micEnabled ? "Mute" : "Unmute"}
                className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  micEnabled || selfSpeaking
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                }`}
              >
                {/* Microphone icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <line x1="9" y1="21" x2="15" y2="21" />
                </svg>
                {/* Slash overlay when muted */}
                {!micEnabled && (
                  <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full" aria-hidden>
                    <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
                  </svg>
                )}
              </button>
            )}

            {/* Deafen */}
            <button
              onClick={toggleDeafen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                deafened
                  ? "bg-yellow-700 hover:bg-yellow-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
              title={deafened ? "Undeafen" : "Deafen (silence everyone + mute mic)"}
            >
              {deafened ? "🔇" : "🎧"}
            </button>

            {/* PTT toggle */}
            <button
              onClick={togglePtt}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pttMode
                  ? "bg-blue-700 text-blue-200"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-500"
              }`}
              title={pttMode ? "Switch to mic toggle mode" : "Switch to push-to-talk (SPACE)"}
            >
              {pttMode ? "PTT: SPACE" : "PTT"}
            </button>

            {/* Self chip */}
            <VoicePeerChip
              socketId={mySocketId}
              username="You"
              color="#3b82f6"
              isSelf
              muted={!micEnabled && !pttActive}
              volume={1}
              stream={localStream}
              onVolumeChange={() => {}}
            />

            {/* Other voice peers */}
            {otherVoicePeers.map((socketId) => {
              const info = getPeerInfo(socketId);
              const username = info?.username ?? socketId.slice(0, 6);
              const color = info?.color ?? "#6b7280";
              const savedVol = peerVolumes[username] ?? 1;
              return (
                <VoicePeerChip
                  key={socketId}
                  socketId={socketId}
                  username={username}
                  color={color}
                  isSelf={false}
                  muted={peerMuted[socketId] ?? false}
                  volume={savedVol}
                  stream={remoteStreams.get(socketId) ?? null}
                  onVolumeChange={(v) => setPeerVolume(socketId, v)}
                />
              );
            })}
          </>
        )}

        {/* Mic error toast */}
        {micError && (
          <span className="text-xs text-red-400 ml-2">{micError}</span>
        )}
      </div>
    </div>
  );
}

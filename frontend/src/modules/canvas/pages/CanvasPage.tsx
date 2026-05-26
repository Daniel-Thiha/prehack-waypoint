import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "../../../contexts/AuthContext";
import Canvas from "../components/Canvas";
import Toolbar from "../components/Toolbar";
import FloatingToolbox from "../components/FloatingToolbox";
import ChatPanel from "../components/ChatPanel";
import VoicePanel from "../components/VoicePanel";
import PreJoinModal from "../components/PreJoinModal";
import { logRoomHistory } from "../../rooms/apis/rooms.api";
import { getRoomPasscode } from "../../../utils/roomPasscodes";
import type { ToolType, ChatMessage, Peer } from "../types/canvas.types";

interface RoomInfo {
  name: string;
  isPrivate: boolean;
}

type Phase = "loading" | "prejoin" | "joined" | "not_found";

const CanvasPage = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const creatorState = location.state as { skipModal?: boolean; displayName?: string; cursorColor?: string; passcode?: string } | null;

  // Passcode embedded in invite link hash (#passcode)
  const urlHashPasscode = location.hash ? decodeURIComponent(location.hash.slice(1)) : undefined;

  const [phase, setPhase] = useState<Phase>("loading");
  const [roomInfo, setRoomInfo] = useState<RoomInfo>({ name: "", isPrivate: false });
  const [passcodeError, setPasscodeError] = useState("");
  const [ownerPasscode, setOwnerPasscode] = useState<string | null>(null);
  const [passcodeVisible, setPasscodeVisible] = useState(false);

  // Pre-join selections
  const [displayName, setDisplayName] = useState("");
  const [cursorColor, setCursorColor] = useState("#3b82f6");
  const [passcode, setPasscode] = useState<string | undefined>(undefined);

  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [stickyBg, setStickyBg] = useState("#fef08a");
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [activeModeToolId, setActiveModeToolId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [mySocketId, setMySocketId] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const undoCbRef = useRef<() => void>(() => {});
  const redoCbRef = useRef<() => void>(() => {});
  const clearCbRef = useRef<() => void>(() => {});
  const imageInsertRef = useRef<((url: string) => void) | null>(null);

  // Verify room exists (public endpoint — no auth needed)
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/rooms/verify/${code}`)
      .then((r) => r.json())
      .then((data: { exists?: boolean; name?: string; isPrivate?: boolean }) => {
        if (!data.exists) {
          setPhase("not_found");
        } else {
          setRoomInfo({ name: data.name ?? code ?? "", isPrivate: data.isPrivate ?? false });

          // Load stored passcode so the owner can see it in the header
          const stored = getRoomPasscode(user?.id, code!);
          if (stored) {
            setOwnerPasscode(stored);
            setPasscode(stored);
          } else if (urlHashPasscode) {
            // Invited via link with embedded passcode
            setPasscode(urlHashPasscode);
          }

          if (creatorState?.skipModal) {
            setDisplayName(creatorState.displayName ?? user?.username ?? "");
            setCursorColor(creatorState.cursorColor ?? "#3b82f6");
            if (creatorState.passcode) setPasscode(creatorState.passcode);
            if (user) logRoomHistory(code!, data.name ?? code ?? "");
            setPhase("joined");
          } else {
            setDisplayName(user?.username ?? "");
            setPhase("prejoin");
          }
        }
      })
      .catch(() => setPhase("not_found"));
  }, [code, user, creatorState, urlHashPasscode]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL as string, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setMySocketId(socket.id ?? "");
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("room:peers", (data: { peers: Peer[] }) => {
      setPeers(data.peers);
    });
    socket.on("room:user-joined", (peer: Peer) => {
      setPeers((prev) =>
        prev.some((p) => p.socketId === peer.socketId) ? prev : [...prev, peer]
      );
    });
    socket.on("room:user-left", ({ socketId }: { socketId: string }) => {
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    });
    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("room:error", (err: { code: string; message: string }) => {
      if (err.code === "WRONG_PASSCODE") {
        setPasscodeError("Incorrect passcode — try again");
        setPhase("prejoin");
      } else if (err.code === "NOT_FOUND") {
        setPhase("not_found");
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  const handlePreJoin = (name: string, chosenColor: string, chosenPasscode?: string) => {
    setDisplayName(name);
    setCursorColor(chosenColor);
    // Only overwrite passcode if the modal actually provided one (private rooms).
    // Owner and hash-link users already have passcode set and don't see the field.
    if (chosenPasscode !== undefined) setPasscode(chosenPasscode);
    setPasscodeError("");
    setPhase("joined");
    if (user) logRoomHistory(code!, roomInfo.name);
  };

  const handleSend = (text: string) => {
    socketRef.current?.emit("chat:message", text);
  };

  const handleUndo = useCallback((cb: () => void) => { undoCbRef.current = cb; }, []);
  const handleRedo = useCallback((cb: () => void) => { redoCbRef.current = cb; }, []);
  const handleClearAll = useCallback((cb: () => void) => { clearCbRef.current = cb; }, []);
  const handleImageInsert = useCallback((cb: (url: string) => void) => { imageInsertRef.current = cb; }, []);

  const handleCopyLink = () => {
    let url = `${window.location.origin}/room/${code}`;
    if (ownerPasscode) url += `#${encodeURIComponent(ownerPasscode)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (phase === "not_found") {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-white text-xl font-semibold">Room not found</p>
        <p className="text-gray-400 text-sm">The room code <span className="font-mono text-white">{code}</span> doesn&apos;t exist.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        >
          Back to home
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (phase === "prejoin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        {passcodeError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-900/80 border border-red-600 rounded-xl text-red-300 text-sm">
            {passcodeError}
          </div>
        )}
        <PreJoinModal
          roomName={roomInfo.name}
          roomCode={code!}
          isPrivate={roomInfo.isPrivate && ownerPasscode === null && !urlHashPasscode}
          defaultName={user?.username ?? ""}
          onJoin={handlePreJoin}
        />
      </div>
    );
  }

  if (!socketRef.current || !connected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Connecting…</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 overflow-hidden">
      <header className="h-12 border-b border-gray-800 flex items-center px-4 gap-4 shrink-0 bg-gray-900">
        <button
          onClick={() => navigate("/")}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Home
        </button>

        <span className="font-semibold text-white truncate">{roomInfo.name}</span>
        <span className="text-xs font-mono bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{code}</span>
        {roomInfo.isPrivate && (
          <span className="text-xs bg-yellow-900/40 border border-yellow-700/50 text-yellow-400 px-2 py-0.5 rounded-full">Private</span>
        )}
        {ownerPasscode && (
          <button
            onClick={() => setPasscodeVisible((v) => !v)}
            className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-2 py-0.5 rounded transition-colors"
            title="Your room passcode"
          >
            <span>🔑</span>
            <span className={passcodeVisible ? "font-mono tracking-widest" : "blur-sm select-none"}>
              {ownerPasscode}
            </span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Online users */}
          <div className="flex -space-x-1">
            {user?.avatar ? (
              <img
                src={user.avatar}
                referrerPolicy="no-referrer"
                title={displayName}
                className="w-7 h-7 rounded-full border-2 border-gray-900 object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900"
                style={{ backgroundColor: cursorColor, color: "#fff" }}
                title={displayName}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {peers.slice(0, 4).map((p) => (
              <div
                key={p.socketId}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900"
                style={{ backgroundColor: p.color, color: "#fff" }}
                title={p.username}
              >
                {p.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {peers.length > 4 && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900 bg-gray-700 text-gray-300">
                +{peers.length - 4}
              </div>
            )}
          </div>

          <button
            onClick={handleCopyLink}
            title="Copy share link"
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
          >
            {copied ? "Copied!" : "Share link"}
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(code ?? "");
            }}
            title="Copy room code"
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
          >
            Copy code
          </button>

          <button
            onClick={() => setChatOpen((o) => !o)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              chatOpen ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Chat
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          stickyBg={stickyBg}
          activeMode={activeMode}
          onToolChange={setTool}
          onColorChange={setColor}
          onWidthChange={setStrokeWidth}
          onStickyBgChange={setStickyBg}
          onImageFile={(url) => imageInsertRef.current?.(url)}
          onClear={() => clearCbRef.current?.()}
          onUndo={() => undoCbRef.current?.()}
          onRedo={() => redoCbRef.current?.()}
          onModeChange={(mode) => {
            setActiveMode(mode);
            setActiveModeToolId(null);
          }}
        />

        <Canvas
          socket={socketRef.current}
          roomId={code!}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          stickyBg={stickyBg}
          displayName={displayName}
          cursorColor={cursorColor}
          passcode={passcode}
          onStrokeAdded={() => {}}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearAll={handleClearAll}
          onImageInsert={handleImageInsert}
        />

        {chatOpen && (
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            currentUserId={user?.id ?? ""}
          />
        )}
      </div>

      <VoicePanel
        socket={socketRef.current}
        peers={peers}
        mySocketId={mySocketId}
      />

      {activeMode && (
        <FloatingToolbox
          modeId={activeMode}
          activeModeToolId={activeModeToolId}
          onToolSelect={setActiveModeToolId}
          onClose={() => {
            setActiveMode(null);
            setActiveModeToolId(null);
          }}
        />
      )}
    </div>
  );
};

export default CanvasPage;

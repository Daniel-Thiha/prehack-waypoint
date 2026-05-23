import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { createRoom } from "../../rooms/apis/rooms.api";
import { saveRoomPasscode } from "../../../utils/roomPasscodes";
import ProfilePopup from "../../../components/ProfilePopup";
import HistoryPanel from "../../../components/HistoryPanel";
import { fetchRoomHistory } from "../../rooms/apis/rooms.api";
import type { HistoryEntry } from "../../rooms/apis/rooms.api";

const HomePage = () => {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [popupOpen, setPopupOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Join
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const createInputRef = useRef<HTMLInputElement>(null);


  const authError = searchParams.get("error");

  // Auto-open create form when coming back from OAuth with ?create=1
  useEffect(() => {
    if (user && searchParams.get("create") === "1") {
      setShowCreate(true);
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (showCreate) {
      setTimeout(() => createInputRef.current?.focus(), 50);
    }
  }, [showCreate]);

  useEffect(() => {
    if (!user) { setHistory([]); return; }
    fetchRoomHistory().then(setHistory).catch(() => setHistory([]));
  }, [user, historyOpen]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { setJoinError("Enter a valid room code"); return; }
    setJoinError("");
    setJoining(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms/verify/${code}`);
      const data = (await res.json()) as { exists?: boolean };
      if (!data.exists) setJoinError("Room not found");
      else navigate(`/room/${code}`);
    } catch {
      setJoinError("Could not connect — try again");
    } finally {
      setJoining(false);
    }
  };

  const handleCreateClick = () => {
    if (!user) { signInWithGoogle("/?create=1"); return; }
    setShowCreate(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = roomName.trim();
    if (!name) return;
    if (isPrivate && !passcode.trim()) { setCreateError("Passcode is required for private rooms"); return; }
    setCreating(true);
    setCreateError("");
    try {
      const room = await createRoom(name, {
        isPrivate,
        passcode: isPrivate ? passcode.trim() : undefined,
      });
      if (isPrivate) saveRoomPasscode(user?.id, room.code, passcode.trim());
      navigate(`/room/${room.code}`, {
        state: {
          skipModal: true,
          displayName: user?.username ?? "",
          cursorColor: "#3b82f6",
          passcode: isPrivate ? passcode.trim() : undefined,
        },
      });
    } catch {
      setCreateError("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const recentRooms = history.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {user && (
        <HistoryPanel
          open={historyOpen}
          onToggle={() => setHistoryOpen((o) => !o)}
          history={history}
        />
      )}
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">Syncboard</span>

        <div className="relative flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
          ) : (
            <>
              <span className="text-sm font-medium text-gray-300 hidden sm:block">
                {user ? user.username : "Guest"}
              </span>
              <button
                onClick={() => setPopupOpen((o) => !o)}
                className="focus:outline-none hover:opacity-80 transition-opacity"
                title={user ? user.username : "Guest"}
              >
                <NavAvatar user={user} />
              </button>
            </>
          )}

          {popupOpen && (
            <ProfilePopup
              user={user}
              onClose={() => setPopupOpen(false)}
              onSignIn={() => { setPopupOpen(false); signInWithGoogle(); }}
              onSignOut={async () => { await logout(); window.location.href = "/"; }}
            />
          )}
        
          {user && (
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              title="Room history"
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Hero + Actions */}
      <main className="flex-1 flex flex-col items-center px-4 pt-16 pb-10">
        <h1 className="text-5xl font-extrabold tracking-tight mb-3 text-center">
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Collaborate
          </span>{" "}
          in real time.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10 text-center">
          A collaborative whiteboard with live cursors, chat, and voice.
          No account needed to join.
        </p>

        {authError && (
          <div className="mb-6 px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            Sign-in failed — please try again.
          </div>
        )}

        {/* Action card */}
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
          {/* Join */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
              placeholder="Room code"
              maxLength={8}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono uppercase tracking-widest text-center text-base"
            />
            <button
              type="submit"
              disabled={joining || !joinCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-semibold transition-colors shrink-0"
            >
              {joining ? "…" : "Join"}
            </button>
          </form>
          {joinError && <p className="text-red-400 text-sm -mt-2">{joinError}</p>}

          <div className="flex items-center gap-3 text-gray-600 text-xs">
            <div className="flex-1 h-px bg-gray-800" />
            <span>or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Create */}
          {showCreate ? (
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  ref={createInputRef}
                  value={roomName}
                  onChange={(e) => { setRoomName(e.target.value); setCreateError(""); }}
                  placeholder="Room name"
                  maxLength={60}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={creating || !roomName.trim() || (isPrivate && !passcode.trim())}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-semibold transition-colors shrink-0"
                >
                  {creating ? "…" : "Create"}
                </button>
              </div>

              {/* Public / Private toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => { setIsPrivate((p) => !p); setPasscode(""); setCreateError(""); }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${isPrivate ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </div>
                <span className="text-sm text-gray-300">
                  {isPrivate ? "Private room" : "Public room"}
                </span>
              </label>

              {isPrivate && (
                <input
                  value={passcode}
                  onChange={(e) => { setPasscode(e.target.value); setCreateError(""); }}
                  placeholder="Set a passcode"
                  maxLength={32}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              )}

              {createError && <p className="text-red-400 text-sm">{createError}</p>}
              <button
                type="button"
                onClick={() => { setShowCreate(false); setRoomName(""); setIsPrivate(false); setPasscode(""); setCreateError(""); }}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors self-start"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={handleCreateClick}
              className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {!user && <GoogleIcon className="opacity-60" />}
              {user ? "Create a room" : "Sign in to create a room"}
            </button>
          )}

          {!user && !showCreate && (
            <p className="text-center text-gray-500 text-xs">
              Creating a room requires a Google account.{" "}
              <span className="text-gray-400">Joining is always free.</span>
            </p>
          )}
        </div>

        {/* Recent rooms from history (max 3) */}
        {user && (
          <div className="w-full max-w-md mt-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
              Recent
            </h2>

            {recentRooms.length === 0 ? (
              <p className="text-gray-600 text-sm px-1">
                No rooms yet — create or join one above.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentRooms.map((entry) => (
                  <li
                    key={entry.code}
                    onClick={() => navigate(`/room/${entry.code}`)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{entry.name}</p>
                        <p className="text-xs text-gray-500 font-mono tracking-widest">{entry.code}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mt-16 justify-center max-w-lg">
          {[
            "✏️ Collaborative canvas",
            "👆 Live cursors",
            "💬 Real-time chat",
            "🎙 Voice chat",
            "🔗 Share by code",
            "👤 Join as guest",
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-sm text-gray-500"
            >
              {f}
            </span>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-700">
        Syncboard &mdash; Prehack 2026
      </footer>
    </div>
  );
};

function NavAvatar({ user }: { user: { username: string; avatar: string | null } | null }) {
  if (!user) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-400 select-none">
        G
      </div>
    );
  }
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        referrerPolicy="no-referrer"
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white select-none">
      {user.username.charAt(0).toUpperCase()}
    </div>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default HomePage;

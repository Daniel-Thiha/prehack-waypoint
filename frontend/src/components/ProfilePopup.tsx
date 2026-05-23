import { useEffect, useRef } from "react";
import type { User } from "../contexts/AuthContext";

interface ProfilePopupProps {
  user: User | null;
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function ProfilePopup({ user, onClose, onSignIn, onSignOut }: ProfilePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-12 w-64 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="p-4 flex flex-col items-center gap-3">
        {user ? (
          <>
            <AvatarDisplay user={user} size={56} />
            <div className="text-center">
              <p className="font-semibold text-white">{user.username}</p>
              <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            </div>
            <button
              onClick={onSignOut}
              className="mt-1 w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-400">
              G
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Guest</p>
              <p className="text-xs text-gray-500 mt-0.5">Not signed in</p>
            </div>
            <button
              onClick={onSignIn}
              className="mt-1 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AvatarDisplay({ user, size }: { user: User; size: number }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-blue-600 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {user.username.charAt(0).toUpperCase()}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

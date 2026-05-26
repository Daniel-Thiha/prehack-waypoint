import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { Peer } from "../types/canvas.types";
import { usePushToTalk } from "./usePushToTalk";

// Add TURN servers here before going to production (Twilio NTS, Cloudflare, coturn)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const VOLUMES_KEY = "voice:volumes:v1";

function loadVolumes(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(VOLUMES_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveVolumes(v: Record<string, number>) {
  localStorage.setItem(VOLUMES_KEY, JSON.stringify(v));
}

interface VoicePeerConn {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
}

export function useVoiceRoom({
  socket,
  peers,
  mySocketId,
}: {
  socket: Socket;
  peers: Peer[];
  mySocketId: string;
}) {
  const [voiceJoined, setVoiceJoined] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [pttMode, setPttMode] = useState(false);
  const [pttActive, setPttActive] = useState(false);
  const [peerMuted, setPeerMuted] = useState<Record<string, boolean>>({});
  const [peerVolumes, setPeerVolumes] = useState<Record<string, number>>(loadVolumes);
  const [voicePeers, setVoicePeers] = useState<string[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, VoicePeerConn>>(new Map());
  const audioContainerRef = useRef<HTMLDivElement>(null);

  // Stable refs to avoid stale closures in async callbacks
  const deafenedRef = useRef(false);
  const micEnabledRef = useRef(false);
  const peersRef = useRef<Peer[]>(peers);
  useEffect(() => { deafenedRef.current = deafened; }, [deafened]);
  useEffect(() => { micEnabledRef.current = micEnabled; }, [micEnabled]);
  useEffect(() => { peersRef.current = peers; }, [peers]);

  const getPeerInfo = useCallback(
    (socketId: string) => peersRef.current.find((p) => p.socketId === socketId),
    []
  );

  // createPeerConnection is stable — never changes after mount
  const createPeerConnection = useCallback(
    (targetSocketId: string): RTCPeerConnection => {
      const existing = connectionsRef.current.get(targetSocketId);
      if (existing) return existing.pc;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      const audioEl = new Audio();
      audioEl.autoplay = true;

      // Apply saved per-user volume
      const username = getPeerInfo(targetSocketId)?.username;
      const saved = loadVolumes();
      audioEl.volume = username ? (saved[username] ?? 1) : 1;
      audioEl.muted = deafenedRef.current;

      // Attach to hidden container so Safari autoplay works
      if (audioContainerRef.current) {
        audioContainerRef.current.appendChild(audioEl);
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("voice:ice-candidate", {
            to: targetSocketId,
            candidate: e.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(targetSocketId, e.streams[0]);
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") pc.restartIce();
      };

      // Add local tracks if mic is already active
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((t) =>
          pc.addTrack(t, streamRef.current!)
        );
      }

      connectionsRef.current.set(targetSocketId, { pc, audioEl });
      return pc;
    },
    [socket, getPeerInfo] // both stable — effect runs once
  );

  const closePeer = useCallback((socketId: string) => {
    const conn = connectionsRef.current.get(socketId);
    if (!conn) return;
    conn.pc.close();
    conn.audioEl.pause();
    conn.audioEl.srcObject = null;
    conn.audioEl.remove();
    connectionsRef.current.delete(socketId);
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  // ── Socket event handlers ──────────────────────────────────────────────────

  useEffect(() => {
    // Renegotiation-safe: reuse existing PC if present
    const handleOffer = async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("voice:answer", { to: from, answer });
    };

    const handleAnswer = async ({
      from,
      answer,
    }: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const conn = connectionsRef.current.get(from);
      if (conn) await conn.pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIce = async ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const conn = connectionsRef.current.get(from);
      if (conn) await conn.pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handlePeerToggle = ({
      socketId,
      enabled,
    }: {
      socketId: string;
      enabled: boolean;
    }) => {
      setPeerMuted((prev) => ({ ...prev, [socketId]: !enabled }));
    };

    // Existing voice participants call this when a new peer joins voice.
    // Offer convention: the existing participant (me) sends the offer.
    const handleVoicePeerJoined = async ({ socketId }: { socketId: string }) => {
      setVoicePeers((prev) => (prev.includes(socketId) ? prev : [...prev, socketId]));
      const pc = createPeerConnection(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("voice:offer", { to: socketId, offer });
    };

    const handleVoicePeerLeft = ({ socketId }: { socketId: string }) => {
      setVoicePeers((prev) => prev.filter((id) => id !== socketId));
      closePeer(socketId);
    };

    // User left the room entirely (not just voice)
    const handleRoomUserLeft = ({ socketId }: { socketId: string }) => {
      setVoicePeers((prev) => prev.filter((id) => id !== socketId));
      closePeer(socketId);
    };

    socket.on("voice:offer", handleOffer);
    socket.on("voice:answer", handleAnswer);
    socket.on("voice:ice-candidate", handleIce);
    socket.on("voice:peer-toggle", handlePeerToggle);
    socket.on("voice:peer-joined", handleVoicePeerJoined);
    socket.on("voice:peer-left", handleVoicePeerLeft);
    socket.on("room:user-left", handleRoomUserLeft);

    return () => {
      socket.off("voice:offer", handleOffer);
      socket.off("voice:answer", handleAnswer);
      socket.off("voice:ice-candidate", handleIce);
      socket.off("voice:peer-toggle", handlePeerToggle);
      socket.off("voice:peer-joined", handleVoicePeerJoined);
      socket.off("voice:peer-left", handleVoicePeerLeft);
      socket.off("room:user-left", handleRoomUserLeft);
    };
  }, [socket, createPeerConnection, closePeer]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const joinVoice = useCallback(() => {
    socket.emit("voice:join");
    socket.once("voice:participants", ({ socketIds }: { socketIds: string[] }) => {
      // Existing voice participants will each send us an offer; we just track them
      setVoicePeers([...socketIds, mySocketId]);
    });
    setVoiceJoined(true);
  }, [socket, mySocketId]);

  const leaveVoice = useCallback(() => {
    socket.emit("voice:leave");
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    connectionsRef.current.forEach((_, id) => closePeer(id));
    setVoiceJoined(false);
    setMicEnabled(false);
    micEnabledRef.current = false;
    setVoicePeers([]);
    socket.emit("voice:toggle", false);
  }, [socket, closePeer]);

  const toggleMic = useCallback(async () => {
    if (!voiceJoined || pttMode) return;
    setMicError(null);

    if (micEnabledRef.current) {
      streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false; });
      setMicEnabled(false);
      micEnabledRef.current = false;
      socket.emit("voice:toggle", false);
      return;
    }

    if (deafenedRef.current) {
      setMicError("Undeafen before unmuting.");
      return;
    }

    if (!streamRef.current) {
      // First enable: acquire mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        streamRef.current = stream;
        setLocalStream(stream);

        // Add track to all existing connections + renegotiate
        for (const [socketId, { pc }] of connectionsRef.current) {
          stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("voice:offer", { to: socketId, offer });
        }
      } catch (err) {
        const e = err as DOMException;
        if (e.name === "NotAllowedError")
          setMicError("Microphone access denied. Allow it in browser settings.");
        else if (e.name === "NotFoundError")
          setMicError("No microphone found. Connect one and try again.");
        else if (e.name === "NotReadableError")
          setMicError("Microphone is in use by another app.");
        else
          setMicError("Could not access microphone.");
        return;
      }
    } else {
      // Re-enable existing track
      streamRef.current.getAudioTracks().forEach((t) => { t.enabled = true; });
    }

    setMicEnabled(true);
    micEnabledRef.current = true;
    socket.emit("voice:toggle", true);
  }, [voiceJoined, pttMode, socket]);

  const toggleDeafen = useCallback(() => {
    setDeafened((prev) => {
      const next = !prev;
      deafenedRef.current = next;
      connectionsRef.current.forEach(({ audioEl }) => { audioEl.muted = next; });
      if (next && micEnabledRef.current) {
        streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false; });
        setMicEnabled(false);
        micEnabledRef.current = false;
        socket.emit("voice:toggle", false);
      }
      return next;
    });
  }, [socket]);

  const togglePtt = useCallback(() => {
    setPttMode((prev) => {
      if (!prev) {
        // Entering PTT: silence mic until space is held
        if (micEnabledRef.current) {
          streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false; });
          setMicEnabled(false);
          micEnabledRef.current = false;
          socket.emit("voice:toggle", false);
        }
      }
      return !prev;
    });
  }, [socket]);

  const setPeerVolume = useCallback(
    (socketId: string, volume: number) => {
      const username = getPeerInfo(socketId)?.username;
      setPeerVolumes((prev) => {
        const next = username ? { ...prev, [username]: volume } : prev;
        saveVolumes(next);
        return next;
      });
      const conn = connectionsRef.current.get(socketId);
      if (conn) conn.audioEl.volume = volume;
    },
    [getPeerInfo]
  );

  // ── Push-to-talk ──────────────────────────────────────────────────────────

  usePushToTalk({
    enabled: pttMode && voiceJoined && localStream !== null && !deafened,
    onPress: () => {
      if (!streamRef.current) return;
      streamRef.current.getAudioTracks().forEach((t) => { t.enabled = true; });
      socket.emit("voice:toggle", true);
      setPttActive(true);
    },
    onRelease: () => {
      streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false; });
      socket.emit("voice:toggle", false);
      setPttActive(false);
    },
  });

  // ── PTT mic acquisition ───────────────────────────────────────────────────
  // In PTT mode the mic button acquires the stream (starts silent) instead of toggling

  const acquireMicForPtt = useCallback(async () => {
    if (streamRef.current) return; // already acquired
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      stream.getAudioTracks().forEach((t) => { t.enabled = false; }); // start silent
      streamRef.current = stream;
      setLocalStream(stream);

      for (const [socketId, { pc }] of connectionsRef.current) {
        stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("voice:offer", { to: socketId, offer });
      }
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError") setMicError("Microphone access denied.");
      else if (e.name === "NotFoundError") setMicError("No microphone found.");
      else setMicError("Could not access microphone.");
    }
  }, [socket]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      connectionsRef.current.forEach((conn) => {
        conn.pc.close();
        conn.audioEl.srcObject = null;
        conn.audioEl.remove();
      });
    };
  }, []);

  return {
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
  };
}

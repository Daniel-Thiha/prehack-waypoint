import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { Peer } from "../types/canvas.types";

interface VoicePanelProps {
  socket: Socket;
  peers: Peer[];
  mySocketId: string;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
}

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const VoicePanel = ({ socket, peers, mySocketId }: VoicePanelProps) => {
  const [micOn, setMicOn] = useState(false);
  const [peerMuted, setPeerMuted] = useState<Record<string, boolean>>({});
  const streamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, PeerConnection>>(new Map());

  const createPeerConnection = useCallback(
    (targetSocketId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("voice:ice-candidate", {
            to: targetSocketId,
            candidate: e.candidate.toJSON(),
          });
        }
      };

      const audioEl = new Audio();
      audioEl.autoplay = true;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      connectionsRef.current.set(targetSocketId, { pc, audioEl });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));
      }

      return pc;
    },
    [socket]
  );

  const closePeer = useCallback((socketId: string) => {
    const conn = connectionsRef.current.get(socketId);
    if (conn) {
      conn.pc.close();
      conn.audioEl.srcObject = null;
      connectionsRef.current.delete(socketId);
    }
  }, []);

  useEffect(() => {
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
      if (conn) {
        await conn.pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIce = async ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const conn = connectionsRef.current.get(from);
      if (conn) {
        await conn.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
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

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      closePeer(socketId);
    };

    socket.on("voice:offer", handleOffer);
    socket.on("voice:answer", handleAnswer);
    socket.on("voice:ice-candidate", handleIce);
    socket.on("voice:peer-toggle", handlePeerToggle);
    socket.on("room:user-left", handleUserLeft);

    return () => {
      socket.off("voice:offer", handleOffer);
      socket.off("voice:answer", handleAnswer);
      socket.off("voice:ice-candidate", handleIce);
      socket.off("voice:peer-toggle", handlePeerToggle);
      socket.off("room:user-left", handleUserLeft);
    };
  }, [socket, createPeerConnection, closePeer]);

  const toggleMic = async () => {
    if (micOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      connectionsRef.current.forEach((_, id) => closePeer(id));
      socket.emit("voice:toggle", false);
      setMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        socket.emit("voice:toggle", true);

        for (const peer of peers) {
          if (peer.socketId === mySocketId) continue;
          const pc = createPeerConnection(peer.socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("voice:offer", { to: peer.socketId, offer });
        }

        setMicOn(true);
      } catch {
        alert("Microphone access denied");
      }
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      connectionsRef.current.forEach((conn) => {
        conn.pc.close();
        conn.audioEl.srcObject = null;
      });
    };
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-800 bg-gray-900">
      <button
        onClick={toggleMic}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          micOn
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-gray-800 hover:bg-gray-700 text-gray-300"
        }`}
      >
        {micOn ? "🎙 Mute" : "🎙 Unmute"}
      </button>

      <div className="flex items-center gap-1.5">
        {peers
          .filter((p) => p.socketId !== mySocketId)
          .map((p) => (
            <div
              key={p.socketId}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: p.color + "33", color: p.color }}
              title={p.username}
            >
              <span>{peerMuted[p.socketId] ? "🔇" : "🔊"}</span>
              <span>{p.username}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default VoicePanel;

import { useEffect, useState } from "react";

export function useSpeakingDetector(
  stream: MediaStream | null,
  threshold = 0.02
): boolean {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!stream) {
      setSpeaking(false);
      return;
    }

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.4;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    let currentlySpeaking = false;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128 - 1;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      if (rms > threshold) {
        if (!currentlySpeaking) {
          currentlySpeaking = true;
          setSpeaking(true);
        }
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
      } else if (currentlySpeaking && !silenceTimer) {
        silenceTimer = setTimeout(() => {
          currentlySpeaking = false;
          setSpeaking(false);
          silenceTimer = null;
        }, 250);
      }
    };

    const intervalId = window.setInterval(tick, 100);

    return () => {
      clearInterval(intervalId);
      if (silenceTimer) clearTimeout(silenceTimer);
      source.disconnect();
      ctx.close().catch(() => {});
      setSpeaking(false);
    };
  }, [stream, threshold]);

  return speaking;
}

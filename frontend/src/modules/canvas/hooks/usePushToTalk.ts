import { useEffect, useRef } from "react";

export function usePushToTalk({
  enabled,
  onPress,
  onRelease,
  keyCode = "Space",
}: {
  enabled: boolean;
  onPress: () => void;
  onRelease: () => void;
  keyCode?: string;
}) {
  // Stable refs so we don't re-register listeners on every render
  const onPressRef = useRef(onPress);
  const onReleaseRef = useRef(onRelease);
  useEffect(() => { onPressRef.current = onPress; }, [onPress]);
  useEffect(() => { onReleaseRef.current = onRelease; }, [onRelease]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.code !== keyCode) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      onPressRef.current();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== keyCode) return;
      onReleaseRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled, keyCode]);
}

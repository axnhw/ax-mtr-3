import { useCallback, useEffect, useRef } from "react";

/**
 * Detects a long-press gesture (touch or mouse) without interfering with
 * normal taps, horizontal scrolling, or text selection.
 *
 * The returned `wasLongPress()` flag lets the caller swallow the click that
 * fires right after a long press (so the station isn't selected).
 */
export function useLongPress(callback: () => void, delay = 450) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    firedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      callbackRef.current();
    }, delay);
  }, [delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Returns true (once) if the most recent gesture completed as a long press. */
  const wasLongPress = useCallback(() => {
    const fired = firedRef.current;
    firedRef.current = false;
    return fired;
  }, []);

  const handlers = {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchMove: cancel,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };

  return { handlers, wasLongPress };
}

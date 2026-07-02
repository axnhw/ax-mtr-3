import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSchedule } from "../lib/api";
import type { ApiResponse } from "../types";

const REFRESH_MS = 15000;
/** Minimum time the refresh spinner stays visible, so the motion is always
 *  clearly perceptible even when the network responds very quickly. */
const MIN_SPIN_MS = 600;

interface ScheduleState {
  data: ApiResponse | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: number | null;
  refresh: () => void;
}

export function useSchedule(
  line: string | null,
  sta: string | null,
  lang: "en" | "zh",
): ScheduleState {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const reqId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (refreshing: boolean) => {
      if (!line || !sta) return;
      const id = ++reqId.current;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const startedAt = Date.now();

      try {
        const res = await fetchSchedule(line, sta, lang, controller.signal);
        if (id !== reqId.current) return;
        setData(res);
        setLastUpdated(Date.now());
      } catch (e) {
        if (id !== reqId.current) return;
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load arrivals.");
        // keep previous data visible if we have it
      } finally {
        if (id !== reqId.current) return;
        setIsLoading(false);
        // Keep the spinner spinning for at least MIN_SPIN_MS so the rotation
        // is always visible — then stop it once refreshing is actually done.
        const remaining = MIN_SPIN_MS - (Date.now() - startedAt);
        if (refreshing && remaining > 0) {
          setTimeout(() => {
            if (id === reqId.current) setIsRefreshing(false);
          }, remaining);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [line, sta, lang],
  );

  // Initial / dependency-change load.
  useEffect(() => {
    load(false);
    return () => abortRef.current?.abort();
  }, [load]);

  // Auto-refresh while the tab is visible.
  useEffect(() => {
    if (!line || !sta) return;
    const tick = () => {
      if (document.visibilityState === "visible") load(true);
    };
    const interval = setInterval(tick, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [line, sta, load]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    lastUpdated,
    refresh: () => load(true),
  };
}

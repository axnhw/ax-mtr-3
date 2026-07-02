/**
 * Parse an MTR time string such as "2026-06-30 11:16:41".
 * MTR times are Hong Kong local time (UTC+8, no DST), so we convert to a UTC
 * epoch that can be compared against Date.now() regardless of the user's zone.
 */
export function parseHKTime(s: string): number {
  if (!s) return NaN;
  const [date, time] = s.split(" ");
  if (!date || !time) return NaN;
  const [Y, M, D] = date.split("-").map(Number);
  const parts = time.split(":").map(Number);
  const h = parts[0];
  const m = parts[1];
  const sec = parts[2] || 0;
  if ([Y, M, D, h, m].some((n) => Number.isNaN(n))) return NaN;
  return Date.UTC(Y, M - 1, D, h - 8, m, sec);
}

/** "2026-06-30 11:16:41" -> "11:16" */
export function formatClock(s: string): string {
  const time = s.split(" ")[1];
  return time ? time.slice(0, 5) : s;
}

export interface Countdown {
  /** Whole minutes remaining (floored, >= 0). */
  minutes: number;
  seconds: number;
  totalSeconds: number;
  departed: boolean;
}

/** Live countdown from a Hong-Kong arrival time to `nowMs`. */
export function countdown(arrivalHK: string, nowMs: number): Countdown {
  const target = parseHKTime(arrivalHK);
  const fallback: Countdown = {
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    departed: false,
  };
  if (Number.isNaN(target)) return fallback;
  const totalSeconds = Math.round((target - nowMs) / 1000);
  if (totalSeconds <= 0) {
    return { ...fallback, departed: true, totalSeconds };
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds, totalSeconds, departed: false };
}

export function timeAgo(
  updatedAt: number | null,
  nowMs: number,
  lang: "en" | "zh" = "en",
): string {
  if (updatedAt == null) return "—";
  const diff = Math.max(0, Math.round((nowMs - updatedAt) / 1000));
  if (diff < 4) return lang === "zh" ? "剛剛更新" : "just now";
  if (diff < 60)
    return lang === "zh" ? `${diff}秒前更新` : `Updated ${diff}s ago`;
  const m = Math.floor(diff / 60);
  return lang === "zh" ? `${m}分鐘前更新` : `Updated ${m}m ago`;
}

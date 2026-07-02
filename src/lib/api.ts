import type { ApiResponse } from "../types";

const ENDPOINT =
  "https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php";

type ProxyBuilder = (url: string) => string;

// Public CORS proxies used as fallback if a direct browser request is blocked.
// The MTR endpoint normally returns `Access-Control-Allow-Origin: *`, but these
// fallbacks keep the app resilient on Vercel's static hosting.
const PROXIES: ProxyBuilder[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
];

async function parseJson(res: Response): Promise<ApiResponse> {
  const text = await res.text();
  return JSON.parse(text) as ApiResponse;
}

/**
 * Fetch the live train schedule for a line + station.
 * Tries a direct request first, then a sequence of CORS proxies.
 */
export async function fetchSchedule(
  line: string,
  sta: string,
  lang: "en" | "zh",
  signal?: AbortSignal,
): Promise<ApiResponse> {
  const url = `${ENDPOINT}?line=${line}&sta=${sta}&lang=${lang}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) return await parseJson(res);
    throw new Error(`HTTP ${res.status}`);
  } catch {
    for (const build of PROXIES) {
      try {
        const res = await fetch(build(url), {
          signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.ok) return await parseJson(res);
      } catch {
        /* try next proxy */
      }
    }
    throw new Error(
      "Unable to reach the MTR data service. Check your connection and try again.",
    );
  }
}

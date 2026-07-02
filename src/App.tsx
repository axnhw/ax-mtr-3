import { useEffect, useMemo, useState } from "react";
import { ArrivalBoard } from "./components/ArrivalBoard";
import { Header } from "./components/Header";
import { LineSelector } from "./components/LineSelector";
import { StationPills } from "./components/StationPills";
import { LINES } from "./data/mtr";
import { useNow } from "./hooks/useNow";
import { useSchedule } from "./hooks/useSchedule";
import type { Lang, Recent } from "./types";

const LS_LANG = "mtr-lang";
const LS_LINE = "mtr-line";
const LS_STA = "mtr-sta";
const LS_REC = "mtr-recents";
/** Per-line "last selected station" map: { lineCode: staCode }. */
const LS_STA_BY_LINE = "mtr-sta-by-line";

const MAX_RECENTS = 6;

function readLS(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Load the per-line last-selected-station map, tolerating bad/corrupt data. */
function loadStaByLine(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_STA_BY_LINE);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() =>
    readLS(LS_LANG, "en") === "zh" ? "zh" : "en",
  );
  const [lineCode, setLineCode] = useState<string>(() => {
    const v = readLS(LS_LINE, LINES[0].code);
    return LINES.some((l) => l.code === v) ? v : LINES[0].code;
  });
  // Per-line memory of the last-selected station. Seeded from storage, with a
  // one-time migration from the legacy single saved station for backward compat.
  const [lastStaByLine, setLastStaByLine] = useState<Record<string, string>>(
    () => {
      const map = loadStaByLine();
      const savedLineCode = readLS(LS_LINE, LINES[0].code);
      const savedSta = readLS(LS_STA, "");
      if (savedSta && !map[savedLineCode]) map[savedLineCode] = savedSta;
      return map;
    },
  );

  // A station is always selected. Prefer this line's last-selected station;
  // otherwise default to the line's first station.
  const [staCode, setStaCode] = useState<string>(() => {
    const line = LINES.find((l) => l.code === lineCode) ?? LINES[0];
    const remembered = lastStaByLine[lineCode];
    if (remembered && line.stations.some((s) => s.code === remembered)) {
      return remembered;
    }
    return line.stations[0].code;
  });

  // History of stations the user has opened, most recent first.
  const [recents, setRecents] = useState<Recent[]>(() => {
    try {
      const raw = localStorage.getItem(LS_REC);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (r): r is Recent =>
            !!r &&
            typeof r.lineCode === "string" &&
            typeof r.staCode === "string",
        )
        .slice(0, MAX_RECENTS);
    } catch {
      return [];
    }
  });

  const now = useNow(1000);

  const line = useMemo(
    () => LINES.find((l) => l.code === lineCode) ?? LINES[0],
    [lineCode],
  );
  const station = useMemo(
    () => line.stations.find((s) => s.code === staCode) ?? line.stations[0],
    [line, staCode],
  );

  const schedule = useSchedule(line.code, station.code, lang);

  // Persist preferences.
  useEffect(() => {
    try {
      localStorage.setItem(LS_LANG, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_LINE, lineCode);
    } catch {
      /* ignore */
    }
  }, [lineCode]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_STA, station.code);
    } catch {
      /* ignore */
    }
  }, [station]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_REC, JSON.stringify(recents));
    } catch {
      /* ignore */
    }
  }, [recents]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_STA_BY_LINE, JSON.stringify(lastStaByLine));
    } catch {
      /* ignore */
    }
  }, [lastStaByLine]);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-HK" : "en";
  }, [lang]);

  /** Remember the last-selected station for a given line. */
  function rememberStation(line: string, sta: string) {
    setLastStaByLine((prev) =>
      prev[line] === sta ? prev : { ...prev, [line]: sta },
    );
  }

  /**
   * Switch line. Resolution order for the station to show:
   *  1. keep the current station if it also exists on the new line (interchange);
   *  2. otherwise restore the last station explicitly selected on this line;
   *  3. otherwise land on the line's first station.
   * Automatic navigation is NOT recorded in the recents history.
   */
  function selectLine(code: string) {
    const next = LINES.find((l) => l.code === code);
    if (!next) return;
    setLineCode(code);
    if (next.stations.some((s) => s.code === staCode)) return; // interchange
    const remembered = lastStaByLine[code];
    if (remembered && next.stations.some((s) => s.code === remembered)) {
      setStaCode(remembered);
    } else {
      setStaCode(next.stations[0].code);
    }
  }

  /** Push a station to the front of the recents list (deduped, capped). */
  function recordRecent(line: string, sta: string) {
    setRecents((prev) => {
      const filtered = prev.filter(
        (r) => !(r.lineCode === line && r.staCode === sta),
      );
      return [{ lineCode: line, staCode: sta }, ...filtered].slice(
        0,
        MAX_RECENTS,
      );
    });
  }

  /** Open a specific station on a specific line (used by the recents menu). */
  function navigateTo(line: string, sta: string) {
    setLineCode(line);
    setStaCode(sta);
    rememberStation(line, sta);
    recordRecent(line, sta);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Select a station on the current line (records it as recently viewed). */
  function selectStation(code: string) {
    setStaCode(code);
    rememberStation(lineCode, code);
    recordRecent(lineCode, code);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 text-slate-900">
      {/* Sticky top: header + line bar + station bar */}
      <div className="sticky top-0 z-30 shadow-sm">
        <Header
          lang={lang}
          onToggleLang={() => setLang((l) => (l === "en" ? "zh" : "en"))}
          recents={recents}
          currentLine={lineCode}
          currentSta={station.code}
          onSelectRecent={navigateTo}
        />
        <div className="border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="mx-auto max-w-3xl py-2.5">
            <LineSelector
              lines={LINES}
              value={lineCode}
              onChange={selectLine}
              lang={lang}
            />
          </div>
          <div className="mx-auto max-w-3xl pb-2.5">
            <StationPills
              line={line}
              value={station.code}
              onChange={selectStation}
              lang={lang}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4">
        <ArrivalBoard
          line={line}
          station={station}
          lang={lang}
          data={schedule.data}
          isLoading={schedule.isLoading}
          isRefreshing={schedule.isRefreshing}
          error={schedule.error}
          lastUpdated={schedule.lastUpdated}
          now={now}
          onRefresh={schedule.refresh}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs leading-relaxed text-slate-400">
          <p>
            {lang === "zh"
              ? "資料由 data.gov.hk「港鐵 Next Train」開放數據提供，約每 10 秒更新，僅供參考。"
              : "Data from data.gov.hk (MTR Next Train open data). Updates ~every 10s. For reference only."}
          </p>
        </div>
      </footer>
    </div>
  );
}

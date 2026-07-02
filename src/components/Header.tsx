import { useEffect, useRef, useState } from "react";
import { LINES, stationName } from "../data/mtr";
import { useNow } from "../hooks/useNow";
import type { Lang, Recent } from "../types";
import { GlobeIcon, HistoryIcon, TrainIcon, XIcon } from "./icons";
import { cn } from "../utils/cn";

interface Props {
  lang: Lang;
  onToggleLang: () => void;
  recents: Recent[];
  currentLine: string;
  currentSta: string | null;
  onSelectRecent: (lineCode: string, staCode: string) => void;
}

export function Header({
  lang,
  onToggleLang,
  recents,
  currentLine,
  currentSta,
  onSelectRecent,
}: Props) {
  const now = useNow(1000);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hkTime = new Date(now).toLocaleTimeString("en-GB", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCurrent = (r: Recent) =>
    r.lineCode === currentLine && r.staCode === currentSta;
  // The "last clicked into" station = most recent entry that isn't the one
  // currently being viewed.
  const lastViewed = recents.find((r) => !isCurrent(r));
  const recentLine = lastViewed
    ? LINES.find((l) => l.code === lastViewed.lineCode)
    : undefined;
  const menuItems = recents.filter((r) => !isCurrent(r));

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800">
      <div className="mx-auto flex max-w-3xl items-center gap-1.5 px-3 py-2">
        {/* Logo + app name */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-emerald-400 text-slate-900 shadow-lg shadow-sky-500/20">
          <TrainIcon className="h-5 w-5" strokeWidth={2.3} />
        </div>
        <div className="min-w-0 shrink">
          <h1 className="truncate text-sm font-bold leading-tight text-white">
            {lang === "zh" ? "港鐵下班車" : "MTR Next Train"}
          </h1>
          <p className="truncate text-[11px] leading-tight">
            <a
              href="https://tw.piliapp.com/hongkong-mtr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 underline-offset-2 transition hover:text-sky-200 hover:underline"
            >
              {lang === "zh" ? "按此查詢車費" : "Tap to check fares"}
            </a>
          </p>
        </div>

        {/* MIDDLE — recently viewed station */}
        <div
          className="relative flex min-w-0 flex-1 justify-center"
          ref={menuRef}
        >
          {lastViewed && (
            <>
              <div
                className="flex min-w-0 max-w-full divide-x divide-white/20 overflow-hidden rounded-full ring-1 ring-white/25"
                style={{ backgroundColor: (recentLine?.color ?? "#64748b") + "80" }}
              >
                {/* History icon → opens the list of recently-viewed stations */}
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  aria-haspopup="menu"
                  aria-label={
                    lang === "zh" ? "最近查看的車站" : "Recently viewed stations"
                  }
                  title={
                    lang === "zh" ? "最近查看的車站" : "Recently viewed stations"
                  }
                  className={cn(
                    "flex items-center gap-1 py-1.5 pl-2 pr-1.5 text-white transition hover:bg-white/15",
                    open && "bg-white/15",
                  )}
                >
                  <HistoryIcon
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-300 transition-transform",
                      open && "rotate-[-30deg]",
                    )}
                  />
                </button>
                {/* Line + station text → open that station directly */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectRecent(lastViewed.lineCode, lastViewed.staCode);
                    setOpen(false);
                  }}
                  aria-label={
                    lang === "zh"
                      ? `前往${stationName(lastViewed.staCode, lang)}`
                      : `Open ${stationName(lastViewed.staCode, lang)}`
                  }
                  title={
                    lang === "zh"
                      ? `前往${stationName(lastViewed.staCode, lang)}`
                      : `Open ${stationName(lastViewed.staCode, lang)}`
                  }
                  className="flex min-w-0 items-center py-1.5 pl-2 pr-2.5 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <span className="truncate">
                    {lang === "zh"
                      ? stationName(lastViewed.staCode, "zh")
                      : lastViewed.staCode}
                  </span>
                </button>
              </div>

              {open && (
                <div
                  role="menu"
                  className="absolute left-1/2 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 animate-fade-in-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {lang === "zh" ? "最近查看" : "Recently viewed"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label={lang === "zh" ? "關閉" : "Close"}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-1.5">
                    {menuItems.map((r) => {
                      const line = LINES.find((l) => l.code === r.lineCode);
                      return (
                        <button
                          key={`${r.lineCode}-${r.staCode}`}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onSelectRecent(r.lineCode, r.staCode);
                            setOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-slate-50"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: line?.color ?? "#94a3b8" }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-800">
                              {stationName(r.staCode, lang)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              {lang === "zh" ? line?.nameZh : line?.name}
                            </span>
                          </span>
                          <HistoryIcon className="h-4 w-4 shrink-0 text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Clock + language */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium tabular-nums text-slate-300 ring-1 ring-white/10 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {hkTime}
          </div>
          <button
            type="button"
            onClick={onToggleLang}
            aria-label="Toggle language"
            className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/10 transition hover:bg-white/20"
          >
            <GlobeIcon className="h-4 w-4" />
            {lang === "zh" ? "EN" : "中文"}
          </button>
        </div>
      </div>
    </div>
  );
}



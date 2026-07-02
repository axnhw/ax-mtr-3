import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { readableText } from "../lib/color";
import { useLongPress } from "../hooks/useLongPress";
import type { Lang, Line, Station } from "../types";
import { cn } from "../utils/cn";

/** MTR station layout PDF URL for a given station code (lowercased). */
function layoutUrl(code: string): string {
  return `https://www.mtr.com.hk/archive/ch/services/layouts/${code.toLowerCase()}.pdf`;
}

interface Props {
  line: Line;
  value: string;
  onChange: (code: string) => void;
  lang: Lang;
}

export function StationPills({ line, value, onChange, lang }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<Station | null>(null);
  // Remembers the line whose stations are currently shown so we can tell a
  // genuine line change apart from a plain station tap.
  const lineCodeRef = useRef<string | null>(null);

  const { handlers, wasLongPress } = useLongPress(() => {
    // Open the station layout map in a new browser tab.
    const code = targetRef.current?.code;
    if (code) {
      window.open(layoutUrl(code), "_blank", "noopener,noreferrer");
    }
  }, 450);

  // Only reposition the bar when the line (i.e. the list of stations) changes
  // — including first mount. We deliberately do NOT scroll on a station tap,
  // so the bar stays exactly where the user left it after selecting a station.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const lineChanged = lineCodeRef.current !== line.code;
    lineCodeRef.current = line.code;
    if (!lineChanged) return;
    const active = scroller.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const target =
      active.offsetLeft - scroller.clientWidth / 2 + active.clientWidth / 2;
    scroller.scrollTo({ left: target, behavior: "smooth" });
  }, [value, line.code]);

  /** Per-station event bindings: tap selects, long-press opens the map. */
  const bind = (s: Station) => ({
    onMouseDown: () => {
      targetRef.current = s;
      handlers.onMouseDown();
    },
    onMouseUp: handlers.onMouseUp,
    onMouseLeave: handlers.onMouseLeave,
    onTouchStart: () => {
      targetRef.current = s;
      handlers.onTouchStart();
    },
    onTouchMove: handlers.onTouchMove,
    onTouchEnd: handlers.onTouchEnd,
    onTouchCancel: handlers.onTouchCancel,
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    onClick: () => {
      // Swallow the click that follows a long-press so we don't also navigate.
      if (wasLongPress()) return;
      onChange(s.code);
    },
  });

  return (
    <div
      ref={scrollerRef}
      role="tablist"
      aria-label={lang === "zh" ? "選擇車站" : "Select station"}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 scroll-px-4"
    >
      {line.stations.map((s) => {
        const active = s.code === value;
        // Compact: English shows the station code (e.g. TAW), Chinese shows
        // the short Chinese name.
        const label = lang === "zh" ? s.nameZh : s.code;
        return (
          <button
            key={s.code}
            data-active={active ? "true" : undefined}
            type="button"
            role="tab"
            aria-selected={active}
            title={`${s.name} (${s.code}) · ${
              lang === "zh" ? "長按在新分頁開啟車站佈局圖" : "Long-press to open station map in a new tab"
            }`}
            className={cn(
              "no-callout flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-semibold transition",
              active
                ? "border-transparent shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
            style={
              active
                ? { backgroundColor: line.color, color: readableText(line.color) }
                : undefined
            }
            {...bind(s)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

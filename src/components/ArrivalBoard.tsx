import { stationName } from "../data/mtr";
import { readableText, shade } from "../lib/color";
import { countdown, formatClock, parseHKTime, timeAgo } from "../lib/format";
import type { ReactNode } from "react";
import type { ApiResponse, Lang, Line, Station, Train } from "../types";
import { cn } from "../utils/cn";
import {
  AlertIcon,
  ArrowRightIcon,
  InfoIcon,
  RefreshIcon,
} from "./icons";

interface Props {
  line: Line;
  station: Station;
  lang: Lang;
  data: ApiResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
  now: number;
  onRefresh: () => void;
}

function sortTrains(trains: Train[]): Train[] {
  return [...trains].sort((a, b) => Number(a.seq) - Number(b.seq));
}

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

export function ArrivalBoard(props: Props) {
  const {
    line,
    station,
    lang,
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    now,
    onRefresh,
  } = props;

  const key = `${line.code}-${station.code}`;
  const schedule = data?.data?.[key];

  // Anchor countdowns to the MTR server clock so they keep ticking accurately
  // even if the device's clock is slightly off. `serverNow` is the server time
  // captured at the last fetch (≈ lastUpdated on the device); we carry the
  // skew forward so the estimate advances in real time between refreshes.
  const serverNow = schedule
    ? parseHKTime(schedule.curr_time || schedule.sys_time || "")
    : NaN;
  const skew =
    Number.isNaN(serverNow) || lastUpdated == null ? 0 : serverNow - lastUpdated;
  const effNow = now + skew;

  const directions: { dir: "UP" | "DOWN"; trains: Train[] }[] = [];
  if (schedule) {
    if (schedule.UP?.length) directions.push({ dir: "UP", trains: sortTrains(schedule.UP) });
    if (schedule.DOWN?.length)
      directions.push({ dir: "DOWN", trains: sortTrains(schedule.DOWN) });
  }

  const delayed = data?.isdelay === "Y";
  const special =
    !!data && (data.status === 0 || (!!data.message && data.message !== "successful"));
  const showEmpty = !isLoading && !error && !special && directions.length === 0;

  return (
    <section className="animate-fade-in-up">
      {/* Live status row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="live-ping relative inline-block h-2 w-2 rounded-full bg-emerald-500 text-emerald-500" />
          {timeAgo(lastUpdated, now, lang)}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshIcon className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">{lang === "zh" ? "刷新" : "Refresh"}</span>
        </button>
      </div>

      {/* Banners */}
      {delayed && (
        <Banner tone="amber" icon={<AlertIcon className="h-4 w-4" />}>
          {lang === "zh"
            ? "列車服務有延誤，請預留額外時間。"
            : "Train service is currently delayed. Please allow extra time."}
        </Banner>
      )}
      {special && (
        <Banner tone="sky" icon={<InfoIcon className="h-4 w-4" />}>
          {data?.message ||
            (lang === "zh"
              ? "本綫現正實施特別列車安排。"
              : "Special train service arrangements are in place on this line.")}
        </Banner>
      )}
      {error && (
        <Banner tone="rose" icon={<AlertIcon className="h-4 w-4" />}>
          {error}
        </Banner>
      )}

      {/* Body */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : showEmpty ? (
        <EmptyState lang={lang} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {directions.map((d) => (
            <DirectionCard
              key={d.dir}
              trains={d.trains}
              line={line}
              lang={lang}
              now={effNow}
              origin={stationName(station.code, lang)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Banner({
  tone,
  icon,
  children,
}: {
  tone: "amber" | "sky" | "rose";
  icon: ReactNode;
  children: ReactNode;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    sky: "bg-sky-50 text-sky-800 ring-sky-200",
    rose: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  return (
    <div
      className={cn(
        "mb-3.5 flex items-start gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium ring-1",
        tones[tone],
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function DirectionCard({
  trains,
  line,
  lang,
  now,
  origin,
}: {
  trains: Train[];
  line: Line;
  lang: Lang;
  now: number;
  origin: string;
}) {
  const hero = trains[0];
  const rest = trains.slice(1);
  const dests = uniq(trains.map((t) => t.dest));
  const plat = hero.plat && hero.plat !== "-" ? hero.plat : null;

  const cd = countdown(hero.time, now);
  // Never count down in seconds — anything under a minute shows "1 min".
  const heroValue = cd.departed
    ? "0"
    : cd.minutes === 0
      ? "1"
      : String(cd.minutes);
  const heroUnit = "min";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className="flex items-center justify-between gap-2 px-4 py-1.5"
        style={{ backgroundColor: line.color + "14" }}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className="truncate text-sm font-bold"
            style={{ color: shade(line.color, -0.4) }}
          >
            {origin}
          </span>
          <ArrowRightIcon
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: shade(line.color, -0.25) }}
          />
          <span
            className="truncate text-sm font-bold"
            style={{ color: shade(line.color, -0.4) }}
          >
            {dests.map((d) => stationName(d, lang)).join(" · ")}
          </span>
        </div>
        {plat && (
          <span
            className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold"
            style={{ backgroundColor: line.color, color: readableText(line.color) }}
          >
            {lang === "zh" ? `月台 ${plat}` : `Plat ${plat}`}
          </span>
        )}
      </div>

      {/* Hero train with inline following chips */}
      <div className="flex items-start gap-4 px-4 py-2.5">
        <div className="w-14 shrink-0 pt-0.5 text-center">
          <div
            className="text-[34px] font-black leading-none tabular-nums"
            style={{ color: shade(line.color, -0.15) }}
          >
            {heroValue}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-slate-400">
            {heroUnit || "—"}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold text-slate-900">
            {stationName(hero.dest, lang)}
          </div>
          <div className="mt-0.5 text-xs font-medium text-slate-500">
            {cd.departed
              ? lang === "zh"
                ? "即將開出"
                : "Departing"
              : (lang === "zh"
                  ? `${formatClock(hero.time)} 到達`
                  : `Arrives ${formatClock(hero.time)}`)}
          </div>
          {rest.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {rest.map((t) => (
                <FollowingChip key={t.seq} t={t} lang={lang} now={now} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FollowingChip({ t, lang, now }: { t: Train; lang: Lang; now: number }) {
  const cd = countdown(t.time, now);
  // Never count down in seconds — anything under a minute shows "1m".
  const label = cd.departed
    ? "0 min"
    : cd.minutes === 0
      ? "1m"
      : `${cd.minutes}m`;
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 ring-1 ring-slate-100">
      <span className="text-xs font-bold tabular-nums text-slate-700">{label}</span>
      <span className="h-3 w-px bg-slate-200" />
      <span className="text-xs font-medium text-slate-500">
        {lang === "zh" ? stationName(t.dest, "zh") : t.dest}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-7 shimmer" />
      <div className="flex items-start gap-4 px-4 py-2.5">
        <div className="h-10 w-14 rounded-lg shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded shimmer" />
          <div className="h-3 w-24 rounded shimmer" />
          <div className="h-5 w-40 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ lang }: { lang: Lang }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
        🚇
      </div>
      <p className="text-base font-bold text-slate-700">
        {lang === "zh" ? "暫無即將到站列車" : "No upcoming trains right now"}
      </p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
        {lang === "zh"
          ? "可能是非行車時間（約 05:30 – 01:00）或暫時未有資料。"
          : "This may be outside service hours (~05:30–01:00) or data is momentarily unavailable."}
      </p>
    </div>
  );
}

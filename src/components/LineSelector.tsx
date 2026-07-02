import { readableText } from "../lib/color";
import type { Lang, Line } from "../types";
import { cn } from "../utils/cn";

interface Props {
  lines: Line[];
  value: string;
  onChange: (code: string) => void;
  lang: Lang;
}

export function LineSelector({ lines, value, onChange, lang }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {lines.map((line) => {
        const active = line.code === value;
        const label = lang === "zh" ? line.shortNameZh : line.shortName;
        const fg = readableText(line.color);
        return (
          <button
            key={line.code}
            type="button"
            onClick={() => onChange(line.code)}
            aria-pressed={active}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition",
              active
                ? "border-transparent shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
            style={active ? { backgroundColor: line.color, color: fg } : undefined}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: active ? fg : line.color,
                opacity: active ? 0.9 : 1,
              }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}

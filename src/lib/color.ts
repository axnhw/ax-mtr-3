/**
 * Returns a readable foreground colour ("#ffffff" or dark slate) for a given
 * background hex colour, using WCAG relative luminance.
 */
export function readableText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#ffffff";
  const toLinear = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.42 ? "#16273b" : "#ffffff";
}

/** Lightens/darkens a hex colour by a given amount (-1..1). */
export function shade(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const mix = (channel: string) => {
    const base = parseInt(channel, 16);
    const out =
      amount >= 0
        ? Math.round(base + (255 - base) * amount)
        : Math.round(base * (1 + amount));
    return Math.max(0, Math.min(255, out))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${mix(c.slice(0, 2))}${mix(c.slice(2, 4))}${mix(c.slice(4, 6))}`;
}

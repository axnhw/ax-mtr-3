export type Lang = "en" | "zh";

/** A station the user has previously opened, keyed by line + station code. */
export interface Recent {
  lineCode: string;
  staCode: string;
}

export interface Station {
  code: string;
  name: string;
  nameZh: string;
  seq: number;
}

export interface Line {
  code: string;
  name: string;
  nameZh: string;
  shortName: string;
  shortNameZh: string;
  color: string;
  stations: Station[];
}

/** A single upcoming train as returned by the MTR Next Train API. */
export interface Train {
  seq: string;
  dest: string;
  plat: string;
  /** Scheduled arrival time, e.g. "2026-06-30 11:16:41" (Hong Kong local). */
  time: string;
  /** Time to next train in minutes (string). */
  ttnt: string;
  valid: string;
  source: string;
}

export interface ScheduleData {
  curr_time: string;
  sys_time: string;
  UP: Train[];
  DOWN: Train[];
}

export interface ApiResponse {
  status: number;
  message: string;
  isdelay: string;
  curr_time?: string;
  sys_time?: string;
  data?: Record<string, ScheduleData>;
}

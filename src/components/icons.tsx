import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const svg = (props: IconProps) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const TrainIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <rect x="6" y="3" width="12" height="13" rx="3.5" />
    <path d="M6 9.5h12" />
    <path d="M8.5 16l-2.5 5M15.5 16l2.5 5" />
    <circle cx="9.5" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const RefreshIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const GlobeIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
  </svg>
);

export const ExternalLinkIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

export const HistoryIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const InfoIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

export const AlertIcon = (props: IconProps) => (
  <svg {...svg(props)}>
    <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

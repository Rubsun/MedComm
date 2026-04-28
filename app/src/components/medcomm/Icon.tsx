import type { CSSProperties, ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  home: (<><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/></>),
  book: (<><path d="M4 5a2 2 0 012-2h13v18H6a2 2 0 01-2-2V5z"/><path d="M4 18a2 2 0 012-2h13"/></>),
  map: (<><path d="M9 3l-6 3v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/></>),
  user: (<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>),
  award: (<><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></>),
  bell: (<><path d="M6 9a6 6 0 0112 0v4l2 3H4l2-3V9z"/><path d="M10 19a2 2 0 004 0"/></>),
  settings: (<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></>),
  search: (<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></>),
  plus: (<><path d="M12 5v14M5 12h14"/></>),
  check: (<><path d="M5 12l5 5L20 7"/></>),
  checkCircle: (<><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>),
  chevronRight: (<><path d="M9 6l6 6-6 6"/></>),
  chevronLeft: (<><path d="M15 6l-6 6 6 6"/></>),
  chevronDown: (<><path d="M6 9l6 6 6-6"/></>),
  chevronUp: (<><path d="M6 15l6-6 6 6"/></>),
  arrowRight: (<><path d="M5 12h14M13 6l6 6-6 6"/></>),
  arrowLeft: (<><path d="M19 12H5M11 6l-6 6 6 6"/></>),
  play: (<><path d="M6 4l14 8-14 8V4z"/></>),
  pause: (<><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></>),
  lock: (<><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>),
  unlock: (<><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 017-2.7"/></>),
  flame: (<><path d="M12 2c1 4 4 6 4 10a4 4 0 11-8 0c0-2 1-3 1-5 2 1 3 0 3-5z"/><path d="M12 22a4 4 0 004-4"/></>),
  clock: (<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  chart: (<><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></>),
  bar: (<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>),
  users: (<><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><circle cx="17" cy="8" r="3"/><path d="M22 19c0-3-2-5-5-5"/></>),
  grad: (<><path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11v5c0 2 3 3 6 3s6-1 6-3v-5"/></>),
  trash: (<><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></>),
  edit: (<><path d="M16 3l5 5L8 21H3v-5L16 3z"/></>),
  eye: (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>),
  eyeOff: (<><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.4 4M6.6 6.6C3.4 8.6 2 12 2 12s4 7 10 7c1.6 0 3-.3 4.3-.9"/></>),
  file: (<><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"/><path d="M14 3v6h6"/></>),
  image: (<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></>),
  video: (<><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l5-3v10l-5-3"/></>),
  list: (<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>),
  grid: (<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
  download: (<><path d="M12 3v13M6 11l6 6 6-6M3 21h18"/></>),
  upload: (<><path d="M12 16V3M6 9l6-6 6 6M3 21h18"/></>),
  moreH: (<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>),
  moreV: (<><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>),
  drag: (<><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></>),
  sparkles: (<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></>),
  target: (<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>),
  heart: (<><path d="M21 8a5 5 0 00-9-3 5 5 0 00-9 3c0 7 9 12 9 12s9-5 9-12z"/></>),
  msg: (<><path d="M21 12a8 8 0 01-12 7l-5 1 1-5a8 8 0 1116-3z"/></>),
  cmd: (<><path d="M9 6V3a3 3 0 100 6h6V3a3 3 0 110 6m0 6h6a3 3 0 110 6 3 3 0 01-3-3v-6m-6 0v6a3 3 0 11-3-3h3"/></>),
  logout: (<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>),
  layers: (<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></>),
  folder: (<><path d="M3 7a2 2 0 012-2h4l2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></>),
  bookmark: (<><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/></>),
  note: (<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>),
  trophy: (<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M7 6H4a2 2 0 002 4M17 6h3a2 2 0 01-2 4"/></>),
  cert: (<><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/><path d="M10 9l1.5 1.5L15 7"/></>),
  info: (<><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v4h1"/></>),
  warning: (<><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 18v.01"/></>),
  x: (<><path d="M6 6l12 12M6 18L18 6"/></>),
  filter: (<><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></>),
  sort: (<><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>),
  refresh: (<><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"/></>),
  star: (<><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z"/></>),
  arrowUp: (<><path d="M12 19V5M5 12l7-7 7 7"/></>),
  arrowDown: (<><path d="M12 5v14M19 12l-7 7-7-7"/></>),
  smile: (<><circle cx="12" cy="12" r="9"/><path d="M9 14s1 2 3 2 3-2 3-2M9 9h.01M15 9h.01"/></>),
  light: (<><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12c1 1 1 2 1 3h6c0-1 0-2 1-3a7 7 0 00-4-12z"/></>),
};

export type IconName = keyof typeof PATHS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 16, color, style, className }: IconProps) {
  const p = PATHS[name];
  if (!p) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {p}
    </svg>
  );
}

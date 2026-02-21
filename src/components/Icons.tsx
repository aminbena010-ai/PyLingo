import type { SVGProps } from 'react';

const IconBase = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props} />
);

export const FlameIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M12 3c1 3-2 4-2 7 0 1 1 2 2 2 3 0 5-3 4-6 3 2 5 6 5 9a7 7 0 1 1-14 0c0-3 2-5 3-7" />
  </IconBase>
);

export const HeartIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M20 8a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 5 8 11 8 11s8-6 8-11z" />
  </IconBase>
);

export const BoltIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
  </IconBase>
);

export const BookIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
    <path d="M6 3v16" />
  </IconBase>
);

export const PuzzleIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M8 3h3a2 2 0 1 1 4 0h3v4a2 2 0 1 0 0 4v4h-4a2 2 0 1 1-4 0H6v-4a2 2 0 1 0 0-4V3z" />
  </IconBase>
);

export const MapIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3z" />
    <path d="M9 3v15M15 6v15" />
  </IconBase>
);

export const UserIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
);

export const TrophyIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M8 4h8v3a4 4 0 0 1-8 0z" />
    <path d="M6 4H4a2 2 0 0 0 2 3M18 4h2a2 2 0 0 1-2 3" />
    <path d="M12 11v4M9 21h6M10 15h4" />
  </IconBase>
);

export const TargetIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </IconBase>
);

export const ChartIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M4 19V5" />
    <path d="M10 19v-8" />
    <path d="M16 19v-4" />
    <path d="M22 19v-12" />
  </IconBase>
);

export const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="m8 5 11 7-11 7z" />
  </IconBase>
);

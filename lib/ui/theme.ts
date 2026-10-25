export interface AppTheme {
  colors: {
    bg: string;
    bgDeep: string;
    surface: string;
    surfaceRaised: string;
    panel: string;
    panelHigh: string;
    line: string;
    lineStrong: string;
    text: string;
    textMuted: string;
    textDim: string;
    lime: string;
    limeSoft: string;
    limeInk: string;
    danger: string;
    warning: string;
    info: string;
    purple: string;
    platinum: string;
  };
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  shadows: {
    card: string;
    lift: string;
    lime: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    wide: string;
  };
}

export const theme: AppTheme = {
  colors: {
    bg: 'var(--bg)',
    bgDeep: 'var(--bg-deep)',
    surface: 'var(--surface)',
    surfaceRaised: 'var(--surface-raised)',
    panel: 'var(--panel)',
    panelHigh: 'var(--panel-high)',
    line: 'var(--line)',
    lineStrong: 'var(--line-strong)',
    text: 'var(--text)',
    textMuted: 'var(--text-muted)',
    textDim: 'var(--text-dim)',
    lime: 'var(--lime)',
    limeSoft: 'var(--lime-soft)',
    limeInk: 'var(--lime-ink)',
    danger: 'var(--danger)',
    warning: 'var(--warning)',
    info: 'var(--info)',
    purple: 'var(--purple)',
    platinum: 'var(--platinum)',
  },
  fonts: {
    display: 'var(--font-display)',
    body: 'var(--font-body)',
    mono: 'var(--font-mono)',
  },
  shadows: {
    card: '0 24px 60px rgba(0, 0, 0, 0.35)',
    lift: '0 18px 40px rgba(0, 0, 0, 0.45)',
    lime: '0 0 32px rgba(215, 255, 63, 0.22)',
  },
  breakpoints: {
    mobile: '640px',
    tablet: '900px',
    desktop: '1180px',
    wide: '1440px',
  },
};

export const media = {
  mobile: `@media (max-width: ${theme.breakpoints.mobile})`,
  tablet: `@media (max-width: ${theme.breakpoints.tablet})`,
  desktop: `@media (max-width: ${theme.breakpoints.desktop})`,
  hover: '@media (hover: hover)',
  reduced: '@media (prefers-reduced-motion: reduce)',
};

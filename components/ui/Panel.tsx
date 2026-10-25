'use client';

import styled, { css } from 'styled-components';
import type { ReactNode } from 'react';
import { media } from '@/lib/ui/theme';

export const Panel = styled.div<{
  $padding?: string;
  $glow?: boolean;
  $interactive?: boolean;
  $accent?: string;
}>`
  position: relative;
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0) 40%),
    ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 6px;
  padding: ${({ $padding }) => $padding ?? '24px'};
  overflow: hidden;
  box-shadow: ${({ $glow, theme }) =>
    $glow ? `0 0 0 1px rgba(215,255,63,.06), 0 24px 64px rgba(0,0,0,.28)` : 'none'};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(
      600px circle at var(--mouse-x, 50%) var(--mouse-y, 0%),
      rgba(255, 255, 255, 0.035),
      transparent 45%
    );
  }

  ${({ $accent }) =>
    $accent &&
    css`
      border-top-color: ${$accent};
    `}

  ${({ $interactive }) =>
    $interactive &&
    css`
      transition:
        transform 0.22s ease,
        border-color 0.22s ease,
        background 0.22s ease;
      &:hover {
        transform: translateY(-4px);
        border-color: rgba(255, 255, 255, 0.18);
      }
    `}
`;

export const PanelLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
`;

export const Divider = styled.hr`
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  margin: 20px 0;
`;

export const Badge = styled.span<{
  $tone?: 'lime' | 'neutral' | 'danger' | 'warning' | 'info' | 'purple';
}>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 3px;
  border: 1px solid
    ${({ $tone, theme }) =>
      $tone === 'lime'
        ? 'rgba(215,255,63,.4)'
        : $tone === 'danger'
          ? 'rgba(255,93,93,.35)'
          : $tone === 'warning'
            ? 'rgba(251,191,36,.35)'
            : $tone === 'info'
              ? 'rgba(56,189,248,.35)'
              : $tone === 'purple'
                ? 'rgba(167,139,250,.35)'
                : theme.colors.line};
  background: ${({ $tone, theme }) =>
    $tone === 'lime'
      ? 'rgba(215,255,63,.08)'
      : $tone === 'danger'
        ? 'rgba(255,93,93,.08)'
        : $tone === 'warning'
          ? 'rgba(251,191,36,.08)'
          : $tone === 'info'
            ? 'rgba(56,189,248,.08)'
            : $tone === 'purple'
              ? 'rgba(167,139,250,.08)'
              : 'rgba(255,255,255,.03)'};
  color: ${({ $tone, theme }) =>
    $tone === 'lime'
      ? theme.colors.lime
      : $tone === 'danger'
        ? theme.colors.danger
        : $tone === 'warning'
          ? theme.colors.warning
          : $tone === 'info'
            ? theme.colors.info
            : $tone === 'purple'
              ? theme.colors.purple
              : theme.colors.textMuted};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const ProgressTrack = styled.div<{ $height?: number; $contrast?: boolean }>`
  width: 100%;
  height: ${({ $height }) => $height ?? 5}px;
  border-radius: 999px;
  background: ${({ $contrast }) =>
    $contrast ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.09)'};
  overflow: hidden;
`;

export const ProgressFill = styled.div<{
  $value: number;
  $color?: string;
  $animated?: boolean;
}>`
  height: 100%;
  width: ${({ $value }) => Math.max(0, Math.min(100, $value))}%;
  border-radius: inherit;
  background: ${({ $color, theme }) => $color ?? theme.colors.lime};
  box-shadow: 0 0 12px ${({ $color }) => ($color ?? '#d7ff3f')}55;
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
`;

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  valueLabel?: ReactNode;
  showValue?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color,
  height,
  label,
  valueLabel,
  showValue,
}: ProgressBarProps) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      {(label || showValue) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            gap: 12,
          }}
        >
          <PanelLabel>{label}</PanelLabel>
          {showValue && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
              {valueLabel ?? `${Math.round(percent)}%`}
            </span>
          )}
        </div>
      )}
      <ProgressTrack $height={height}>
        <ProgressFill $value={percent} $color={color} />
      </ProgressTrack>
    </div>
  );
}

export const StatRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  &:last-child {
    border-bottom: 0;
  }
  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 11px;
    letter-spacing: 0.05em;
  }
  strong {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 19px;
    letter-spacing: 0.03em;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

export const StatGrid = styled.div<{ $min?: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${({ $min }) => $min ?? '150px'}, 1fr));
  gap: 10px;
`;

export const MiniStat = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 4px;
  span {
    display: block;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textDim};
    margin-bottom: 8px;
  }
  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(24px, 3vw, 32px);
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }
  em {
    display: block;
    font-style: normal;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 9px;
    margin-top: 6px;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  ${media.mobile} {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
`;

export const SectionKicker = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.colors.lime};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  margin-bottom: 10px;
  &::before {
    content: '';
    width: 26px;
    height: 1px;
    background: currentColor;
  }
`;

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(34px, 4.4vw, 58px);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.015em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text};
  em {
    font-style: normal;
    color: ${({ theme }) => theme.colors.lime};
  }
`;

export const PageIntro = styled.p`
  max-width: 560px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  line-height: 1.75;
`;

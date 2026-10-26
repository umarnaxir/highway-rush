'use client';

import styled from 'styled-components';
import { Gauge, RotateCcw, Smartphone, TriangleAlert } from 'lucide-react';
import type { TiltReadout } from '@/lib/game/tilt';

interface TiltFeedbackProps {
  readout: TiltReadout | null;
  fallback: boolean;
  onCalibrate: () => void;
}

const Chip = styled.div<{ $tone: 'active' | 'warn' }>`
  position: absolute;
  top: calc(68px + env(safe-area-inset-top));
  left: 50%;
  z-index: 18;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 9px;
  max-width: calc(100vw - 32px);
  padding: 7px 9px 7px 11px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'active' ? 'rgba(215, 255, 63, 0.24)' : 'rgba(251, 191, 36, 0.32)'};
  border-radius: 999px;
  background: rgba(7, 10, 13, 0.64);
  color: ${({ $tone }) => ($tone === 'active' ? 'var(--lime)' : 'var(--warning)')};
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
  white-space: nowrap;

  strong {
    font-size: inherit;
    letter-spacing: 0.12em;
  }

  span {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }

  @media (orientation: landscape) and (max-height: 560px) {
    top: calc(48px + env(safe-area-inset-top));
  }
`;

const Meter = styled.span`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 4px;
  border-radius: 999px;
  background: rgba(245, 246, 247, 0.16);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: calc(50% + var(--steer-offset, 0%));
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 10px currentColor;
    transform: translate(-50%, -50%);
    transition: left 0.08s linear;
  }
`;

const Calibrate = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  border: 1px solid rgba(245, 246, 247, 0.16);
  border-radius: 999px;
  background: rgba(245, 246, 247, 0.06);
  color: var(--text);
  font: inherit;
  font-size: 7px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;

  svg {
    width: 11px;
    height: 11px;
  }

  &:focus-visible {
    outline: 2px solid var(--lime);
    outline-offset: 2px;
  }
`;

/**
 * Small, non-blocking HUD readout for tilt steering. It exposes support,
 * permission and fallback states instead of silently pretending the sensor
 * worked, and offers one-tap recalibration.
 */
export function TiltFeedback({ readout, fallback, onCalibrate }: TiltFeedbackProps) {
  const status = readout?.status ?? 'idle';
  const active = status === 'active' && !fallback;
  const tone = active ? 'active' : 'warn';
  const steer = Math.max(-1, Math.min(1, readout?.steer ?? 0));

  let label = 'Tilt ready';
  let detail = 'Tap re-centre';
  if (fallback) {
    label = 'Tilt unavailable';
    detail = 'Button fallback';
  } else if (status === 'denied') {
    label = 'Motion denied';
    detail = 'Button fallback';
  } else if (status === 'unsupported') {
    label = 'No motion sensor';
    detail = 'Button fallback';
  } else if (status === 'requesting') {
    label = 'Requesting motion';
    detail = 'Allow in browser';
  } else if (status === 'error') {
    label = 'Sensor error';
    detail = 'Button fallback';
  } else if (status === 'active') {
    label = 'Tilt active';
    detail = `${(readout?.angle ?? 0).toFixed(1)}°`;
  }

  return (
    <Chip $tone={tone} role="status" aria-live="polite">
      {active ? <Gauge /> : status === 'active' ? <Smartphone /> : <TriangleAlert />}
      <strong>{label}</strong>
      <Meter
        style={{ ['--steer-offset' as string]: `${(steer * 50).toFixed(1)}%` }}
        aria-hidden="true"
      />
      <span>{detail}</span>
      {active && (
        <Calibrate type="button" onClick={onCalibrate} aria-label="Re-centre tilt steering">
          <RotateCcw /> Centre
        </Calibrate>
      )}
    </Chip>
  );
}

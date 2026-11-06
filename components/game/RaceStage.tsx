'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import {
  ArrowRight,
  Award,
  Car,
  CheckCircle2,
  ChevronRight,
  Coins,
  Flag,
  Fuel,
  Gauge,
  Heart,
  Loader2,
  Play,
  RotateCcw,
  Settings2,
  Skull,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import type {
  CarCustomization,
  CarDefinition,
  DestinationDefinition,
  EngineMode,
  GameEvent,
  HudFrame,
  RunResult,
  Settings,
  TrophyDefinition,
  TrophyTier,
} from '@/lib/types';
import type { HighwayRushEngine } from '@/lib/game/engine';
import type { RunRewards } from '@/lib/store/useGameStore';
import { RaceHud, RaceHudFallback } from './RaceHud';
import { TouchControls } from './TouchControls';
import { DragSteerLayer } from './DragSteerLayer';
import { TiltFeedback } from './TiltFeedback';
import { requestTiltAccess, TiltController, type TiltReadout } from '@/lib/game/tilt';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TROPHY_TIER_META } from '@/lib/data/trophies';
import { useGameStore } from '@/lib/store/useGameStore';
import { useUiStore } from '@/lib/store/useUiStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import {
  formatDistance,
  formatDuration,
  formatNumber,
  formatSpeed,
} from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

export interface RaceStageProps {
  destination: DestinationDefinition;
  car: CarDefinition;
  customization: CarCustomization;
  settings: Settings;
  endless: boolean;
  autoStart?: boolean;
  onExit: () => void;
}

interface FeedItem {
  id: number;
  title: string;
  detail: string;
  tone: 'lime' | 'warning' | 'danger' | 'info';
}

const FullScreen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 800;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #030506;
  color: var(--text);
  isolation: isolate;
`;

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  outline: none;
`;

const Vignette = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 52%, transparent 52%, rgba(2, 4, 6, 0.42) 100%),
    linear-gradient(180deg, rgba(2, 4, 6, 0.28), transparent 18%, transparent 82%, rgba(2, 4, 6, 0.44));
`;

const feedPop = keyframes`
  0% { opacity: 0; transform: translateY(-8px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const FeedLayer = styled.div`
  position: absolute;
  left: 50%;
  top: max(88px, env(safe-area-inset-top) + 74px);
  z-index: 25;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transform: translateX(-50%);
  pointer-events: none;
  width: auto;
  max-width: 90vw;

  ${media.mobile} {
    top: max(78px, env(safe-area-inset-top) + 64px);
  }
`;

const FeedItem = styled.div<{ $tone: FeedItem['tone'] }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 5px 16px;
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'danger'
        ? 'rgba(255,93,93,.6)'
        : $tone === 'warning'
          ? 'rgba(251,191,36,.55)'
          : $tone === 'info'
            ? 'rgba(56,189,248,.55)'
            : 'rgba(215,255,63,.65)'};
  background: rgba(4, 7, 10, 0.88);
  backdrop-filter: blur(14px);
  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.65),
    0 0 14px
      ${({ $tone }) =>
        $tone === 'danger'
          ? 'rgba(255,93,93,.28)'
          : $tone === 'warning'
            ? 'rgba(251,191,36,.25)'
            : $tone === 'info'
              ? 'rgba(56,189,248,.25)'
              : 'rgba(215,255,63,.32)'};
  text-align: center;
  white-space: nowrap;
  animation: ${feedPop} 0.16s cubic-bezier(0.22, 1, 0.36, 1) both;

  strong {
    display: inline-block;
    color: ${({ $tone, theme }) =>
      $tone === 'danger'
        ? theme.colors.danger
        : $tone === 'warning'
          ? theme.colors.warning
          : $tone === 'info'
            ? theme.colors.info
            : theme.colors.lime};
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 11px;
    font-style: italic;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1;
  }

  span {
    display: inline-block;
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1;
    opacity: 0.92;
  }
`;

const damage = keyframes`
  0% { opacity: .95; }
  100% { opacity: 0; }
`;

const Impact = styled.div<{ $severity: number }>`
  position: absolute;
  inset: 0;
  z-index: 18;
  pointer-events: none;
  animation: ${damage} ${({ $severity }) => ($severity > 0.6 ? '0.62s' : '0.4s')} ease-out both;
  background:
    radial-gradient(ellipse at 50% 72%, transparent 34%, rgba(255, 40, 40, 0.38) 100%),
    linear-gradient(180deg, rgba(255, 30, 30, 0.08), transparent 35%);
  box-shadow: inset 0 0 120px rgba(255, 30, 30, 0.22);
`;

const Overlay = styled.div<{ $tone?: 'dark' | 'lime' }>`
  position: absolute;
  inset: 0;
  z-index: 32;
  display: grid;
  place-items: center;
  padding: clamp(18px, 4vw, 42px);
  background:
    radial-gradient(
      ellipse at 50% 100%,
      ${({ $tone }) => ($tone === 'lime' ? 'rgba(215,255,63,.09)' : 'rgba(56,189,248,.05)')},
      transparent 58%
    ),
    rgba(3, 5, 7, 0.7);
  backdrop-filter: blur(9px);
  overflow-y: auto;
`;

const StartCard = styled.div`
  position: relative;
  width: min(760px, 100%);
  margin: auto;
  padding: clamp(26px, 4vw, 46px);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background:
    linear-gradient(150deg, rgba(18, 25, 32, 0.96), rgba(6, 9, 12, 0.97) 68%),
    var(--panel);
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.62);
  text-align: center;
  animation: pageIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const StartKicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--lime);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
`;

const StartTitle = styled.h1`
  margin-top: 13px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(38px, 6.4vw, 76px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.84;
  letter-spacing: -0.035em;
  text-transform: uppercase;

  em {
    display: block;
    color: var(--lime);
    font-style: inherit;
  }
`;

const StartMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px 16px;
  flex-wrap: wrap;
  margin-top: 20px;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  svg {
    color: var(--lime);
  }
`;

const StartNote = styled.p`
  max-width: 480px;
  margin: 18px auto 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.75;
`;

const StartActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 26px;
`;

const KeyStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  color: var(--text-dim);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  kbd {
    display: inline-grid;
    place-items: center;
    min-width: 24px;
    min-height: 22px;
    padding: 0 5px;
    border: 1px solid var(--line-strong);
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 8px;
    font-weight: 700;
  }
`;

const countdownIn = keyframes`
  0% { opacity: 0; transform: scale(1.5); filter: blur(4px); }
  22% { opacity: 1; transform: scale(1); filter: blur(0); }
  82% { opacity: 1; }
  100% { opacity: .15; transform: scale(.94); }
`;

const Countdown = styled.div`
  position: absolute;
  inset: 0;
  z-index: 24;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  text-align: center;

  small {
    color: var(--text-muted);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
  }

  strong {
    display: block;
    margin: 8px 0 4px;
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(110px, 22vw, 240px);
    font-style: italic;
    font-weight: 900;
    line-height: 0.78;
    letter-spacing: -0.06em;
    text-shadow:
      0 0 70px rgba(215, 255, 63, 0.2),
      0 18px 50px rgba(0, 0, 0, 0.55);
    animation: ${countdownIn} 0.95s ease-out both;
  }

  span {
    color: var(--text-dim);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }
`;

const goIn = keyframes`
  0% { opacity: 0; transform: scale(.72); }
  30% { opacity: 1; transform: scale(1.06); }
  100% { opacity: 0; transform: scale(1.18); }
`;

const GoFlash = styled.div`
  position: absolute;
  inset: 0;
  z-index: 24;
  display: grid;
  place-items: center;
  pointer-events: none;
  color: var(--lime);
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(90px, 18vw, 180px);
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-shadow: 0 0 70px rgba(215, 255, 63, 0.45);
  animation: ${goIn} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const PauseCard = styled.div`
  width: min(620px, 100%);
  margin: auto;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: linear-gradient(155deg, rgba(18, 25, 32, 0.98), rgba(6, 9, 12, 0.99));
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.65);
  animation: pageIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
  overflow: hidden;
`;

const PauseTop = styled.div`
  padding: clamp(22px, 3.4vw, 34px) clamp(22px, 3.4vw, 34px) 20px;
  border-bottom: 1px solid var(--line);

  h2 {
    margin-top: 8px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(34px, 5vw, 54px);
    font-style: italic;
    line-height: 0.9;
    text-transform: uppercase;
    letter-spacing: -0.025em;
  }

  p {
    margin-top: 10px;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.65;
  }
`;

const PauseStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--line);
  border-bottom: 1px solid var(--line);

  div {
    padding: 13px 18px;
    background: #0a0e12;
  }

  span {
    display: block;
    color: var(--text-dim);
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    margin-top: 4px;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
`;

const PauseActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: clamp(18px, 2.6vw, 26px);

  > :last-child {
    grid-column: 1 / -1;
  }

  ${media.mobile} {
    grid-template-columns: 1fr;
    > :last-child {
      grid-column: auto;
    }
  }
`;

const ResultCard = styled.div`
  width: min(880px, 100%);
  margin: auto;
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  background: linear-gradient(155deg, rgba(18, 25, 32, 0.98), rgba(5, 8, 10, 0.99));
  box-shadow: 0 50px 140px rgba(0, 0, 0, 0.75);
  animation: pageIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
  overflow: hidden;
`;

const ResultHead = styled.div<{ $win: boolean }>`
  position: relative;
  padding: clamp(24px, 4vw, 40px) clamp(22px, 4vw, 42px) clamp(20px, 3vw, 30px);
  border-bottom: 1px solid var(--line);
  background:
    radial-gradient(
      ellipse at 12% 0%,
      ${({ $win }) => ($win ? 'rgba(215,255,63,.16)' : 'rgba(255,93,93,.12)')},
      transparent 58%
    ),
    transparent;
`;

const ResultTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
`;

const ResultKicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--lime);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.28em;
  text-transform: uppercase;
`;

const ResultTitle = styled.h2`
  margin-top: 10px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(34px, 5.2vw, 62px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.86;
  letter-spacing: -0.03em;
  text-transform: uppercase;
`;

const ResultSub = styled.p`
  max-width: 520px;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.7;
`;

const ScoreBlock = styled.div`
  text-align: right;
  min-width: 170px;

  span {
    display: block;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    margin-top: 3px;
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(38px, 6vw, 66px);
    font-style: italic;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 6px 30px rgba(0, 0, 0, 0.5);
  }

  em {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    color: var(--text-dim);
    font-size: 8px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.08em;
    font-variant-numeric: tabular-nums;
  }
`;

const NewBest = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 4px 8px;
  border: 1px solid rgba(215, 255, 63, 0.45);
  border-radius: 2px;
  background: rgba(215, 255, 63, 0.09);
  color: var(--lime);
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const ResultBody = styled.div`
  padding: clamp(20px, 3vw, 30px) clamp(22px, 4vw, 42px) clamp(22px, 3vw, 34px);
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ResultStat = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #0a0e12;
  min-width: 0;

  svg {
    flex: 0 0 auto;
    color: var(--text-dim);
  }

  div {
    min-width: 0;
  }

  span {
    display: block;
    color: var(--text-dim);
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    display: block;
    margin-top: 3px;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const RewardRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 16px;
  padding: 13px 15px;
  border: 1px solid rgba(255, 212, 59, 0.28);
  border-radius: 4px;
  background: rgba(255, 212, 59, 0.05);
  flex-wrap: wrap;

  > div {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  svg {
    color: var(--warning);
  }

  span {
    color: var(--text-muted);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    color: var(--warning);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 14px;
    font-weight: 700;
  }
`;

const UnlockBlock = styled.div`
  margin-top: 16px;

  h3 {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 8px;

    svg {
      color: var(--lime);
    }
  }
`;

const UnlockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Unlock = styled.div<{ $tier: TrophyTier }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border: 1px solid
    ${({ $tier }) => `${TROPHY_TIER_META[$tier].color}44`};
  border-radius: 3px;
  background: ${({ $tier }) => `${TROPHY_TIER_META[$tier].color}0d`};

  > svg {
    color: ${({ $tier }) => TROPHY_TIER_META[$tier].color};
    flex: 0 0 auto;
  }

  div {
    min-width: 0;
    flex: 1;
  }

  strong {
    display: block;
    color: ${({ $tier }) => TROPHY_TIER_META[$tier].color};
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  span {
    display: block;
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 9px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  b {
    flex: 0 0 auto;
    color: var(--warning);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 9px;
    font-weight: 700;
  }
`;

const MissionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border: 1px solid rgba(167, 139, 250, 0.35);
    border-radius: 2px;
    background: rgba(167, 139, 250, 0.08);
    color: var(--purple);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;

const ResultActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 22px;

  ${media.mobile} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Loading = styled(Overlay)`
  z-index: 40;
  background: #030506;
  text-align: center;

  strong {
    display: block;
    margin-top: 14px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 20px;
    font-style: italic;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  span {
    display: block;
    margin-top: 6px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }

  svg {
    color: var(--lime);
    animation: spin 0.9s linear infinite;
  }
`;

const ErrorCard = styled(StartCard)`
  width: min(520px, 100%);
`;

const FatalIcon = styled.div`
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 18px;
  border-radius: 50%;
  border: 1px solid rgba(255, 93, 93, 0.4);
  background: rgba(255, 93, 93, 0.08);
  color: var(--danger);
`;

const srOnly = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

const LiveRegion = styled.div`
  ${srOnly}
`;

function reasonCopy(result: RunResult): { title: string; sub: string; win: boolean } {
  switch (result.reason) {
    case 'finish':
      return {
        title: 'Route complete',
        sub: 'You crossed the finish gate with the machine still in one piece. The route record is yours.',
        win: true,
      };
    case 'fuel':
      return {
        title: 'Dry tank',
        sub: 'The fuel gauge hit zero before the finish line. Checkpoints are the only refill on the highway.',
        win: false,
      };
    case 'crash':
      return {
        title: 'Machine retired',
        sub: 'Structural health reached zero. Every run still banks its distance, coins and trophies.',
        win: false,
      };
    default:
      return {
        title: 'Run ended',
        sub: 'You pulled off the highway early. Everything earned so far has still been banked.',
        win: false,
      };
  }
}

/**
 * Owns one full-screen race: creates the Three.js engine after a dynamic import,
 * wires HUD/events, evaluates live trophy unlocks, banks the final result once,
 * and disposes every listener, timer and GPU resource on unmount.
 */
export function RaceStage({
  destination,
  car,
  customization,
  settings,
  endless,
  autoStart = true,
  onExit,
}: RaceStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HighwayRushEngine | null>(null);
  const hudRef = useRef<HudFrame | null>(null);
  const callbacksRef = useRef<{
    hud: (frame: HudFrame) => void;
    event: (event: GameEvent) => void;
    mode: (mode: EngineMode) => void;
    finish: (result: RunResult) => void;
  }>({
    hud: () => undefined,
    event: () => undefined,
    mode: () => undefined,
    finish: () => undefined,
  });
  const bestScoreRef = useRef(0);
  const mountedRef = useRef(true);
  const processedResults = useRef<Set<string>>(new Set());
  const feedTimers = useRef<number[]>([]);
  const goTimer = useRef<number | null>(null);
  const feedId = useRef(0);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const addRunResult = useGameStore((state) => state.addRunResult);
  const evaluateLiveTrophies = useGameStore((state) => state.evaluateLiveTrophies);
  const bestScore = useGameStore((state) => state.stats.bestScore);
  bestScoreRef.current = bestScore;
  const pushToast = useUiStore((state) => state.pushToast);

  const [hud, setHud] = useState<HudFrame | null>(null);
  const [mode, setMode] = useState<EngineMode>('loading');
  const [result, setResult] = useState<RunResult | null>(null);
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const [liveTrophies, setLiveTrophies] = useState<TrophyDefinition[]>([]);
  const [breakdownTrophies, setBreakdownTrophies] = useState<TrophyDefinition[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [impact, setImpact] = useState<{ id: number; severity: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsStart, setNeedsStart] = useState(false);
  const [showGo, setShowGo] = useState(false);
  const [touch, setTouch] = useState(false);
  const [tiltReadout, setTiltReadout] = useState<TiltReadout | null>(null);
  const [tiltFallback, setTiltFallback] = useState(false);
  const tiltRef = useRef<TiltController | null>(null);
  const tiltUpdateRef = useRef(0);

  const speedUnit = settings.gameplay.speedUnit;
  const controlMethod = settings.controls.method;
  const tiltSelected = controlMethod === 'tilt';
  const dragSelected = controlMethod === 'drag';
  const tiltActive = tiltSelected && !tiltFallback;

  const pushFeed = useCallback((title: string, detail: string, tone: FeedItem['tone']) => {
    feedId.current += 1;
    const id = feedId.current;
    // Clear any previous timers to prevent stacking into a vertical tower
    for (const timer of feedTimers.current) {
      window.clearTimeout(timer);
    }
    feedTimers.current = [];
    // Keep only the single latest event card at the top
    setFeed([{ id, title, detail, tone }]);
    const timer = window.setTimeout(() => {
      setFeed((previous) => previous.filter((item) => item.id !== id));
      feedTimers.current = feedTimers.current.filter((entry) => entry !== timer);
    }, 700);
    feedTimers.current.push(timer);
  }, []);

  const handleHud = useCallback((frame: HudFrame) => {
    hudRef.current = frame;
    if (!mountedRef.current) return;
    setHud(frame);
    setMode(frame.mode);
    if (frame.mode === 'running') setNeedsStart(false);
  }, []);

  const handleMode = useCallback((next: EngineMode) => {
    if (!mountedRef.current) return;
    setMode(next);
    if (next === 'running') {
      setNeedsStart(false);
      setShowGo(true);
      if (goTimer.current !== null) window.clearTimeout(goTimer.current);
      goTimer.current = window.setTimeout(() => {
        setShowGo(false);
        goTimer.current = null;
      }, 450);
    }
    if (next === 'countdown') setShowGo(false);
  }, []);

  const handleEvent = useCallback(
    (event: GameEvent) => {
      if (!mountedRef.current) return;
      switch (event.type) {
        case 'nearMiss':
          pushFeed('Near miss', `+${formatNumber(event.points)} pts · combo ${event.combo}`, 'lime');
          break;
        case 'checkpoint':
          pushFeed(
            `Checkpoint ${event.index}`,
            `+${formatNumber(event.bonus)} pts · fuel ${event.fuel}%`,
            'info',
          );
          break;
        case 'collision':
          setImpact({ id: Date.now(), severity: event.severity });
          if (event.severity > 0.6) {
            pushFeed('Heavy impact', `Health ${Math.round(event.health)}%`, 'danger');
          } else if (event.health < 30) {
            pushFeed('Body damage', `Health ${Math.round(event.health)}%`, 'warning');
          }
          break;
        case 'lowFuel':
          pushFeed('Low fuel', 'Find the next checkpoint', 'warning');
          break;
        case 'error':
          setError(event.message);
          break;
        default:
          break;
      }
    },
    [pushFeed],
  );

  const handleFinish = useCallback(
    (runResult: RunResult) => {
      if (!mountedRef.current || processedResults.current.has(runResult.id)) return;
      processedResults.current.add(runResult.id);
      const runRewards = addRunResult(runResult);
      setResult(runResult);
      setRewards(runRewards);
      setBreakdownTrophies(runRewards.unlockedTrophies);
      setNeedsStart(false);
      setShowGo(false);

      const audio = getAudioManager();
      for (const trophy of runRewards.unlockedTrophies) {
        pushToast({
          kind: 'trophy',
          title: `${TROPHY_TIER_META[trophy.tier].label} trophy · ${trophy.name}`,
          message: `${trophy.description} +${formatNumber(trophy.reward)} coins`,
        });
      }
      if (runRewards.unlockedTrophies.length > 0) audio.playCue('trophy');
      for (const mission of runRewards.completedMissions) {
        pushToast({
          kind: 'achievement',
          title: 'Daily objective complete',
          message: `${mission} — claim the reward in Missions.`,
        });
      }
      if (runRewards.completedMissions.length > 0) audio.playCue('confirm');
    },
    [addRunResult, pushToast],
  );

  callbacksRef.current = {
    hud: handleHud,
    event: handleEvent,
    mode: handleMode,
    finish: handleFinish,
  };
  bestScoreRef.current = bestScore;
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)');
    const noHover = window.matchMedia('(hover: none)');
    const update = () =>
      setTouch(
        coarse.matches ||
          noHover.matches ||
          navigator.maxTouchPoints > 0 ||
          settings.controls.scheme === 'touch',
      );
    update();
    coarse.addEventListener?.('change', update);
    noHover.addEventListener?.('change', update);
    return () => {
      coarse.removeEventListener?.('change', update);
      noHover.removeEventListener?.('change', update);
    };
  }, [settings.controls.scheme]);

  useEffect(() => {
    if (!touch || !tiltSelected) {
      setTiltReadout(null);
      setTiltFallback(false);
      return;
    }
    setTiltFallback(false);
    const controller = new TiltController(settings.controls.tilt, (readout) => {
      engineRef.current?.setAnalogSteer(readout.steer);
      const now = performance.now();
      if (now - tiltUpdateRef.current > 70) {
        tiltUpdateRef.current = now;
        setTiltReadout(readout);
      }
      if (
        readout.status === 'denied' ||
        readout.status === 'unsupported' ||
        readout.status === 'error'
      ) {
        setTiltFallback(true);
        engineRef.current?.setAnalogSteer(0);
      }
    });
    tiltRef.current = controller;
    void controller.start().then((status) => {
      if (!mountedRef.current) return;
      setTiltReadout(controller.getReadout());
      if (status === 'active') {
        controller.calibrate();
        setTiltFallback(false);
      } else {
        setTiltFallback(true);
      }
    });
    return () => {
      controller.stop();
      engineRef.current?.setAnalogSteer(0);
      if (tiltRef.current === controller) tiltRef.current = null;
    };
  }, [touch, tiltSelected, settings.controls.tilt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let engine: HighwayRushEngine | null = null;
    let startTimer: number | null = null;
    const audio = getAudioManager();

    document.body.classList.add('game-active');
    setMode('loading');
    setError(null);

    const readyCallback = () => {
      if (cancelled) return;
      setMode('ready');
      const auto = autoStart;
      if (!auto) {
        setNeedsStart(true);
        return;
      }
      startTimer = window.setTimeout(() => {
        startTimer = null;
        if (cancelled || !engine) return;
        if (audio.isUnlocked) engine.start(endless);
        else setNeedsStart(true);
      }, 220);
    };

    void import('@/lib/game/engine')
      .then(({ HighwayRushEngine: Engine }) => {
        if (cancelled || !canvasRef.current) return;
        try {
          engine = new Engine({
            canvas: canvasRef.current,
            destination,
            car,
            customization,
            settings,
            audio,
            bestScore: bestScoreRef.current,
            onHud: (frame) => callbacksRef.current.hud(frame),
            onEvent: (event) => callbacksRef.current.event(event),
            onModeChange: (next) => callbacksRef.current.mode(next),
            onFinish: (runResult) => callbacksRef.current.finish(runResult),
            onReady: readyCallback,
          });
          engineRef.current = engine;
        } catch {
          if (cancelled) return;
          setError('This browser could not start WebGL. Try enabling hardware acceleration or a different browser.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('The race engine failed to load. Check your connection and try again.');
      });

    return () => {
      cancelled = true;
      if (startTimer !== null) window.clearTimeout(startTimer);
      if (goTimer.current !== null) {
        window.clearTimeout(goTimer.current);
        goTimer.current = null;
      }
      for (const timer of feedTimers.current) window.clearTimeout(timer);
      feedTimers.current = [];
      engine?.dispose();
      if (engineRef.current === engine) engineRef.current = null;
      engineRef.current = null;
      document.body.classList.remove('game-active');
    };
    // Engine is intentionally created once per selected run configuration.
  }, [destination, car, customization, settings, endless, autoStart]);

  const evaluateLive = useCallback(() => {
    const frame = hudRef.current;
    if (!frame || frame.mode !== 'running') return;
    const unlocked = evaluateLiveTrophies({
      destinationId: destination.id,
      completed: false,
      score: frame.score,
      distanceM: frame.distanceM,
      coins: frame.coins,
      nearMisses: frame.nearMisses,
      driftDistanceM: frame.driftDistanceM,
      nitroUses: frame.nitroUses,
      checkpoints: Math.floor(frame.distanceM / 700),
      topSpeedKph: frame.topSpeedKph,
      crashFreeStreakM: frame.crashFreeStreakM,
    });
    if (unlocked.length === 0) return;
    setLiveTrophies((previous) => {
      const seen = new Set(previous.map((trophy) => trophy.id));
      return [...previous, ...unlocked.filter((trophy) => !seen.has(trophy.id))];
    });
    for (const trophy of unlocked) {
      pushToast({
        kind: 'trophy',
        title: `${TROPHY_TIER_META[trophy.tier].label} trophy · ${trophy.name}`,
        message: `${trophy.description} +${formatNumber(trophy.reward)} coins`,
      });
    }
    getAudioManager().playCue('trophy');
  }, [destination.id, evaluateLiveTrophies, pushToast]);

  useEffect(() => {
    if (mode !== 'running') return;
    evaluateLive();
    const timer = window.setInterval(evaluateLive, 1800);
    return () => window.clearInterval(timer);
  }, [mode, evaluateLive]);

  const startRun = useCallback(async () => {
    const audio = getAudioManager();
    await audio.unlock();
    if (tiltSelected) {
      const access = await requestTiltAccess();
      if (access === 'granted' || access === 'active') {
        const status = await tiltRef.current?.start();
        if (status === 'active') {
          tiltRef.current?.calibrate();
          setTiltFallback(false);
          setTiltReadout(tiltRef.current?.getReadout() ?? null);
        } else {
          setTiltFallback(true);
        }
      } else {
        setTiltFallback(true);
      }
    }
    setNeedsStart(false);
    engineRef.current?.start(endless);
  }, [endless, tiltSelected]);

  const restart = useCallback(() => {
    setResult(null);
    setRewards(null);
    setBreakdownTrophies([]);
    setLiveTrophies([]);
    setFeed([]);
    setImpact(null);
    setError(null);
    setShowGo(false);
    setMode('countdown');
    engineRef.current?.restart(endless);
  }, [endless]);

  const handleControl = useCallback(
    (action: 'steerLeft' | 'steerRight' | 'accelerate' | 'brake' | 'nitro', active: boolean) => {
      engineRef.current?.setVirtualControl(action, active);
    },
    [],
  );

  const handleDragSteer = useCallback((value: number) => {
    engineRef.current?.setAnalogSteer(value);
  }, []);

  const calibrateTilt = useCallback(() => {
    tiltRef.current?.calibrate();
    setTiltReadout(tiltRef.current?.getReadout() ?? null);
  }, []);

  const allTrophies = useMemo(() => {
    const map = new Map<string, TrophyDefinition>();
    for (const trophy of [...liveTrophies, ...breakdownTrophies]) map.set(trophy.id, trophy);
    return [...map.values()];
  }, [liveTrophies, breakdownTrophies]);

  const copy = result ? reasonCopy(result) : null;
  const totalCoins = result
    ? result.coins + allTrophies.reduce((sum, trophy) => sum + trophy.reward, 0)
    : 0;
  const interactive =
    (mode === 'running' || mode === 'countdown') && !result && !error && !needsStart;
  const showHud = hud && mode !== 'loading' && mode !== 'ready' && !error;
  const touchControlsEnabled =
    touch &&
    (controlMethod === 'auto' ||
      controlMethod === 'buttons' ||
      controlMethod === 'tilt' ||
      controlMethod === 'drag');
  const steeringHidden = tiltActive || dragSelected;
  const controlCopy =
    controlMethod === 'tilt'
      ? 'Tilt the phone to steer; calibrate any time from the centre chip.'
      : controlMethod === 'drag'
        ? 'Drag anywhere on the road to steer. Throttle, brake and nitro stay under your right thumb.'
        : controlMethod === 'buttons'
          ? 'Use the on-screen left and right pads, with throttle, brake and nitro on the right.'
          : controlMethod === 'gamepad'
            ? 'Connect a gamepad, then use the left stick and triggers.'
            : controlMethod === 'keyboard'
              ? 'Steer with A/D or the arrow keys, throttle with W or up, and fire nitro with space.'
              : 'Touch devices get steering pads and throttle buttons; keyboards and gamepads work automatically.';

  return (
    <FullScreen>
      <Canvas ref={canvasRef} aria-label={`${destination.name} race`} />
      <Vignette />
      {dragSelected && <DragSteerLayer active={interactive} onSteer={handleDragSteer} />}

      {showHud &&
        hud &&
        (settings.gameplay.showHud ? (
          <RaceHud
            hud={hud}
            destination={destination}
            runMode={endless ? 'endless' : 'race'}
            speedUnit={speedUnit}
            bestScore={bestScore}
            showMinimap={settings.gameplay.showMinimap}
            showFps={settings.graphics.showFps}
            touch={touch}
            onPause={() => engineRef.current?.pause()}
          />
        ) : (
          <RaceHudFallback onPause={() => engineRef.current?.pause()} />
        ))}

      {feed.length > 0 && (
        <FeedLayer aria-hidden="true">
          {feed.map((item) => (
            <FeedItem key={item.id} $tone={item.tone}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </FeedItem>
          ))}
        </FeedLayer>
      )}

      {impact && <Impact key={impact.id} $severity={impact.severity} />}

      {touchControlsEnabled && (
        <TouchControls
          active={interactive}
          onControl={handleControl}
          showSteering={!steeringHidden}
          steeringLabel={dragSelected ? 'Drag to steer' : 'Tilt to steer'}
        />
      )}

      {touch && tiltSelected && interactive && (
        <TiltFeedback readout={tiltReadout} fallback={tiltFallback} onCalibrate={calibrateTilt} />
      )}

      {mode === 'countdown' && hud && (
        <Countdown aria-live="polite" aria-atomic="true">
          <small>Get ready</small>
          <strong key={hud.countdown}>{hud.countdown > 0 ? hud.countdown : 'GO'}</strong>
          <span>
            {destination.name} · {car.name}
          </span>
        </Countdown>
      )}

      {showGo && mode === 'running' && <GoFlash aria-hidden="true">GO</GoFlash>}

      {mode === 'loading' && !error && (
        <Loading>
          <Loader2 size={30} />
          <strong>Building the highway</strong>
          <span>{destination.name}</span>
        </Loading>
      )}

      {needsStart && !error && !result && (
        <Overlay $tone="lime">
          <StartCard>
            <StartKicker>
              <Flag size={11} /> {endless ? 'Endless run' : 'Route race'} ·{' '}
              {destination.region}
            </StartKicker>
            <StartTitle>
              Ready to
              <em>launch.</em>
            </StartTitle>
            <StartMeta>
              <span>
                <Car size={12} /> {car.name}
              </span>
              <span>
                <Gauge size={12} /> {settings.gameplay.difficulty}
              </span>
              <span>
                <Target size={12} />{' '}
                {endless ? 'No finish line' : formatDistance(destination.distanceTarget)}
              </span>
            </StartMeta>
            <StartNote>
              Audio needs one tap before the engine can start. {controlCopy}{' '}
              {tiltSelected && touch
                ? 'Your browser may ask for motion access on this tap.'
                : 'Keyboard and gamepad input stay available throughout.'}
            </StartNote>
            <StartActions>
              <Button size="xl" icon={<Play size={16} fill="currentColor" />} onClick={startRun}>
                Start engine
              </Button>
              <Button variant="ghost" size="xl" onClick={() => onExitRef.current()}>
                Back to setup
              </Button>
            </StartActions>
            <KeyStrip>
              <span>
                <kbd>←</kbd>
                <kbd>→</kbd> steer
              </span>
              <span>
                <kbd>↑</kbd> throttle
              </span>
              <span>
                <kbd>SPACE</kbd> nitro
              </span>
              <span>
                <kbd>ESC</kbd> pause
              </span>
            </KeyStrip>
          </StartCard>
        </Overlay>
      )}

      {mode === 'paused' && !result && !error && (
        <Overlay>
          <PauseCard role="dialog" aria-modal="true" aria-label="Race paused">
            <PauseTop>
              <StartKicker>
                <Settings2 size={11} /> Race paused
              </StartKicker>
              <h2>Take a breath.</h2>
              <p>
                {destination.name} · {car.name}. The highway is frozen while you are.
              </p>
            </PauseTop>
            <PauseStats>
              <div>
                <span>Score</span>
                <strong>{formatNumber(hud?.score ?? 0)}</strong>
              </div>
              <div>
                <span>Distance</span>
                <strong>{formatDistance(hud?.distanceM ?? 0)}</strong>
              </div>
              <div>
                <span>Coins</span>
                <strong>{formatNumber(hud?.coins ?? 0)}</strong>
              </div>
            </PauseStats>
            <PauseActions>
              <Button
                size="lg"
                icon={<Play size={15} fill="currentColor" />}
                onClick={() => engineRef.current?.resume()}
              >
                Resume
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<RotateCcw size={14} />}
                onClick={restart}
              >
                Restart run
              </Button>
              <Button
                variant="danger"
                size="lg"
                icon={<Flag size={14} />}
                onClick={() => engineRef.current?.quit()}
              >
                End run &amp; bank progress
              </Button>
            </PauseActions>
          </PauseCard>
        </Overlay>
      )}

      {result && copy && (
        <Overlay>
          <ResultCard role="dialog" aria-modal="true" aria-label="Run results">
            <ResultHead $win={copy.win}>
              <ResultTop>
                <div>
                  <ResultKicker>
                    {copy.win ? <Trophy size={11} /> : <Flag size={11} />}
                    {endless ? 'Endless session' : 'Route results'} · {destination.region}
                  </ResultKicker>
                  <ResultTitle>{copy.title}</ResultTitle>
                  <ResultSub>{copy.sub}</ResultSub>
                </div>
                <ScoreBlock>
                  <span>Final score</span>
                  <strong>{formatNumber(result.score)}</strong>
                  <em>
                    <Trophy size={9} /> Best {formatNumber(Math.max(rewards?.previousBest ?? 0, result.score))}
                  </em>
                  {rewards?.newBest && (
                    <div>
                      <NewBest>
                        <Sparkles size={9} /> New personal best
                      </NewBest>
                    </div>
                  )}
                </ScoreBlock>
              </ResultTop>
            </ResultHead>

            <ResultBody>
              <StatGrid>
                <ResultStat>
                  <Flag size={14} />
                  <div>
                    <span>Distance</span>
                    <strong>{formatDistance(result.distanceM)}</strong>
                  </div>
                </ResultStat>
                <ResultStat>
                  <Gauge size={14} />
                  <div>
                    <span>Top speed</span>
                    <strong>{formatSpeed(result.topSpeedKph, speedUnit)}</strong>
                  </div>
                </ResultStat>
                <ResultStat>
                  <Coins size={14} />
                  <div>
                    <span>Coins collected</span>
                    <strong>{formatNumber(result.coins)}</strong>
                  </div>
                </ResultStat>
                <ResultStat>
                  <Target size={14} />
                  <div>
                    <span>Near misses</span>
                    <strong>{formatNumber(result.nearMisses)}</strong>
                  </div>
                </ResultStat>
                <ResultStat>
                  <Zap size={14} />
                  <div>
                    <span>Nitro uses</span>
                    <strong>{formatNumber(result.nitroUses)}</strong>
                  </div>
                </ResultStat>
                <ResultStat>
                  <Sparkles size={14} />
                  <div>
                    <span>Drift distance</span>
                    <strong>{formatDistance(result.driftDistanceM)}</strong>
                  </div>
                </ResultStat>
                <ResultStat>
                  <CheckCircle2 size={14} />
                  <div>
                    <span>Checkpoints</span>
                    <strong>{formatNumber(result.checkpoints)}</strong>
                  </div>
                </ResultStat>
                <ResultStat>
                  <Heart size={14} />
                  <div>
                    <span>Run time</span>
                    <strong>{formatDuration(result.durationMs)}</strong>
                  </div>
                </ResultStat>
              </StatGrid>

              <RewardRow>
                <div>
                  <Coins size={20} />
                  <span>Coins banked this run</span>
                </div>
                <strong>+{formatNumber(totalCoins)}</strong>
              </RewardRow>

              {allTrophies.length > 0 && (
                <UnlockBlock>
                  <h3>
                    <Award size={11} /> Trophies unlocked ({allTrophies.length})
                  </h3>
                  <UnlockList>
                    {allTrophies.slice(0, 5).map((trophy) => (
                      <Unlock key={trophy.id} $tier={trophy.tier}>
                        <Trophy size={13} />
                        <div>
                          <strong>{trophy.name}</strong>
                          <span>{trophy.description}</span>
                        </div>
                        <b>+{formatNumber(trophy.reward)}</b>
                      </Unlock>
                    ))}
                  </UnlockList>
                  {allTrophies.length > 5 && (
                    <p style={{ marginTop: 7, color: 'var(--text-dim)', fontSize: 9 }}>
                      +{allTrophies.length - 5} more in the trophy room.
                    </p>
                  )}
                </UnlockBlock>
              )}

              {rewards && rewards.completedMissions.length > 0 && (
                <MissionList>
                  {rewards.completedMissions.map((mission) => (
                    <span key={mission}>
                      <CheckCircle2 size={9} /> {mission}
                    </span>
                  ))}
                </MissionList>
              )}

              <ResultActions>
                <Button
                  size="lg"
                  icon={<RotateCcw size={14} />}
                  onClick={restart}
                >
                  Race again
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Settings2 size={14} />}
                  onClick={() => onExitRef.current()}
                >
                  Change setup
                </Button>
                <ButtonLink
                  href="/leaderboard"
                  variant="ghost"
                  size="lg"
                  icon={<ChevronRight size={14} />}
                >
                  Local leaderboard
                </ButtonLink>
                <ButtonLink
                  href="/garage"
                  variant="ghost"
                  size="lg"
                  icon={<Car size={14} />}
                >
                  Garage
                </ButtonLink>
              </ResultActions>
            </ResultBody>
          </ResultCard>
        </Overlay>
      )}

      {error && (
        <Overlay>
          <ErrorCard role="alert">
            <FatalIcon>
              <Skull size={24} />
            </FatalIcon>
            <StartKicker>
              <Fuel size={11} /> Engine fault
            </StartKicker>
            <StartTitle style={{ fontSize: 'clamp(30px, 4.6vw, 48px)' }}>
              The road
              <em>stalled.</em>
            </StartTitle>
            <StartNote>{error}</StartNote>
            <StartActions>
              <Button size="lg" icon={<ArrowRight size={14} />} onClick={() => onExitRef.current()}>
                Back to setup
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<RotateCcw size={14} />}
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
            </StartActions>
          </ErrorCard>
        </Overlay>
      )}

      <LiveRegion aria-live="polite">
        {mode === 'running' ? 'Race in progress.' : ''}
        {result ? `Run complete. Score ${formatNumber(result.score)}.` : ''}
      </LiveRegion>
    </FullScreen>
  );
}

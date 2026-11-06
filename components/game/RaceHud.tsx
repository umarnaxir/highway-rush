'use client';

import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  Activity,
  Coins,
  Flag,
  Fuel,
  Gauge,
  Heart,
  Pause,
  Trophy,
  Zap,
} from 'lucide-react';
import type { DestinationDefinition, HudFrame, HudTraffic, SpeedUnit } from '@/lib/types';
import { formatDistance, formatNumber, formatSpeedValue } from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

interface RaceHudProps {
  hud: HudFrame;
  destination: DestinationDefinition;
  runMode: 'race' | 'endless';
  speedUnit: SpeedUnit;
  bestScore: number;
  showMinimap: boolean;
  showFps: boolean;
  touch: boolean;
  onPause: () => void;
}

const Root = styled.div`
  position: absolute;
  inset: 0;
  z-index: 12;
  pointer-events: none;
  color: var(--text);
  font-family: ${({ theme }) => theme.fonts.body};
  user-select: none;
`;

const Top = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 360px) minmax(0, 1fr);
  align-items: start;
  gap: 20px;
  padding: 16px clamp(14px, 2vw, 30px) 40px;
  background: linear-gradient(
    180deg,
    rgba(3, 5, 7, 0.92) 0%,
    rgba(3, 5, 7, 0.55) 60%,
    transparent 100%
  );

  ${media.desktop} {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  ${media.mobile} {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding-top: 12px;
  }
`;

const Route = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ModeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--lime);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;

  i {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 9px currentColor;
    animation: pulseGlow 2s ease-in-out infinite;
  }
`;

const RouteName = styled.strong`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(17px, 2vw, 25px);
  font-style: italic;
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: 0.005em;
  text-transform: uppercase;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
`;

const RouteMeta = styled.span`
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-dim);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;

  b {
    color: var(--text-muted);
    font-weight: 800;
  }
`;

const DistanceBlock = styled.div`
  padding-top: 5px;
  min-width: 0;

  ${media.desktop} {
    display: none;
  }
`;

const DistanceTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 7px;
  span {
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  b {
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 10px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

const Track = styled.div`
  position: relative;
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.13);
`;

const Fill = styled.div<{ $value: number; $endless?: boolean }>`
  height: 100%;
  width: ${({ $value }) => `${Math.max(0, Math.min(100, $value * 100))}%`};
  border-radius: inherit;
  background: ${({ $endless, theme }) =>
    $endless
      ? `repeating-linear-gradient(90deg, ${theme.colors.lime} 0 18px, rgba(215,255,63,.25) 18px 30px)`
      : theme.colors.lime};
  box-shadow: 0 0 12px rgba(215, 255, 63, 0.55);
  transition: width 0.25s linear;
`;

const TopRight = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 12px;
  justify-self: end;
`;

const Score = styled.div`
  text-align: right;
  span {
    display: block;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  strong {
    display: block;
    margin-top: 2px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(24px, 3vw, 38px);
    font-weight: 800;
    font-style: italic;
    line-height: 0.9;
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  }
  em {
    display: block;
    margin-top: 4px;
    color: var(--text-dim);
    font-size: 8px;
    font-style: normal;
    letter-spacing: 0.08em;
    font-variant-numeric: tabular-nums;
  }

  ${media.mobile} {
    strong {
      font-size: 22px;
    }
    em {
      display: none;
    }
  }
`;

const Wallet = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 0 9px;
  border-radius: 4px;
  border: 1px solid rgba(255, 212, 59, 0.26);
  background: rgba(8, 11, 14, 0.68);
  color: var(--warning);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  svg {
    width: 12px;
    height: 12px;
  }

  ${media.mobile} {
    padding: 0 7px;
  }
`;

const PauseButton = styled.button`
  pointer-events: auto;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(8, 11, 14, 0.7);
  color: var(--text);
  backdrop-filter: blur(10px);
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--lime);
    color: var(--lime);
    background: rgba(215, 255, 63, 0.08);
  }

  ${media.mobile} {
    width: 34px;
    height: 34px;
  }
`;

const Fps = styled.span`
  position: absolute;
  top: 58px;
  right: clamp(14px, 2vw, 30px);
  color: rgba(255, 255, 255, 0.38);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 8px;
  letter-spacing: 0.08em;
`;

const Combo = styled.div`
  position: absolute;
  top: clamp(48px, 7vh, 68px);
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  animation: comboPop 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;

  ${media.mobile} {
    top: clamp(40px, 6vh, 56px);
  }

  span {
    display: block;
    color: var(--text-dim);
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }
  strong {
    display: block;
    margin-top: 1px;
    color: var(--lime);
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(24px, 3.2vw, 38px);
    font-style: italic;
    font-weight: 900;
    line-height: 0.92;
    letter-spacing: -0.02em;
    text-shadow: 0 0 24px rgba(215, 255, 63, 0.45);
    font-variant-numeric: tabular-nums;
  }
  em {
    display: block;
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 8px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  @keyframes comboPop {
    from {
      opacity: 0;
      transform: translateX(-50%) scale(0.86);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
  }
`;

const Radar = styled.div`
  position: absolute;
  top: 50%;
  right: clamp(14px, 2vw, 26px);
  width: 92px;
  padding: 8px 8px 6px;
  transform: translateY(-50%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 5px;
  background: rgba(4, 7, 9, 0.6);
  backdrop-filter: blur(8px);

  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-dim);
    font-size: 6px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 4px;

    i {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--lime);
      box-shadow: 0 0 6px var(--lime);
    }
  }

  ${media.desktop} {
    top: 116px;
    transform: none;
  }
  ${media.mobile} {
    top: 102px;
    right: 12px;
    width: 68px;
    padding: 6px;
  }
`;

const SpeedCluster = styled.div<{ $touch: boolean }>`
  position: absolute;
  left: clamp(15px, 2vw, 30px);
  bottom: ${({ $touch }) => ($touch ? '172px' : 'clamp(18px, 3.5vh, 32px)')};
  display: flex;
  align-items: flex-end;
  gap: clamp(10px, 1.5vw, 18px);

  ${media.mobile} {
    bottom: ${({ $touch }) => ($touch ? '156px' : '18px')};
    gap: 9px;
  }
`;

const Speed = styled.div`
  min-width: 0;
`;

const SpeedLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-dim);
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  margin-bottom: 2px;

  svg {
    width: 10px;
    height: 10px;
    color: var(--lime);
  }
`;

const SpeedLine = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const SpeedNumber = styled.strong`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(54px, 7.5vw, 104px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.78;
  letter-spacing: -0.045em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);

  ${media.mobile} {
    font-size: clamp(46px, 14vw, 72px);
  }
`;

const Unit = styled.span`
  color: var(--text-muted);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding-bottom: 4px;
`;

const Rpm = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  margin-top: 8px;
  height: 14px;

  i {
    width: 3px;
    height: 100%;
    border-radius: 1px;
    background: rgba(255, 255, 255, 0.14);
    transform-origin: bottom;
    transition:
      background 0.12s ease,
      box-shadow 0.12s ease;

    &:nth-child(-n + 6) {
      height: 62%;
    }
    &:nth-child(n + 7):nth-child(-n + 12) {
      height: 80%;
    }
    &:nth-child(n + 13) {
      height: 100%;
    }
    &.on {
      background: var(--lime);
      box-shadow: 0 0 7px rgba(215, 255, 63, 0.55);
    }
    &.red.on {
      background: var(--danger);
      box-shadow: 0 0 7px rgba(255, 93, 93, 0.55);
    }
  }

  ${media.mobile} {
    gap: 2px;
    i {
      width: 2.5px;
    }
  }
`;

const Gear = styled.div`
  text-align: center;
  padding-bottom: 2px;
  span {
    display: block;
    color: var(--text-dim);
    font-size: 6px;
    font-weight: 800;
    letter-spacing: 0.2em;
  }
  strong {
    display: grid;
    place-items: center;
    width: clamp(36px, 4vw, 46px);
    height: clamp(36px, 4vw, 46px);
    margin-top: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    background: rgba(4, 7, 9, 0.5);
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(19px, 2.4vw, 25px);
    font-style: italic;
    line-height: 1;
    color: var(--text);
  }
`;

const StateChips = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const Chip = styled.span<{ $tone?: 'lime' | 'danger' | 'warning' | 'info' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 2px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'danger'
        ? 'rgba(255,93,93,.42)'
        : $tone === 'warning'
          ? 'rgba(251,191,36,.42)'
          : $tone === 'info'
            ? 'rgba(56,189,248,.4)'
            : 'rgba(215,255,63,.42)'};
  background: rgba(3, 5, 7, 0.55);
  color: ${({ $tone, theme }) =>
    $tone === 'danger'
      ? theme.colors.danger
      : $tone === 'warning'
        ? theme.colors.warning
        : $tone === 'info'
          ? theme.colors.info
          : theme.colors.lime};
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const Gauges = styled.div<{ $touch: boolean }>`
  position: absolute;
  right: clamp(15px, 2vw, 30px);
  bottom: ${({ $touch }) => ($touch ? '172px' : 'clamp(18px, 3.5vh, 32px)')};
  width: clamp(146px, 16vw, 196px);
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${media.mobile} {
    bottom: ${({ $touch }) => ($touch ? '156px' : '18px')};
    width: 126px;
    gap: 6px;
  }
`;

const GaugeRow = styled.div`
  position: relative;
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 4px;
  background: rgba(4, 7, 9, 0.52);
  backdrop-filter: blur(7px);

  ${media.mobile} {
    padding: 5px 6px;
  }
`;

const GaugeTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;

  span {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-muted);
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  b {
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 9px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  svg {
    width: 10px;
    height: 10px;
    color: var(--color, var(--lime));
  }

  ${media.mobile} {
    span {
      font-size: 6px;
      letter-spacing: 0.1em;
    }
    b {
      font-size: 8px;
    }
  }
`;

const GaugeTrack = styled.div`
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  overflow: hidden;
`;

const GaugeFill = styled.div<{ $value: number; $color: string }>`
  height: 100%;
  width: ${({ $value }) => `${Math.max(0, Math.min(100, $value))}%`};
  border-radius: inherit;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 9px ${({ $color }) => $color}77;
  transition:
    width 0.2s linear,
    background 0.2s ease;
`;

const Hint = styled.div`
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;

  ${media.desktop} {
    display: none;
  }
`;

const MinimalPause = styled(PauseButton)`
  position: absolute;
  top: 14px;
  right: 14px;
`;

function TrafficRadar({ traffic }: { traffic: HudTraffic[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background road polygon
    ctx.fillStyle = 'rgba(10, 15, 20, 0.55)';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, 4);
    ctx.lineTo(w * 0.8, 4);
    ctx.lineTo(w * 0.94, h - 4);
    ctx.lineTo(w * 0.06, h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(215, 255, 63, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center dashed divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 6);
    ctx.lineTo(w * 0.5, h - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // Traffic cars
    for (let i = 0; i < traffic.length; i += 1) {
      const car = traffic[i];
      const x = w * 0.5 + (car.x / 9) * (w * 0.36);
      const y = 8 + ((car.z + 100) / 124) * (h - 22);
      ctx.fillStyle = car.color || '#38bdf8';
      ctx.fillRect(x - 3, y - 4, 6, 8);
    }

    // Player indicator
    ctx.fillStyle = '#d7ff3f';
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h - 14);
    ctx.lineTo(w * 0.5 - 4, h - 4);
    ctx.lineTo(w * 0.5 + 4, h - 4);
    ctx.closePath();
    ctx.fill();
  }, [traffic]);

  return <canvas ref={canvasRef} width={80} height={126} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 4 }} />;
}

export function RaceHud({
  hud,
  destination,
  runMode,
  speedUnit,
  bestScore,
  showMinimap,
  showFps,
  touch,
  onPause,
}: RaceHudProps) {
  const speed = formatSpeedValue(hud.speedKph, speedUnit);
  const target = runMode === 'endless' ? 0 : hud.targetM;
  const progress = target > 0 ? Math.min(1, hud.distanceM / target) : 0;
  const rpmBars = 20;
  const litBars = Math.round(Math.min(1, hud.rpm) * rpmBars);
  const healthColor = hud.health < 28 ? 'var(--danger)' : hud.health < 55 ? 'var(--warning)' : 'var(--lime)';
  const fuelColor = hud.fuel < 20 ? 'var(--danger)' : hud.fuel < 40 ? 'var(--warning)' : 'var(--info)';

  return (
    <Root>
      <Top>
        <Route>
          <ModeRow>
            <i /> {runMode === 'endless' ? 'Endless' : 'Route race'} · {destination.region}
          </ModeRow>
          <RouteName>{destination.name}</RouteName>
          <RouteMeta>
            <Flag size={9} /> {runMode === 'endless' ? 'No finish line' : formatDistance(target)} ·{' '}
            <b>{formatNumber(hud.nearMisses)} near misses</b>
          </RouteMeta>
        </Route>

        <DistanceBlock>
          <DistanceTop>
            <span>{runMode === 'endless' ? 'Distance' : 'Route progress'}</span>
            <b>
              {formatDistance(hud.distanceM)}
              {target > 0 ? ` / ${formatDistance(target)}` : ''}
            </b>
          </DistanceTop>
          <Track>
            <Fill $value={progress} $endless={runMode === 'endless'} />
          </Track>
        </DistanceBlock>

        <TopRight>
          <Score>
            <span>Score</span>
            <strong>{formatNumber(hud.score)}</strong>
            <em>
              <Trophy size={8} style={{ verticalAlign: -1, marginRight: 3 }} />
              Best {formatNumber(Math.max(bestScore, hud.bestScore))}
            </em>
          </Score>
          <Wallet aria-label={`${hud.coins} run coins`}>
            <Coins /> {formatNumber(hud.coins)}
          </Wallet>
          <PauseButton type="button" onClick={onPause} aria-label="Pause race">
            <Pause size={15} fill="currentColor" />
          </PauseButton>
        </TopRight>
      </Top>

      {showFps && <Fps>{hud.fps} FPS</Fps>}

      {hud.combo > 0 && (
        <Combo key={hud.combo}>
          <span>Near-miss combo</span>
          <strong>×{hud.multiplier.toFixed(2)}</strong>
          <em>{hud.combo} chained</em>
        </Combo>
      )}

      {showMinimap && (
        <Radar aria-hidden="true">
          <label>
            Radar <i />
          </label>
          <TrafficRadar traffic={hud.traffic} />
        </Radar>
      )}

      <SpeedCluster $touch={touch}>
        <Speed>
          <SpeedLabel>
            <Gauge /> Speed
          </SpeedLabel>
          <SpeedLine>
            <SpeedNumber>{speed}</SpeedNumber>
            <Unit>{speedUnit === 'mph' ? 'MPH' : 'KM/H'}</Unit>
          </SpeedLine>
          <Rpm aria-hidden="true">
            {Array.from({ length: rpmBars }, (_, index) => (
              <i
                key={index}
                className={`${index < litBars ? 'on' : ''} ${index >= rpmBars - 4 ? 'red' : ''}`}
              />
            ))}
          </Rpm>
          <StateChips>
            {hud.boosting && (
              <Chip>
                <Zap size={8} /> Nitro
              </Chip>
            )}
            {hud.drifting && (
              <Chip $tone="warning">
                <Activity size={8} /> Drift
              </Chip>
            )}
            {!hud.boosting && !hud.drifting && (
              <Chip $tone="info">
                <Flag size={8} /> {destination.difficulty}
              </Chip>
            )}
          </StateChips>
        </Speed>
        <Gear>
          <span>GEAR</span>
          <strong>{hud.gear}</strong>
        </Gear>
      </SpeedCluster>

      <Gauges $touch={touch}>
        <GaugeRow>
          <GaugeTop style={{ ['--color' as string]: healthColor }}>
            <span>
              <Heart /> Health
            </span>
            <b>{Math.round(hud.health)}%</b>
          </GaugeTop>
          <GaugeTrack>
            <GaugeFill $value={hud.health} $color={healthColor} />
          </GaugeTrack>
        </GaugeRow>
        <GaugeRow>
          <GaugeTop style={{ ['--color' as string]: fuelColor }}>
            <span>
              <Fuel /> Fuel
            </span>
            <b>{Math.round(hud.fuel)}%</b>
          </GaugeTop>
          <GaugeTrack>
            <GaugeFill $value={hud.fuel} $color={fuelColor} />
          </GaugeTrack>
        </GaugeRow>
        <GaugeRow>
          <GaugeTop style={{ ['--color' as string]: 'var(--lime)' }}>
            <span>
              <Zap /> Nitro
            </span>
            <b>{Math.round(hud.nitro)}%</b>
          </GaugeTop>
          <GaugeTrack>
            <GaugeFill $value={hud.nitro} $color="var(--lime)" />
          </GaugeTrack>
        </GaugeRow>
      </Gauges>

      {!touch && (
        <Hint>
          <span>Pause · Esc</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>Nitro · Space</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>{formatDistance(hud.distanceM)} driven</span>
        </Hint>
      )}
    </Root>
  );
}

export function RaceHudFallback({ onPause }: { onPause: () => void }) {
  return (
    <Root>
      <MinimalPause type="button" onClick={onPause} aria-label="Pause race">
        <Pause size={15} fill="currentColor" />
      </MinimalPause>
    </Root>
  );
}

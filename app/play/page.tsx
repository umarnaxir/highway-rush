'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import {
  ArrowLeft,
  Car,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flag,
  Flame,
  Gauge,
  Lock,
  Play,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { PreviewCanvas } from '@/components/game/PreviewCanvas';
import { CARS, CARS_BY_ID, effectiveCarStats, getDefaultCustomization } from '@/lib/data/cars';
import {
  DESTINATIONS,
  DESTINATIONS_BY_ID,
  meetsDestinationRequirement,
} from '@/lib/data/destinations';
import { useGameStore, getUnlockedTrophyCount } from '@/lib/store/useGameStore';
import { useUiStore } from '@/lib/store/useUiStore';
import { useMenuAudio } from '@/lib/hooks/useMenuAudio';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { requestTiltAccess } from '@/lib/game/tilt';
import { formatDistance, formatNumber } from '@/lib/ui/format';
import type { Difficulty } from '@/lib/types';
import { media } from '@/lib/ui/theme';

const RaceStage = dynamic(() => import('@/components/game/RaceStage').then((mod) => mod.RaceStage), {
  ssr: false,
  loading: () => (
    <RaceLoading>
      <div>
        <Zap size={32} />
        <strong>Entering Highway</strong>
        <span>Syncing 3D Race Engine</span>
      </div>
    </RaceLoading>
  ),
});

type RunMode = 'race' | 'endless';

const difficulties: Array<{ value: Difficulty; label: string }> = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'standard', label: 'Standard' },
  { value: 'hard', label: 'Hard' },
  { value: 'insane', label: 'Insane' },
];

const difficultyTone: Record<Difficulty, string> = {
  relaxed: 'var(--info)',
  standard: 'var(--lime)',
  hard: 'var(--warning)',
  insane: 'var(--danger)',
};

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 24px rgba(215, 255, 63, 0.4), 0 0 50px rgba(215, 255, 63, 0.15); }
  50% { box-shadow: 0 0 38px rgba(215, 255, 63, 0.65), 0 0 75px rgba(215, 255, 63, 0.3); }
`;

const RaceLoading = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: #030506;
  text-align: center;

  > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  svg {
    color: var(--lime);
    animation: ${pulseGlow} 1.4s ease-in-out infinite;
  }

  strong {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 22px;
    font-style: italic;
    text-transform: uppercase;
  }

  span {
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.25em;
    text-transform: uppercase;
  }
`;

const Stage = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #030507;
  color: var(--text);
  user-select: none;
`;

const BackgroundCanvas = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
`;

const Vignette = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(3, 5, 7, 0.65) 100%),
    linear-gradient(180deg, rgba(3, 5, 7, 0.85) 0%, transparent 16%, transparent 55%, rgba(3, 5, 7, 0.95) 100%);
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: max(12px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(14px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const TopNav = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  pointer-events: auto;
  width: 100%;
`;

const BackPill = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 4px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.84);
  backdrop-filter: blur(12px);
  color: var(--text);
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 13px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--lime);
    color: var(--lime);
    transform: translateX(-3px);
  }
`;

const ScreenTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--text-dim);

  span {
    color: var(--lime);
  }

  ${media.mobile} {
    display: none;
  }
`;

const HeaderStats = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 38px;
    padding: 0 12px;
    border-radius: 4px;
    border: 1px solid var(--line-strong);
    background: rgba(10, 14, 18, 0.84);
    backdrop-filter: blur(12px);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;

    &.vehicle {
      color: var(--text);
      text-decoration: none;
      transition: all 0.15s ease;

      svg {
        color: var(--lime);
        width: 13px;
        height: 13px;
      }

      .class-tag {
        font-size: 8px;
        color: var(--lime);
        background: rgba(215, 255, 63, 0.12);
        padding: 2px 5px;
        border-radius: 2px;
        margin-left: 2px;
      }

      &:hover {
        border-color: var(--lime);
        transform: translateY(-1px);
      }
    }

    &.currency {
      color: var(--warning);
      border-color: rgba(251, 191, 36, 0.35);
      font-family: ${({ theme }) => theme.fonts.mono};
      svg {
        color: var(--warning);
        width: 13px;
        height: 13px;
      }
    }
  }
`;

/* CENTERED HERO SECTION */
const CenterHero = styled.div`
  pointer-events: auto;
  margin: auto auto 12px auto;
  max-width: 880px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 0 12px;
`;

const KickerBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(215, 255, 63, 0.35);
  background: rgba(215, 255, 63, 0.08);
  color: var(--lime);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
`;

const HeroTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(34px, 5.2vw, 68px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  text-shadow: 0 6px 36px rgba(0, 0, 0, 0.9);
  margin: 0;

  em {
    color: var(--lime);
    font-style: inherit;
    margin-left: 6px;
  }
`;

const HeroTagline = styled.p`
  max-width: 580px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  font-style: italic;
  line-height: 1.4;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);

  ${media.mobile} {
    display: none;
  }
`;

const BadgesStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
`;

const MetricBadge = styled.div<{ $tone?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid ${({ $tone }) => ($tone ? $tone : 'var(--line-strong)')};
  background: rgba(10, 14, 18, 0.82);
  backdrop-filter: blur(10px);
  color: ${({ $tone }) => ($tone ? $tone : 'var(--text)')};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;

  b {
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.mono};
  }
`;

const MainLaunchBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 320px;
  padding: 16px 32px;
  border-radius: 4px;
  border: none;
  background: var(--lime);
  color: #07090b;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 18px;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  animation: ${pulseGlow} 2.6s infinite ease-in-out;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover:not(:disabled) {
    transform: scale(1.03);
    background: #e6ff66;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--line-strong);
    color: var(--text-dim);
    animation: none;
  }

  ${media.mobile} {
    width: 100%;
    min-width: 0;
    padding: 14px 20px;
  }
`;

/* CENTERED BRIEFING TERMINAL & MODIFIERS */
const ModifiersBar = styled.div`
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
  max-width: 720px;
  margin: 0 auto 10px auto;
`;

const ModeGroup = styled.div`
  display: flex;
  align-items: center;
  background: rgba(10, 14, 18, 0.85);
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  padding: 3px;
  backdrop-filter: blur(12px);
`;

const ModePill = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 3px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(215, 255, 63, 0.16)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 11px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text);
  }
`;

const DiffGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(10, 14, 18, 0.85);
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  padding: 3px;
  backdrop-filter: blur(12px);
`;

const DiffPill = styled.button<{ $active: boolean; $tone: string }>`
  padding: 6px 10px;
  border-radius: 3px;
  border: 1px solid ${({ $active, $tone }) => ($active ? $tone : 'transparent')};
  background: ${({ $active, $tone }) => ($active ? `${$tone}24` : 'transparent')};
  color: ${({ $active, $tone }) => ($active ? $tone : 'var(--text-dim)')};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text);
  }
`;

/* CENTERED TRACK CAROUSEL */
const CarouselWrap = styled.div`
  pointer-events: auto;
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ArrowNavBtn = styled.button`
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 4px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.85);
  backdrop-filter: blur(12px);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--lime);
    color: var(--lime);
    background: rgba(215, 255, 63, 0.12);
    transform: scale(1.05);
  }

  ${media.mobile} {
    display: none;
  }
`;

const TrackRail = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 6px 4px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  width: 100%;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(215, 255, 63, 0.25);
    border-radius: 2px;
  }
`;

const TrackCard = styled.button<{ $active: boolean; $locked: boolean }>`
  min-width: 136px;
  flex: 0 0 auto;
  padding: 10px 14px;
  border-radius: 5px;
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.lime : 'var(--line-strong)')};
  background: ${({ $active }) =>
    $active ? 'rgba(215, 255, 63, 0.16)' : 'rgba(10, 14, 18, 0.86)'};
  backdrop-filter: blur(14px);
  box-shadow: ${({ $active }) =>
    $active ? '0 0 20px rgba(215, 255, 63, 0.35)' : '0 8px 24px rgba(0, 0, 0, 0.5)'};
  text-align: left;
  cursor: pointer;
  transform: ${({ $active }) => ($active ? 'translateY(-3px)' : 'none')};
  transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: ${({ $locked }) => ($locked ? 0.65 : 1)};

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-dim)')};
    margin-bottom: 4px;
  }

  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 12px;
    font-style: italic;
    font-weight: 900;
    text-transform: uppercase;
    color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text)')};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-bottom {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 8px;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
  }

  &:hover {
    border-color: var(--lime);
    transform: translateY(-4px);
    background: rgba(215, 255, 63, 0.1);
  }
`;

export default function PlayPage() {
  const [racing, setRacing] = useState(false);
  const [runMode, setRunMode] = useState<RunMode>('race');
  const [starting, setStarting] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  const coins = useGameStore((state) => state.coins);
  const selectedCar = useGameStore((state) => state.selectedCar);
  const unlockedDestinations = useGameStore((state) => state.unlockedDestinations);
  const selectedDestination = useGameStore((state) => state.selectedDestination);
  const selectDestination = useGameStore((state) => state.selectDestination);
  const customizations = useGameStore((state) => state.customizations);
  const settings = useGameStore((state) => state.settings);
  const updateSetting = useGameStore((state) => state.updateSetting);
  const stats = useGameStore((state) => state.stats);
  const runs = useGameStore((state) => state.runs);
  const pushToast = useUiStore((state) => state.pushToast);

  const destination = DESTINATIONS_BY_ID[selectedDestination] ?? DESTINATIONS[0];
  const car = CARS_BY_ID[selectedCar] ?? CARS[0];
  const customization = useMemo(
    () => customizations[car.id] ?? getDefaultCustomization(car),
    [customizations, car],
  );
  const carStats = useMemo(() => effectiveCarStats(car, customization), [car, customization]);

  const routeBest = useMemo(
    () =>
      runs
        .filter((run) => run.destinationId === destination.id)
        .reduce((best, run) => Math.max(best, run.score), 0),
    [runs, destination.id],
  );

  useMenuAudio('menu', destination.environment, !racing);

  const handleStart = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    const audio = getAudioManager();
    audio.playCue('confirm');
    await audio.unlock();
    if (settings.controls.method === 'tilt') {
      await requestTiltAccess();
    }
    audio.stopMusic();
    audio.stopAmbience();
    setRacing(true);
    setStarting(false);
  }, [settings.controls.method, starting]);

  const handleExit = useCallback(() => setRacing(false), []);

  const handleRouteSelect = useCallback((destinationId: string) => {
    const route = DESTINATIONS_BY_ID[destinationId];
    if (!route) return;
    if (!unlockedDestinations.includes(destinationId)) {
      const requirement = meetsDestinationRequirement(
        route,
        stats,
        getUnlockedTrophyCount(),
      );
      pushToast({
        kind: 'info',
        title: `${route.name} is locked`,
        message:
          route.requirement && !requirement.met
            ? `Requires ${requirement.missing.join(' and ')}, plus ${formatNumber(route.coinCost)} coins.`
            : `Unlock it for ${formatNumber(route.coinCost)} coins in Destinations.`,
      });
      return;
    }
    getAudioManager().playCue('ui');
    selectDestination(destinationId);
  }, [pushToast, selectDestination, stats, unlockedDestinations]);

  const handlePrev = useCallback(() => {
    const idx = DESTINATIONS.findIndex((d) => d.id === destination.id);
    const prevIdx = idx > 0 ? idx - 1 : DESTINATIONS.length - 1;
    handleRouteSelect(DESTINATIONS[prevIdx].id);
  }, [destination.id, handleRouteSelect]);

  const handleNext = useCallback(() => {
    const idx = DESTINATIONS.findIndex((d) => d.id === destination.id);
    const nextIdx = idx < DESTINATIONS.length - 1 ? idx + 1 : 0;
    handleRouteSelect(DESTINATIONS[nextIdx].id);
  }, [destination.id, handleRouteSelect]);

  // Keyboard navigation for cycling tracks and starting race
  useEffect(() => {
    if (racing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleStart, racing]);

  // Auto-scroll active card into center view
  useEffect(() => {
    const activeEl = railRef.current?.querySelector<HTMLElement>(`[data-dest-id="${destination.id}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [destination.id]);

  if (racing) {
    return (
      <RaceStage
        destination={destination}
        car={car}
        customization={customization}
        settings={settings}
        endless={runMode === 'endless'}
        autoStart
        onExit={handleExit}
      />
    );
  }

  return (
    <Stage>
      {/* 3D Real-time Highway Environment Preview */}
      <BackgroundCanvas>
        <PreviewCanvas
          car={car}
          customization={customization}
          mode="destination"
          destination={destination}
          quality="high"
          ariaLabel={`${destination.name} 3D Preview`}
        />
      </BackgroundCanvas>

      <Vignette />

      <Overlay>
        {/* TOP BAR */}
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <ScreenTitle>
            <Flag size={14} /> <span>Race Terminal</span> {'//'} Stage Briefing
          </ScreenTitle>

          <HeaderStats>
            <Link
              href="/garage"
              className="stat-pill vehicle"
              title="Change or Tune Vehicle in Garage"
            >
              <Car size={13} />
              <span>{car.name}</span>
              <span className="class-tag">{car.className}</span>
            </Link>

            <div className="stat-pill currency">
              <Coins /> {formatNumber(coins)}
            </div>
          </HeaderStats>
        </TopNav>

        {/* CENTERED HERO SECTION */}
        <CenterHero>
          <KickerBadge>
            <Sparkles size={11} /> {destination.region} · {destination.theme.timeOfDay.toUpperCase()} LIGHTING ·{' '}
            {runMode === 'endless' ? 'ENDLESS SURVIVAL' : `${formatDistance(destination.distanceTarget)} SPRINT`}
          </KickerBadge>

          <HeroTitle>
            {destination.name} <em>{destination.difficulty}</em>
          </HeroTitle>

          <HeroTagline>{destination.tagline}</HeroTagline>

          {/* TELEMETRY BADGES */}
          <BadgesStrip>
            <MetricBadge $tone="var(--lime)">
              TARGET: <b>{runMode === 'endless' ? 'ENDLESS' : formatDistance(destination.distanceTarget)}</b>
            </MetricBadge>

            <MetricBadge>
              ENVIRONMENT: <b>{destination.environment.toUpperCase()}</b>
            </MetricBadge>

            <MetricBadge $tone={difficultyTone[settings.gameplay.difficulty]}>
              DIFFICULTY: <b>{settings.gameplay.difficulty.toUpperCase()}</b>
            </MetricBadge>

            <MetricBadge $tone={routeBest > 0 ? 'var(--warning)' : undefined}>
              RECORD: <b>{routeBest > 0 ? `${formatNumber(routeBest)} PTS` : 'NO RECORD'}</b>
            </MetricBadge>

            <MetricBadge>
              SPEED CAP: <b>{carStats.speed} SPD</b>
            </MetricBadge>
          </BadgesStrip>

          {/* MASSIVE GLOWING LAUNCH BUTTON */}
          <MainLaunchBtn
            type="button"
            onClick={handleStart}
            disabled={starting}
            aria-label="Launch Race"
          >
            <Play size={20} fill="currentColor" /> Launch Race · {runMode === 'endless' ? 'Endless' : 'Sprint'}
          </MainLaunchBtn>
        </CenterHero>

        {/* CENTERED STAGING CONTROLS & TRACK CAROUSEL */}
        <div>
          {/* MODIFIERS: RACE MODE & DIFFICULTY */}
          <ModifiersBar>
            <ModeGroup>
              <ModePill
                type="button"
                $active={runMode === 'race'}
                onClick={() => {
                  setRunMode('race');
                  getAudioManager().playCue('ui');
                }}
              >
                🏁 Route Race
              </ModePill>
              <ModePill
                type="button"
                $active={runMode === 'endless'}
                onClick={() => {
                  setRunMode('endless');
                  getAudioManager().playCue('ui');
                }}
              >
                ♾️ Endless Highway
              </ModePill>
            </ModeGroup>

            <DiffGroup>
              {difficulties.map((diff) => (
                <DiffPill
                  key={diff.value}
                  type="button"
                  $active={settings.gameplay.difficulty === diff.value}
                  $tone={difficultyTone[diff.value]}
                  onClick={() => {
                    updateSetting('gameplay', 'difficulty', diff.value);
                    getAudioManager().playCue('ui');
                  }}
                >
                  {diff.label}
                </DiffPill>
              ))}
            </DiffGroup>
          </ModifiersBar>

          {/* TRACK CAROUSEL WITH ARROWS */}
          <CarouselWrap>
            <ArrowNavBtn
              type="button"
              onClick={handlePrev}
              aria-label="Previous Route"
            >
              <ChevronLeft size={18} />
            </ArrowNavBtn>

            <TrackRail ref={railRef} role="region" aria-label="Route Selection">
              {DESTINATIONS.map((dest) => {
                const isSelected = dest.id === destination.id;
                const isLocked = !unlockedDestinations.includes(dest.id);

                return (
                  <TrackCard
                    key={dest.id}
                    data-dest-id={dest.id}
                    type="button"
                    $active={isSelected}
                    $locked={isLocked}
                    onClick={() => handleRouteSelect(dest.id)}
                  >
                    <div className="card-top">
                      <span>{dest.environment}</span>
                      {isLocked ? (
                        <Lock size={10} />
                      ) : (
                        <Sparkles size={10} color={isSelected ? 'var(--lime)' : undefined} />
                      )}
                    </div>
                    <strong>{dest.name}</strong>
                    <div className="card-bottom">
                      <span>{dest.difficulty}</span>
                      <span>·</span>
                      <span>{formatDistance(dest.distanceTarget)}</span>
                    </div>
                  </TrackCard>
                );
              })}
            </TrackRail>

            <ArrowNavBtn
              type="button"
              onClick={handleNext}
              aria-label="Next Route"
            >
              <ChevronRight size={18} />
            </ArrowNavBtn>
          </CarouselWrap>
        </div>
      </Overlay>
    </Stage>
  );
}

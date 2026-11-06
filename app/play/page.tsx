'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import {
  ArrowLeft,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Compass,
  Flag,
  Lock,
  Play,
  Sliders,
  Sparkles,
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
import {
  GameSidebarRoot,
  MobileDragHandle,
  SidebarScroll,
  SidebarFooter,
  SidebarKicker,
  SidebarTitle,
  SidebarSubtitle,
  SidebarBadgeRow,
  SidebarBadge,
  SidebarSection,
  SidebarMetricGrid,
  SidebarMetricCard,
  SidebarPillGroup,
  SidebarPill,
  SidebarPrimaryBtn,
  SidebarVehicleCard,
  SidebarHeaderRow,
  QuickCycleGroup,
  RosterList,
  RosterItem,
} from '@/components/ui/GameSidebar';

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
  padding: max(14px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right))
    max(14px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left));
`;

const TopNav = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  pointer-events: auto;
  width: 100%;
  max-width: calc(100% - clamp(340px, 24vw, 390px) - 24px);

  ${media.mobile} {
    max-width: 100%;
  }
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

export default function PlayPage() {
  const [racing, setRacing] = useState(false);
  const [runMode, setRunMode] = useState<RunMode>('race');
  const [starting, setStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'routes'>('setup');

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

  const currentIndex = useMemo(
    () => DESTINATIONS.findIndex((d) => d.id === destination.id),
    [destination.id],
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
      {/* 3D Real-time Highway Environment Preview with 100% unobstructed view */}
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
            <div className="stat-pill currency">
              <Coins /> {formatNumber(coins)}
            </div>
          </HeaderStats>
        </TopNav>
      </Overlay>

      {/* FIXED ALL-IN-ONE RIGHT-SIDE GLASSMORPHISM SIDEBAR */}
      <GameSidebarRoot aria-label="Race Briefing & Setup">
        <MobileDragHandle />
        <SidebarScroll>
          <div>
            <SidebarKicker>
              <Sparkles size={11} /> {destination.region} {'//'} ROUTE BRIEFING
            </SidebarKicker>
            <SidebarHeaderRow>
              <SidebarTitle>{destination.name}</SidebarTitle>
              <QuickCycleGroup>
                <button type="button" onClick={handlePrev} title="Previous Route (Left Arrow)">
                  <ChevronLeft size={15} />
                </button>
                <span>{currentIndex + 1}/{DESTINATIONS.length}</span>
                <button type="button" onClick={handleNext} title="Next Route (Right Arrow)">
                  <ChevronRight size={15} />
                </button>
              </QuickCycleGroup>
            </SidebarHeaderRow>
            <SidebarSubtitle>{destination.tagline}</SidebarSubtitle>
          </div>

          <SidebarBadgeRow>
            <SidebarBadge $tone={difficultyTone[settings.gameplay.difficulty]}>
              {destination.difficulty.toUpperCase()}
            </SidebarBadge>
            <SidebarBadge>
              {runMode === 'endless' ? 'ENDLESS' : formatDistance(destination.distanceTarget)}
            </SidebarBadge>
            <SidebarBadge>
              {destination.environment.toUpperCase()} · {destination.theme.timeOfDay.toUpperCase()}
            </SidebarBadge>
            <SidebarBadge>
              WEATHER: {destination.theme.weather.toUpperCase()}
            </SidebarBadge>
          </SidebarBadgeRow>

          <SidebarMetricGrid>
            <SidebarMetricCard $highlight={routeBest > 0}>
              <span className="label">Best Record</span>
              <span className="value">
                {routeBest > 0 ? `${formatNumber(routeBest)} PTS` : 'NO RECORD'}
              </span>
            </SidebarMetricCard>

            <SidebarMetricCard>
              <span className="label">Machine Cap</span>
              <span className="value">{carStats.speed} KM/H</span>
            </SidebarMetricCard>
          </SidebarMetricGrid>

          {/* STUDIO NAVIGATION TABS IN SIDEBAR */}
          <SidebarSection>
            <span className="section-label">Race Setup &amp; Navigation</span>
            <SidebarPillGroup>
              <SidebarPill
                type="button"
                $active={activeTab === 'setup'}
                onClick={() => {
                  setActiveTab('setup');
                  getAudioManager().playCue('ui');
                }}
              >
                <Sliders size={11} style={{ marginRight: 4 }} /> Modifiers
              </SidebarPill>
              <SidebarPill
                type="button"
                $active={activeTab === 'routes'}
                onClick={() => {
                  setActiveTab('routes');
                  getAudioManager().playCue('ui');
                }}
              >
                <Compass size={11} style={{ marginRight: 4 }} /> All Routes ({unlockedDestinations.length}/{DESTINATIONS.length})
              </SidebarPill>
            </SidebarPillGroup>
          </SidebarSection>

          {/* TAB 1: MODIFIERS (RACE MODE, DIFFICULTY, ACTIVE MACHINE) */}
          {activeTab === 'setup' && (
            <>
              <SidebarSection>
                <span className="section-label">Race Mode</span>
                <SidebarPillGroup>
                  <SidebarPill
                    type="button"
                    $active={runMode === 'race'}
                    onClick={() => {
                      setRunMode('race');
                      getAudioManager().playCue('ui');
                    }}
                  >
                    🏁 Route Race
                  </SidebarPill>
                  <SidebarPill
                    type="button"
                    $active={runMode === 'endless'}
                    onClick={() => {
                      setRunMode('endless');
                      getAudioManager().playCue('ui');
                    }}
                  >
                    ♾️ Endless Highway
                  </SidebarPill>
                </SidebarPillGroup>
              </SidebarSection>

              <SidebarSection>
                <span className="section-label">Difficulty Level</span>
                <SidebarPillGroup>
                  {difficulties.map((diff) => (
                    <SidebarPill
                      key={diff.value}
                      type="button"
                      $active={settings.gameplay.difficulty === diff.value}
                      onClick={() => {
                        updateSetting('gameplay', 'difficulty', diff.value);
                        getAudioManager().playCue('ui');
                      }}
                    >
                      {diff.label}
                    </SidebarPill>
                  ))}
                </SidebarPillGroup>
              </SidebarSection>

              <SidebarSection>
                <span className="section-label">Selected Machine</span>
                <SidebarVehicleCard href="/garage" title="Switch or Tune Machine in Garage">
                  <div className="veh-info">
                    <Car size={13} />
                    <span>{car.name}</span>
                    <span className="class-tag">{car.className}</span>
                  </div>
                  <span className="veh-action">GARAGE →</span>
                </SidebarVehicleCard>
              </SidebarSection>
            </>
          )}

          {/* TAB 2: ROUTE DIRECTORY LIST */}
          {activeTab === 'routes' && (
            <RosterList>
              {DESTINATIONS.map((dest) => {
                const isSelected = dest.id === destination.id;
                const isLocked = !unlockedDestinations.includes(dest.id);

                return (
                  <RosterItem
                    key={dest.id}
                    type="button"
                    $active={isSelected}
                    $locked={isLocked}
                    onClick={() => handleRouteSelect(dest.id)}
                  >
                    <div className="item-left">
                      <div className="item-class">{dest.region} · {dest.environment.toUpperCase()}</div>
                      <div className="item-name">{dest.name}</div>
                    </div>
                    <div className="item-right">
                      {isSelected ? (
                        <span className="tag-equipped">
                          <Check size={11} /> SELECTED
                        </span>
                      ) : !isLocked ? (
                        <span className="tag-owned">{formatDistance(dest.distanceTarget)}</span>
                      ) : (
                        <span className="tag-locked">
                          <Lock size={10} /> LOCKED
                        </span>
                      )}
                    </div>
                  </RosterItem>
                );
              })}
            </RosterList>
          )}
        </SidebarScroll>

        <SidebarFooter>
          <SidebarPrimaryBtn
            type="button"
            onClick={handleStart}
            disabled={starting}
            aria-label="Launch Race"
          >
            <Play size={18} fill="currentColor" /> Launch Race · {runMode === 'endless' ? 'Endless' : 'Sprint'}
          </SidebarPrimaryBtn>
        </SidebarFooter>
      </GameSidebarRoot>
    </Stage>
  );
}

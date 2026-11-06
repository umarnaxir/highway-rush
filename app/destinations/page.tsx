'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Compass,
  Lock,
  Play,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { PreviewCanvas } from '@/components/game/PreviewCanvas';
import { DESTINATIONS, DESTINATIONS_BY_ID, meetsDestinationRequirement } from '@/lib/data/destinations';
import { CARS_BY_ID, getDefaultCustomization } from '@/lib/data/cars';
import { useGameStore, getUnlockedTrophyCount } from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { useUiStore } from '@/lib/store/useUiStore';
import { formatDistance, formatNumber } from '@/lib/ui/format';
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
  SidebarMetricGrid,
  SidebarMetricCard,
  SidebarPrimaryBtn,
  SidebarNotice,
  SidebarHeaderRow,
  QuickCycleGroup,
  SidebarSection,
  RosterList,
  RosterItem,
} from '@/components/ui/GameSidebar';

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
      }
    }

    svg {
      color: var(--warning);
      width: 13px;
      height: 13px;
    }
  }
`;

export default function DestinationsPage() {
  const router = useRouter();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const coins = useGameStore((state) => state.coins);
  const selectedCarId = useGameStore((state) => state.selectedCar);
  const selectedDestinationId = useGameStore((state) => state.selectedDestination);
  const selectDestination = useGameStore((state) => state.selectDestination);
  const purchaseDestination = useGameStore((state) => state.purchaseDestination);
  const unlockedDestinations = useGameStore((state) => state.unlockedDestinations);
  const customizations = useGameStore((state) => state.customizations);
  const stats = useGameStore((state) => state.stats);
  const runs = useGameStore((state) => state.runs);
  const pushToast = useUiStore((state) => state.pushToast);

  const displayedRouteId = selectedRouteId ?? selectedDestinationId;
  const destination = useMemo(
    () => DESTINATIONS_BY_ID[displayedRouteId] ?? DESTINATIONS[0],
    [displayedRouteId],
  );
  const car = useMemo(
    () => CARS_BY_ID[selectedCarId] ?? CARS_BY_ID['phantom-gt'],
    [selectedCarId],
  );
  const customization = useMemo(
    () => customizations[car.id] ?? getDefaultCustomization(car),
    [customizations, car],
  );

  const isUnlocked = unlockedDestinations.includes(destination.id);
  const routeBest = useMemo(
    () =>
      runs
        .filter((run) => run.destinationId === destination.id)
        .reduce((best, run) => Math.max(best, run.score), 0),
    [runs, destination.id],
  );

  const requirement = useMemo(
    () => meetsDestinationRequirement(destination, stats, getUnlockedTrophyCount()),
    [destination, stats],
  );

  const currentIndex = useMemo(
    () => DESTINATIONS.findIndex((d) => d.id === destination.id),
    [destination.id],
  );

  const handleSelectRoute = (id: string) => {
    setSelectedRouteId(id);
    getAudioManager().playCue('ui');
  };

  const cycleRoute = (step: number) => {
    const nextIdx = (currentIndex + step + DESTINATIONS.length) % DESTINATIONS.length;
    setSelectedRouteId(DESTINATIONS[nextIdx].id);
    getAudioManager().playCue('ui');
  };

  const handleUnlock = () => {
    if (!requirement.met) {
      getAudioManager().playCue('error');
      pushToast({ kind: 'info', title: 'Route Locked', message: `Requires ${requirement.missing.join(', ')}.` });
      return;
    }
    const res = purchaseDestination(destination.id);
    if (res.ok) {
      getAudioManager().playCue('purchase');
      selectDestination(destination.id);
      pushToast({ kind: 'success', title: `${destination.name} Unlocked`, message: 'Ready for competition.' });
    } else {
      getAudioManager().playCue('error');
      pushToast({ kind: 'error', title: 'Unlock Failed', message: res.message });
    }
  };

  const handleRaceNow = () => {
    selectDestination(destination.id);
    getAudioManager().playCue('confirm');
    router.push('/play');
  };

  // Keyboard navigation support: Left/Right to change destination, Enter to race/unlock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        cycleRoute(-1);
      } else if (e.key === 'ArrowRight') {
        cycleRoute(1);
      } else if (e.key === 'Enter') {
        if (isUnlocked) handleRaceNow();
        else handleUnlock();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const difficultyTone =
    destination.difficulty === 'relaxed'
      ? 'var(--info)'
      : destination.difficulty === 'standard'
        ? 'var(--lime)'
        : destination.difficulty === 'hard'
          ? 'var(--warning)'
          : 'var(--danger)';

  return (
    <Stage>
      {/* 3D Real-time Destination Environment with 100% unobstructed view */}
      <BackgroundCanvas>
        <PreviewCanvas
          car={car}
          customization={customization}
          mode="destination"
          destination={destination}
          quality="high"
          lateralShift={0}
          ariaLabel={`${destination.name} 3D Highway Preview`}
        />
      </BackgroundCanvas>

      <Vignette />

      <Overlay>
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <ScreenTitle>
            <Compass size={14} /> Stage Explorer // <span>{destination.region}</span>
          </ScreenTitle>

          <HeaderStats>
            <div className="stat-pill">
              <Compass /> {unlockedDestinations.length}/{DESTINATIONS.length} UNLOCKED
            </div>
            <div className="stat-pill currency">
              <Coins /> {formatNumber(coins)}
            </div>
          </HeaderStats>
        </TopNav>
      </Overlay>

      {/* FIXED ALL-IN-ONE RIGHT-SIDE GLASSMORPHISM SIDEBAR */}
      <GameSidebarRoot aria-label="Destination Information & Select">
        <MobileDragHandle />
        <SidebarScroll>
          <div>
            <SidebarKicker>
              <Sparkles size={11} /> {destination.region} {'//'} DESTINATION SPEC
            </SidebarKicker>
            <SidebarHeaderRow>
              <SidebarTitle>{destination.name}</SidebarTitle>
              <QuickCycleGroup>
                <button type="button" onClick={() => cycleRoute(-1)} title="Previous Route (Left Arrow)">
                  <ChevronLeft size={15} />
                </button>
                <span>{currentIndex + 1}/{DESTINATIONS.length}</span>
                <button type="button" onClick={() => cycleRoute(1)} title="Next Route (Right Arrow)">
                  <ChevronRight size={15} />
                </button>
              </QuickCycleGroup>
            </SidebarHeaderRow>
            <SidebarSubtitle>{destination.tagline}</SidebarSubtitle>
          </div>

          <SidebarBadgeRow>
            <SidebarBadge $tone={isUnlocked ? 'var(--lime)' : 'var(--warning)'}>
              {isUnlocked ? 'UNLOCKED' : `LOCKED · ${formatNumber(destination.coinCost)} COINS`}
            </SidebarBadge>
            <SidebarBadge $tone={difficultyTone}>
              {destination.difficulty.toUpperCase()}
            </SidebarBadge>
            <SidebarBadge>
              {destination.environment.toUpperCase()}
            </SidebarBadge>
            <SidebarBadge>
              {destination.theme.timeOfDay.toUpperCase()} LIGHTING
            </SidebarBadge>
          </SidebarBadgeRow>

          <SidebarMetricGrid>
            <SidebarMetricCard>
              <span className="label">Target Length</span>
              <span className="value">{formatDistance(destination.distanceTarget)}</span>
            </SidebarMetricCard>

            <SidebarMetricCard $highlight={routeBest > 0}>
              <span className="label">Best Record</span>
              <span className="value">
                {routeBest > 0 ? `${formatNumber(routeBest)} PTS` : 'NO RECORD'}
              </span>
            </SidebarMetricCard>

            <SidebarMetricCard>
              <span className="label">Weather</span>
              <span className="value">{destination.theme.weather.toUpperCase()}</span>
            </SidebarMetricCard>

            <SidebarMetricCard>
              <span className="label">Traffic Density</span>
              <span className="value">HIGHWAY</span>
            </SidebarMetricCard>
          </SidebarMetricGrid>

          {!isUnlocked && (
            <div>
              {!requirement.met ? (
                <SidebarNotice $tone="warning">
                  Requirement: {requirement.missing.join(' · ')}
                </SidebarNotice>
              ) : (
                <SidebarNotice $tone="info">
                  Requirements met. Unlock for {formatNumber(destination.coinCost)} coins.
                </SidebarNotice>
              )}
            </div>
          )}

          {/* DESTINATIONS SELECTION DIRECTORY IN SIDEBAR */}
          <SidebarSection>
            <span className="section-label">All Destinations ({unlockedDestinations.length}/{DESTINATIONS.length} Unlocked)</span>
            <RosterList>
              {DESTINATIONS.map((d) => {
                const active = d.id === destination.id;
                const locked = !unlockedDestinations.includes(d.id);
                return (
                  <RosterItem
                    key={d.id}
                    type="button"
                    $active={active}
                    $locked={locked}
                    onClick={() => handleSelectRoute(d.id)}
                  >
                    <div className="item-left">
                      <div className="item-class">{d.region} · {d.environment.toUpperCase()}</div>
                      <div className="item-name">{d.name}</div>
                    </div>
                    <div className="item-right">
                      {active ? (
                        <span className="tag-equipped">
                          <Check size={11} /> SELECTED
                        </span>
                      ) : !locked ? (
                        <span className="tag-owned">{formatDistance(d.distanceTarget)}</span>
                      ) : (
                        <span className="tag-locked">
                          <Lock size={10} /> {formatNumber(d.coinCost)}
                        </span>
                      )}
                    </div>
                  </RosterItem>
                );
              })}
            </RosterList>
          </SidebarSection>
        </SidebarScroll>

        <SidebarFooter>
          {isUnlocked ? (
            <SidebarPrimaryBtn type="button" onClick={handleRaceNow}>
              <Play size={18} fill="currentColor" /> Select &amp; Race Route
            </SidebarPrimaryBtn>
          ) : (
            <SidebarPrimaryBtn
              type="button"
              $tone="amber"
              disabled={coins < destination.coinCost || !requirement.met}
              onClick={handleUnlock}
            >
              <Unlock size={18} /> Unlock Route ({formatNumber(destination.coinCost)} Coins)
            </SidebarPrimaryBtn>
          )}
        </SidebarFooter>
      </GameSidebarRoot>
    </Stage>
  );
}

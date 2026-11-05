'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Coins,
  Compass,
  Lock,
  Play,
  Sparkles,
  Trophy,
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

    svg {
      color: var(--warning);
      width: 13px;
      height: 13px;
    }
  }
`;

/* CENTERED HERO SECTION */
const CenterHero = styled.div`
  pointer-events: auto;
  margin: auto auto 14px auto;
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
  line-height: 1.5;
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

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 24px rgba(215, 255, 63, 0.4), 0 0 50px rgba(215, 255, 63, 0.15); }
  50% { box-shadow: 0 0 38px rgba(215, 255, 63, 0.65), 0 0 75px rgba(215, 255, 63, 0.3); }
`;

const MainActionBtn = styled.button<{ $locked?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 280px;
  padding: 16px 28px;
  border-radius: 4px;
  border: none;
  background: ${({ $locked }) => ($locked ? '#f59e0b' : 'var(--lime)')};
  color: #07090b;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 16px;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  animation: ${pulseGlow} 2.6s infinite ease-in-out;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover:not(:disabled) {
    transform: scale(1.03);
    background: ${({ $locked }) => ($locked ? '#fbbf24' : '#e6ff66')};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    background: var(--line-strong);
    color: var(--text-dim);
    animation: none;
    box-shadow: none;
  }

  ${media.mobile} {
    width: 100%;
    min-width: 0;
    padding: 14px 20px;
  }
`;

const RequirementWarn = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: var(--warning);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(245, 158, 11, 0.12);
  padding: 4px 12px;
  border-radius: 3px;
  border: 1px solid rgba(245, 158, 11, 0.35);
`;

/* CENTERED BOTTOM RAIL */
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
  min-width: 130px;
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

export default function DestinationsPage() {
  const router = useRouter();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

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
      ? '#38bdf8'
      : destination.difficulty === 'standard'
        ? '#d7ff3f'
        : destination.difficulty === 'hard'
          ? '#fbbf24'
          : '#ff5d5d';

  return (
    <Stage>
      {/* 3D Real-time Destination Environment with centered camera */}
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
            <div className="stat-pill">
              <Coins /> {formatNumber(coins)}
            </div>
          </HeaderStats>
        </TopNav>

        {/* CENTERED HERO DISPLAY */}
        <CenterHero>
          <KickerBadge>
            <Sparkles size={11} /> {destination.region} · {destination.environment.toUpperCase()} ·{' '}
            {destination.theme.timeOfDay.toUpperCase()}
          </KickerBadge>

          <HeroTitle>
            {destination.name} <em>{destination.difficulty}</em>
          </HeroTitle>

          <HeroTagline>{destination.tagline}</HeroTagline>

          <BadgesStrip>
            <MetricBadge $tone={difficultyTone}>
              ⚡ {destination.difficulty.toUpperCase()}
            </MetricBadge>
            <MetricBadge>
              🏁 Length: <b>{formatDistance(destination.distanceTarget)}</b>
            </MetricBadge>
            <MetricBadge>
              ☁️ Weather: <b>{destination.theme.weather.toUpperCase()}</b>
            </MetricBadge>
            <MetricBadge>
              🏆 Best Record: <b>{formatNumber(routeBest)} PTS</b>
            </MetricBadge>
          </BadgesStrip>

          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
            {!isUnlocked ? (
              <>
                <MainActionBtn
                  type="button"
                  $locked
                  disabled={coins < destination.coinCost || !requirement.met}
                  onClick={handleUnlock}
                >
                  <Unlock size={18} /> Unlock Route ({formatNumber(destination.coinCost)} Coins)
                </MainActionBtn>
                {!requirement.met && (
                  <RequirementWarn>
                    Requires: {requirement.missing.join(' · ')}
                  </RequirementWarn>
                )}
              </>
            ) : (
              <MainActionBtn type="button" onClick={handleRaceNow}>
                <Play size={18} fill="currentColor" /> Select &amp; Race Route
              </MainActionBtn>
            )}
          </div>
        </CenterHero>

        {/* CENTERED TRACK SELECTOR CAROUSEL */}
        <CarouselWrap>
          <ArrowNavBtn
            type="button"
            onClick={() => cycleRoute(-1)}
            aria-label="Previous destination"
          >
            <ChevronLeft size={20} />
          </ArrowNavBtn>

          <TrackRail ref={railRef}>
            {DESTINATIONS.map((d) => {
              const active = d.id === destination.id;
              const locked = !unlockedDestinations.includes(d.id);
              return (
                <TrackCard
                  key={d.id}
                  type="button"
                  $active={active}
                  $locked={locked}
                  onClick={() => handleSelectRoute(d.id)}
                >
                  <div className="card-top">
                    <span>{d.region.split(' ')[0]}</span>
                    {locked && <Lock size={10} />}
                  </div>
                  <strong>{d.name}</strong>
                  <div className="card-bottom">
                    <span>{d.difficulty}</span>
                    <span>·</span>
                    <span>{formatDistance(d.distanceTarget)}</span>
                  </div>
                </TrackCard>
              );
            })}
          </TrackRail>

          <ArrowNavBtn
            type="button"
            onClick={() => cycleRoute(1)}
            aria-label="Next destination"
          >
            <ChevronRight size={20} />
          </ArrowNavBtn>
        </CarouselWrap>
      </Overlay>
    </Stage>
  );
}

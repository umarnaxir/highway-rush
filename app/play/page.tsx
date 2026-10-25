'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  ArrowRight,
  Car,
  Check,
  ChevronRight,
  Coins,
  Flag,
  Gauge,
  Lock,
  MapPin,
  Play,
  Settings2,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, Panel, PanelLabel, SectionKicker, SectionTitle } from '@/components/ui/Panel';
import { EnvironmentIcon } from '@/components/ui/DestinationVisual';
import { PageLoader } from '@/components/ui/Feedback';
import { PreviewCanvas } from '@/components/game/PreviewCanvas';
import { CARS, CARS_BY_ID, getDefaultCustomization } from '@/lib/data/cars';
import {
  DESTINATIONS,
  DESTINATIONS_BY_ID,
  meetsDestinationRequirement,
} from '@/lib/data/destinations';
import { useGameStore, getUnlockedTrophyCount, useHydrated } from '@/lib/store/useGameStore';
import { useUiStore } from '@/lib/store/useUiStore';
import { useMenuAudio } from '@/lib/hooks/useMenuAudio';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { formatDistance, formatNumber, titleCase } from '@/lib/ui/format';
import type { Difficulty } from '@/lib/types';
import { media } from '@/lib/ui/theme';

const RaceStage = dynamic(() => import('@/components/game/RaceStage').then((mod) => mod.RaceStage), {
  ssr: false,
  loading: () => (
    <RaceLoading>
      <div>
        <Zap size={26} />
        <strong>Opening the highway</strong>
        <span>Loading the race engine</span>
      </div>
    </RaceLoading>
  ),
});

type RunMode = 'race' | 'endless';

const difficulties: Array<{ value: Difficulty; label: string; hint: string }> = [
  { value: 'relaxed', label: 'Relaxed', hint: 'Lighter traffic, softer damage.' },
  { value: 'standard', label: 'Standard', hint: 'The intended highway.' },
  { value: 'hard', label: 'Hard', hint: 'Denser traffic, more damage.' },
  { value: 'insane', label: 'Insane', hint: 'No margin. No mercy.' },
];

const difficultyTone: Record<Difficulty, 'lime' | 'info' | 'warning' | 'danger'> = {
  relaxed: 'info',
  standard: 'lime',
  hard: 'warning',
  insane: 'danger',
};

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
    gap: 7px;
  }

  svg {
    color: var(--lime);
    animation: pulseGlow 1.4s ease-in-out infinite;
  }

  strong {
    margin-top: 8px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 20px;
    font-style: italic;
    text-transform: uppercase;
  }

  span {
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }
`;

const Main = styled.main`
  max-width: 1420px;
  margin: 0 auto;
  padding: clamp(30px, 4.4vw, 58px) clamp(16px, 3vw, 36px) 0;
  animation: pageIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const Intro = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: clamp(22px, 3vw, 34px);
  flex-wrap: wrap;
`;

const Title = styled.h1`
  margin-top: 10px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(42px, 6vw, 84px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.84;
  letter-spacing: -0.04em;
  text-transform: uppercase;

  em {
    color: var(--lime);
    font-style: inherit;
  }
`;

const Sub = styled.p`
  max-width: 520px;
  margin-top: 14px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.75;
`;

const IntroMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 4px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(340px, 0.88fr);
  gap: 16px;
  align-items: start;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

const Stage = styled.div`
  position: relative;
  min-height: 480px;
  border: 1px solid var(--line-strong);
  border-radius: 7px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 120%, rgba(215, 255, 63, 0.07), transparent 58%),
    #05080a;
  box-shadow: 0 34px 90px rgba(0, 0, 0, 0.38);

  ${media.mobile} {
    min-height: 350px;
  }
`;

const StageCanvas = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
`;

const StageShade = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(3, 5, 7, 0.5), transparent 26%, transparent 54%, rgba(3, 5, 7, 0.9)),
    linear-gradient(90deg, rgba(3, 5, 7, 0.42), transparent 55%);
`;

const StageTop = styled.div`
  position: absolute;
  top: 18px;
  left: 18px;
  right: 18px;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  pointer-events: none;
`;

const StageBottom = styled.div`
  position: absolute;
  left: clamp(18px, 2.6vw, 28px);
  right: clamp(18px, 2.6vw, 28px);
  bottom: clamp(18px, 2.6vw, 26px);
  z-index: 3;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  pointer-events: none;
`;

const StageTitle = styled.div`
  min-width: 0;

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(36px, 5.4vw, 72px);
    font-style: italic;
    font-weight: 900;
    line-height: 0.82;
    letter-spacing: -0.035em;
    text-transform: uppercase;
    text-shadow: 0 8px 34px rgba(0, 0, 0, 0.55);
  }

  p {
    max-width: 470px;
    margin-top: 10px;
    color: var(--text-muted);
    font-size: 10px;
    line-height: 1.6;
  }
`;

const StageTags = styled.div`
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 13px;
`;

const StageStats = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;

  div {
    min-width: 92px;
    padding: 9px 11px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 4px;
    background: rgba(3, 5, 7, 0.6);
    backdrop-filter: blur(9px);
  }

  span {
    display: block;
    color: var(--text-dim);
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    margin-top: 3px;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

const OrbitHint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 3px;
  background: rgba(3, 5, 7, 0.46);
  color: var(--text-dim);
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
`;

const RoutesPanel = styled(Panel)`
  padding: clamp(16px, 2.2vw, 22px);
`;

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 13px;
  flex-wrap: wrap;

  > div {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  svg {
    color: var(--lime);
  }
`;

const RouteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;

  ${media.desktop} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  ${media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const RouteCard = styled.button<{ $selected: boolean; $locked: boolean; $accent: string }>`
  position: relative;
  min-width: 0;
  min-height: 92px;
  padding: 10px 11px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  border-radius: 4px;
  border: 1px solid
    ${({ $selected, $locked, $accent }) =>
      $selected ? $accent : $locked ? 'var(--line)' : 'var(--line-strong)'};
  background: ${({ $selected, $locked, $accent }) =>
    $selected
      ? `linear-gradient(150deg, ${$accent}1f, rgba(255,255,255,.015))`
      : $locked
        ? 'rgba(0,0,0,.18)'
        : 'rgba(255,255,255,.02)'};
  color: var(--text);
  opacity: ${({ $locked }) => ($locked ? 0.56 : 1)};
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    transform 0.16s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ $locked, $accent }) => ($locked ? 'var(--line-strong)' : $accent)};
  }

  .top {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    color: ${({ $selected, $accent }) => ($selected ? $accent : 'var(--text-dim)')};
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-dim);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .check {
    position: absolute;
    top: 8px;
    right: 8px;
    color: ${({ $accent }) => $accent};
  }
`;

const Setup = styled(Panel)`
  padding: clamp(18px, 2.6vw, 26px);
  display: flex;
  flex-direction: column;
  gap: 0;
  position: sticky;
  top: calc(var(--nav-height) + 16px);

  ${media.desktop} {
    position: static;
  }
`;

const Block = styled.section`
  padding: 18px 0;
  border-bottom: 1px solid var(--line);

  &:first-of-type {
    padding-top: 0;
  }

  &:last-of-type {
    border-bottom: 0;
    padding-bottom: 0;
  }
`;

const BlockHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--text-muted);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;

    svg {
      color: var(--lime);
    }
  }

  > b {
    color: var(--text-dim);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }
`;

const ModeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
`;

const ModeCard = styled.button<{ $active: boolean }>`
  padding: 13px;
  border-radius: 4px;
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.lime : theme.colors.lineStrong)};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(150deg, rgba(215,255,63,.14), rgba(215,255,63,.02))'
      : 'rgba(255,255,255,.02)'};
  text-align: left;
  transition: all 0.16s ease;

  svg {
    color: ${({ $active, theme }) => ($active ? theme.colors.lime : theme.colors.textDim)};
    margin-bottom: 8px;
  }

  strong {
    display: block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  span {
    display: block;
    margin-top: 5px;
    color: var(--text-muted);
    font-size: 9px;
    line-height: 1.5;
  }
`;

const CarRail = styled.div`
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scroll-snap-type: x proximity;
`;

const CarCard = styled.button<{ $active: boolean; $paint: string }>`
  min-width: 112px;
  flex: 0 0 auto;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.lime : theme.colors.line)};
  background: ${({ $active }) => ($active ? 'rgba(215,255,63,.08)' : 'rgba(255,255,255,.015)')};
  text-align: left;
  scroll-snap-align: start;
  transition: all 0.16s ease;

  i {
    display: block;
    width: 100%;
    height: 3px;
    margin-bottom: 8px;
    border-radius: 999px;
    background: ${({ $paint }) => $paint};
    box-shadow: 0 0 12px ${({ $paint }) => `${$paint}66`};
  }

  strong {
    display: block;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    display: block;
    margin-top: 3px;
    color: var(--text-dim);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
`;

const DifficultyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;

  ${media.mobile} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const DifficultyCard = styled.button<{ $active: boolean; $tone: string }>`
  min-width: 0;
  padding: 9px 7px;
  border-radius: 3px;
  border: 1px solid ${({ $active, $tone }) => ($active ? $tone : 'var(--line)')};
  background: ${({ $active, $tone }) => ($active ? `${$tone}18` : 'rgba(255,255,255,.02)')};
  color: ${({ $active, $tone }) => ($active ? $tone : 'var(--text-muted)')};
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $tone }) => $tone};
  }
`;

const DifficultyHint = styled.p`
  margin-top: 8px;
  min-height: 15px;
  color: var(--text-dim);
  font-size: 9px;
  line-height: 1.55;
`;

const RunSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.18);

  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 9px;
  }

  span {
    color: var(--text-dim);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 9px;
    font-weight: 700;
    text-align: right;
  }
`;

const StartArea = styled.div`
  padding-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

const StartNote = styled.p`
  color: var(--text-dim);
  font-size: 9px;
  line-height: 1.6;
  text-align: center;
`;

const FooterLinks = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
`;

const MiniLink = styled(ButtonLink)`
  min-height: 30px !important;
  padding: 0 8px !important;
  font-size: 8px !important;
`;

const LockedNote = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
  color: var(--text-dim);
  font-size: 9px;
  line-height: 1.5;

  svg {
    color: var(--warning);
    flex: 0 0 auto;
  }
`;

function modeLabel(mode: RunMode) {
  return mode === 'endless' ? 'Endless run' : 'Route race';
}

export default function PlayPage() {
  const [racing, setRacing] = useState(false);
  const [runMode, setRunMode] = useState<RunMode>('race');
  const [starting, setStarting] = useState(false);

  const hydrated = useHydrated();
  const coins = useGameStore((state) => state.coins);
  const ownedCars = useGameStore((state) => state.ownedCars);
  const selectedCar = useGameStore((state) => state.selectedCar);
  const selectCar = useGameStore((state) => state.selectCar);
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
  const owned = useMemo(
    () => ownedCars.map((id) => CARS_BY_ID[id]).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    [ownedCars],
  );
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
    audio.stopMusic();
    audio.stopAmbience();
    setRacing(true);
    setStarting(false);
  }, [starting]);

  const handleExit = useCallback(() => setRacing(false), []);

  const handleRoute = (destinationId: string) => {
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
  };

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
    <>
      <NavBar />
      <Main>
        <Intro>
          <div>
            <SectionKicker>Race control</SectionKicker>
            <Title>
              Build the <em>run.</em>
            </Title>
            <Sub>
              Choose a machine, pick your stretch of highway and commit. Race mode has a finish
              gate; endless mode keeps the road coming until you stop it.
            </Sub>
          </div>
          <IntroMeta>
            <Badge $tone="warning">
              <Coins size={10} /> {formatNumber(coins)} coins
            </Badge>
            <Badge $tone="lime">
              <Trophy size={10} /> {getUnlockedTrophyCount()} trophies
            </Badge>
            <Badge>
              <Gauge size={10} /> {String(settings.gameplay.difficulty).toUpperCase()}
            </Badge>
          </IntroMeta>
        </Intro>

        {!hydrated ? (
          <Panel>
            <PageLoader label="Reading your save" minHeight="320px" />
          </Panel>
        ) : (
          <Grid>
            <LeftCol>
              <Stage>
                <StageCanvas>
                  <PreviewCanvas
                    mode="destination"
                    car={car}
                    customization={customization}
                    destination={destination}
                    quality={settings.graphics.performanceMode ? 'low' : settings.graphics.effects}
                    invertCamera={settings.controls.invertCamera}
                    ariaLabel={`${destination.name} 3D route preview`}
                  />
                </StageCanvas>
                <StageShade />
                <StageTop>
                  <StageTags>
                    <Badge $tone="lime">{modeLabel(runMode)}</Badge>
                    <Badge $tone={difficultyTone[destination.difficulty]}>
                      {titleCase(destination.difficulty)}
                    </Badge>
                    {runMode === 'race' && (
                      <Badge $tone="info">
                        <Target size={9} /> {formatDistance(destination.distanceTarget)}
                      </Badge>
                    )}
                  </StageTags>
                  <OrbitHint>
                    <Sparkles size={9} /> Drag to orbit
                  </OrbitHint>
                </StageTop>
                <StageBottom>
                  <StageTitle>
                    <h2>{destination.name}</h2>
                    <p>{destination.description}</p>
                    <StageTags>
                      <Badge>
                        <MapPin size={9} /> {destination.region}
                      </Badge>
                      <Badge $tone="purple">
                        <EnvironmentIcon environment={destination.environment} size={9} />{' '}
                        {titleCase(destination.environment)}
                      </Badge>
                    </StageTags>
                  </StageTitle>
                  <StageStats>
                    <div>
                      <span>Route best</span>
                      <strong>{routeBest > 0 ? formatNumber(routeBest) : '—'}</strong>
                    </div>
                    <div>
                      <span>Your car</span>
                      <strong>{car.name}</strong>
                    </div>
                    <div>
                      <span>Music</span>
                      <strong>{titleCase(destination.music)}</strong>
                    </div>
                  </StageStats>
                </StageBottom>
              </Stage>

              <RoutesPanel>
                <PanelHead>
                  <div>
                    <MapPin size={14} />
                    <PanelLabel>Route select</PanelLabel>
                  </div>
                  <ButtonLink href="/destinations" variant="ghost" size="sm" iconRight={<ChevronRight size={11} />}>
                    Unlock routes
                  </ButtonLink>
                </PanelHead>
                <RouteGrid>
                  {DESTINATIONS.map((route, index) => {
                    const unlocked = unlockedDestinations.includes(route.id);
                    const selected = route.id === destination.id;
                    const requirement = meetsDestinationRequirement(
                      route,
                      stats,
                      getUnlockedTrophyCount(),
                    );
                    return (
                      <RouteCard
                        key={route.id}
                        type="button"
                        $selected={selected}
                        $locked={!unlocked}
                        $accent={route.theme.accent}
                        aria-pressed={selected}
                        onClick={() => handleRoute(route.id)}
                      >
                        <span className="top">
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          {unlocked ? (
                            <EnvironmentIcon environment={route.environment} size={11} />
                          ) : (
                            <Lock size={11} />
                          )}
                        </span>
                        <div style={{ minWidth: 0, maxWidth: '100%' }}>
                          <strong>{route.name}</strong>
                          <span className="meta">
                            {unlocked ? (
                              <>
                                <Flag size={8} /> {formatDistance(route.distanceTarget)}
                              </>
                            ) : (
                              <>
                                <Coins size={8} /> {formatNumber(route.coinCost)}
                              </>
                            )}
                          </span>
                          {!unlocked && route.requirement && !requirement.met && (
                            <span className="meta" style={{ color: 'var(--warning)' }}>
                              {requirement.missing[0]}
                            </span>
                          )}
                        </div>
                        {selected && <Check className="check" size={12} />}
                      </RouteCard>
                    );
                  })}
                </RouteGrid>
                <LockedNote>
                  <Lock size={11} /> Locked routes can be purchased with coins in Destinations. Career
                  requirements are shown on each route card.
                </LockedNote>
              </RoutesPanel>
            </LeftCol>

            <Setup>
              <Block>
                <BlockHead>
                  <span>
                    <Flag size={11} /> Run mode
                  </span>
                  <b>{runMode === 'race' ? 'FINISH GATE' : 'NO LIMIT'}</b>
                </BlockHead>
                <ModeGrid>
                  <ModeCard
                    type="button"
                    $active={runMode === 'race'}
                    onClick={() => {
                      getAudioManager().playCue('ui');
                      setRunMode('race');
                    }}
                  >
                    <Flag size={16} />
                    <strong>Route race</strong>
                    <span>Cross the gate. Bank a 5,000 point completion bonus.</span>
                  </ModeCard>
                  <ModeCard
                    type="button"
                    $active={runMode === 'endless'}
                    onClick={() => {
                      getAudioManager().playCue('ui');
                      setRunMode('endless');
                    }}
                  >
                    <Zap size={16} />
                    <strong>Endless</strong>
                    <span>No finish line. Traffic keeps scaling with your speed.</span>
                  </ModeCard>
                </ModeGrid>
              </Block>

              <Block>
                <BlockHead>
                  <span>
                    <Car size={11} /> Machine
                  </span>
                  <b>{ceiling(owned.length)} OWNED</b>
                </BlockHead>
                <CarRail>
                  {owned.map((ownedCar) => {
                    const paint =
                      customizations[ownedCar.id]?.paint ?? ownedCar.defaultPaint;
                    return (
                      <CarCard
                        key={ownedCar.id}
                        type="button"
                        $active={ownedCar.id === car.id}
                        $paint={paint}
                        onClick={() => {
                          getAudioManager().playCue('ui');
                          selectCar(ownedCar.id);
                        }}
                      >
                        <i />
                        <strong>{ownedCar.name}</strong>
                        <span>
                          {ownedCar.brand} · {ownedCar.className}
                        </span>
                      </CarCard>
                    );
                  })}
                </CarRail>
                <div style={{ marginTop: 9, display: 'flex', justifyContent: 'flex-end' }}>
                  <ButtonLink
                    href="/garage"
                    variant="ghost"
                    size="sm"
                    icon={<Settings2 size={11} />}
                  >
                    Customise
                  </ButtonLink>
                </div>
              </Block>

              <Block>
                <BlockHead>
                  <span>
                    <Gauge size={11} /> Difficulty
                  </span>
                  <b>{String(settings.gameplay.difficulty).toUpperCase()}</b>
                </BlockHead>
                <DifficultyGrid>
                  {difficulties.map((entry) => (
                    <DifficultyCard
                      key={entry.value}
                      type="button"
                      $active={settings.gameplay.difficulty === entry.value}
                      $tone={
                        entry.value === 'relaxed'
                          ? '#38bdf8'
                          : entry.value === 'standard'
                            ? '#d7ff3f'
                            : entry.value === 'hard'
                              ? '#fbbf24'
                              : '#ff5d5d'
                      }
                      onClick={() => {
                        getAudioManager().playCue('ui');
                        updateSetting('gameplay', 'difficulty', entry.value);
                      }}
                    >
                      {entry.label}
                    </DifficultyCard>
                  ))}
                </DifficultyGrid>
                <DifficultyHint>
                  {difficulties.find((entry) => entry.value === settings.gameplay.difficulty)?.hint}
                </DifficultyHint>
              </Block>

              <Block>
                <RunSummary>
                  <div>
                    <span>Mode</span>
                    <strong>{modeLabel(runMode)}</strong>
                  </div>
                  <div>
                    <span>Route</span>
                    <strong>{destination.name}</strong>
                  </div>
                  <div>
                    <span>Distance</span>
                    <strong>
                      {runMode === 'endless' ? 'Unlimited' : formatDistance(destination.distanceTarget)}
                    </strong>
                  </div>
                  <div>
                    <span>Best score</span>
                    <strong>{formatNumber(stats.bestScore)}</strong>
                  </div>
                  <div>
                    <span>Speed unit</span>
                    <strong>{settings.gameplay.speedUnit === 'mph' ? 'MPH' : 'KM/H'}</strong>
                  </div>
                </RunSummary>
              </Block>

              <StartArea>
                <Button
                  size="xl"
                  fullWidth
                  loading={starting}
                  icon={<Play size={16} fill="currentColor" />}
                  onClick={handleStart}
                >
                  {runMode === 'endless' ? 'Start endless run' : 'Start race'}
                </Button>
                <StartNote>
                  Progress saves when the run ends. Keyboard, gamepad and touch are all supported.
                </StartNote>
                <FooterLinks>
                  <MiniLink href="/how-to-play" variant="ghost" size="sm">
                    How to play
                  </MiniLink>
                  <MiniLink href="/garage" variant="ghost" size="sm">
                    Garage
                  </MiniLink>
                  <MiniLink href="/settings" variant="ghost" size="sm">
                    Settings
                  </MiniLink>
                  <MiniLink href="/leaderboard" variant="ghost" size="sm">
                    Records
                  </MiniLink>
                </FooterLinks>
              </StartArea>
            </Setup>
          </Grid>
        )}

        <div style={{ height: 24 }} />
      </Main>
      <Footer />
    </>
  );
}

function ceiling(value: number): string {
  return String(value).padStart(2, '0');
}

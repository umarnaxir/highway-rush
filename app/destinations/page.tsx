'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'motion/react';
import {
  Check,
  ChevronRight,
  Coins,
  Flag,
  Gauge,
  Lock,
  MapPin,
  Play,
  Trophy,
  Unlock,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, Panel, PanelLabel, ProgressBar, SectionKicker, StatRow } from '@/components/ui/Panel';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PreviewCanvas } from '@/components/game/PreviewCanvas';
import { DestinationVisual, EnvironmentIcon } from '@/components/ui/DestinationVisual';
import { DESTINATIONS, DESTINATIONS_BY_ID, meetsDestinationRequirement } from '@/lib/data/destinations';
import { CARS_BY_ID, getDefaultCustomization } from '@/lib/data/cars';
import { useGameStore } from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { useUiStore } from '@/lib/store/useUiStore';
import { formatDistance, formatNumber } from '@/lib/ui/format';
import type { Difficulty } from '@/lib/types';
import { media } from '@/lib/ui/theme';

const difficultyTone: Record<Difficulty, 'lime' | 'neutral' | 'warning' | 'danger' | 'info'> = {
  relaxed: 'info',
  standard: 'lime',
  hard: 'warning',
  insane: 'danger',
};

const Stage = styled.div`
  position: relative;
  min-height: 430px;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  background: #06080b;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);

  ${media.mobile} {
    min-height: 330px;
  }
`;

const StageOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(180deg, rgba(4, 6, 7, 0.32), transparent 32%, transparent 62%, rgba(4, 6, 7, 0.82));
`;

const StageTitle = styled.div`
  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(32px, 5vw, 64px);
    font-style: italic;
    line-height: 0.84;
    text-transform: uppercase;
    letter-spacing: -0.025em;
    text-shadow: 0 4px 26px rgba(0, 0, 0, 0.5);
  }
  p {
    margin-top: 8px;
    color: var(--text-muted);
    font-size: 11px;
    max-width: 500px;
    line-height: 1.6;
  }
`;

const StageTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Info = styled(Panel)`
  display: flex;
  flex-direction: column;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 18px;
`;

const RouteNotes = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin-top: 10px;
  border: 1px solid var(--line);
  background: var(--line);
  overflow: hidden;

  div {
    min-width: 0;
    padding: 10px 11px;
    background: var(--panel);
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
    margin-top: 5px;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    line-height: 1.4;
  }
`;

const SignatureRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 12px;
`;

const RouteBrief = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);

  p {
    margin-top: 5px;
    color: var(--text-muted);
    font-size: 10px;
    line-height: 1.65;
  }

  span {
    color: var(--text-dim);
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
`;

const Meta = styled.div`
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);
  span {
    display: block;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 5px;
  }
  strong {
    display: block;
    font-family: var(--font-display);
    font-size: 20px;
    line-height: 1;
    text-transform: uppercase;
  }
`;

const RouteList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;

  ${media.tablet} {
    display: flex;
    gap: 12px;
    margin-inline: calc(-1 * clamp(16px, 3vw, 36px));
    padding: 2px clamp(16px, 3vw, 36px) 12px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      flex: 0 0 min(84vw, 430px);
      scroll-snap-align: start;
    }
  }
`;

const RouteCard = styled.button<{ $active: boolean; $locked: boolean }>`
  display: grid;
  grid-template-columns: 112px 1fr auto;
  align-items: stretch;
  gap: 0;
  padding: 0;
  text-align: left;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.lime : 'var(--line)')};
  border-radius: 5px;
  overflow: hidden;
  background: ${({ $active }) =>
    $active ? 'rgba(215,255,63,.045)' : 'rgba(255,255,255,.015)'};
  transition: all 0.18s ease;

  &:hover {
    border-color: ${({ $active, theme }) => ($active ? theme.colors.lime : theme.colors.lineStrong)};
    transform: translateY(-2px);
  }

  ${media.mobile} {
    grid-template-columns: 96px 1fr auto;
  }
`;

const MotionRouteCard = motion.create(RouteCard);

const CardBody = styled.div`
  padding: 13px 15px;
  min-width: 0;
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;

  svg {
    color: ${({ theme }) => theme.colors.textDim};
  }
`;

const CardName = styled.strong`
  display: block;
  margin-top: 5px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 19px;
  line-height: 0.95;
  text-transform: uppercase;
  letter-spacing: 0.01em;
`;

const CardFoot = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  color: var(--text-dim);
  font-size: 9px;
  font-weight: 700;
  flex-wrap: wrap;
`;

const CardAction = styled.div`
  display: flex;
  align-items: center;
  padding: 0 14px;
  color: ${({ theme }) => theme.colors.textDim};
`;

const LockBanner = styled.div`
  margin-top: 16px;
  padding: 13px 14px;
  border: 1px solid rgba(251, 191, 36, 0.25);
  background: rgba(251, 191, 36, 0.05);
  border-radius: 4px;
  color: var(--warning);
  font-size: 10px;
  line-height: 1.6;
`;

export default function DestinationsPage() {
  const selectedStore = useGameStore((state) => state.selectedDestination);
  const unlockedDestinations = useGameStore((state) => state.unlockedDestinations);
  const selectedCarId = useGameStore((state) => state.selectedCar);
  const customizations = useGameStore((state) => state.customizations);
  const stats = useGameStore((state) => state.stats);
  const runs = useGameStore((state) => state.runs);
  const coins = useGameStore((state) => state.coins);
  const unlockedTrophies = useGameStore((state) => state.unlockedTrophies);
  const quality = useGameStore((state) =>
    state.settings.graphics.performanceMode ? 'low' : state.settings.graphics.effects,
  );
  const invertCamera = useGameStore((state) => state.settings.controls.invertCamera);
  const selectDestination = useGameStore((state) => state.selectDestination);
  const purchaseDestination = useGameStore((state) => state.purchaseDestination);
  const pushToast = useUiStore((state) => state.pushToast);
  const router = useRouter();

  const [browsedId, setBrowsedId] = useState(selectedStore);
  const [unlocking, setUnlocking] = useState(false);

  const destination = DESTINATIONS_BY_ID[browsedId] ?? DESTINATIONS[0];
  const car = CARS_BY_ID[selectedCarId] ?? Object.values(CARS_BY_ID)[0];
  const customization = customizations[car.id] ?? getDefaultCustomization(car);
  const unlocked = unlockedDestinations.includes(destination.id);
  const trophyCount = Object.keys(unlockedTrophies).length;
  const requirement = useMemo(
    () => meetsDestinationRequirement(destination, stats, trophyCount),
    [destination, stats, trophyCount],
  );
  const racesHere = stats.destinationRaces[destination.id] ?? 0;
  const bestHere = runs
    .filter((run) => run.destinationId === destination.id)
    .reduce((best, run) => Math.max(best, run.score), 0);

  const handleUnlock = () => {
    const result = purchaseDestination(destination.id);
    pushToast({
      kind: result.ok ? 'success' : 'error',
      title: result.ok ? `${destination.name} unlocked` : 'Unlock failed',
      message: result.message,
    });
    if (result.ok) {
      getAudioManager().playCue('purchase');
      setBrowsedId(destination.id);
    }
  };

  const race = () => {
    selectDestination(destination.id);
    getAudioManager().playCue('confirm');
    router.push('/play');
  };

  return (
    <PageShell
      kicker="Route selection"
      title={
        <>
          Eight horizons. <em>Pick one.</em>
        </>
      }
      intro="Each route is a complete environment with its own weather, lighting, roadside detail and procedural score. Unlock them with coins and progress."
      actions={
        <>
          <Badge $tone="warning">
            <Coins size={10} /> {formatNumber(coins)}
          </Badge>
          <ButtonLink href="/play" size="sm" variant="secondary" icon={<Flag size={13} />}>
            Race setup
          </ButtonLink>
        </>
      }
      wide
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 0.85fr)',
          gap: 16,
        }}
        className="dest-grid"
      >
        <Stage>
          <PreviewCanvas
            car={car}
            customization={customization}
            mode="destination"
            destination={destination}
            quality={quality}
            invertCamera={invertCamera}
            ariaLabel={`${destination.name} 3D environment preview`}
          />
          <StageOverlay>
            <StageTags>
              <Badge $tone={difficultyTone[destination.difficulty]}>{destination.difficulty}</Badge>
              <Badge>{destination.region}</Badge>
              {unlocked ? (
                <Badge $tone="lime">
                  <Unlock size={9} /> Unlocked
                </Badge>
              ) : (
                <Badge $tone="warning">
                  <Lock size={9} /> Locked
                </Badge>
              )}
            </StageTags>
            <StageTitle>
              <h2>{destination.name}</h2>
              <p>{destination.description}</p>
            </StageTitle>
          </StageOverlay>
        </Stage>

        <Info $glow>
          <PanelLabel>Route briefing</PanelLabel>
          <h3
            style={{
              marginTop: 10,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px,3vw,36px)',
              lineHeight: 0.92,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {destination.tagline}
          </h3>
          <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7 }}>
            {destination.ambience}
          </p>

          <MetaGrid>
            <Meta>
              <span>Distance</span>
              <strong>{formatDistance(destination.distanceTarget, 1)}</strong>
            </Meta>
            <Meta>
              <span>Difficulty</span>
              <strong>{destination.difficulty}</strong>
            </Meta>
            <Meta>
              <span>Your runs</span>
              <strong>{racesHere}</strong>
            </Meta>
            <Meta>
              <span>Best score</span>
              <strong>{bestHere > 0 ? formatNumber(bestHere) : '—'}</strong>
            </Meta>
          </MetaGrid>

          <RouteNotes>
            <div>
              <span>Surface</span>
              <strong>{destination.surface}</strong>
            </div>
            <div>
              <span>Visibility</span>
              <strong>{destination.visibility}</strong>
            </div>
          </RouteNotes>

          <SignatureRow aria-label="Route signatures">
            {destination.signature.map((feature) => (
              <Badge key={feature} $tone="neutral">
                {feature}
              </Badge>
            ))}
          </SignatureRow>

          <RouteBrief>
            <span>Hazards</span>
            <p>{destination.hazards}</p>
          </RouteBrief>
          <RouteBrief>
            <span>The fast line</span>
            <p>{destination.bestLine}</p>
          </RouteBrief>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Environment</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text)' }}>
                <EnvironmentIcon environment={destination.environment} size={12} />
                {destination.theme.timeOfDay} · {destination.theme.weather}
              </span>
            </div>
            <ProgressBar
              value={unlocked ? 100 : 6}
              color={destination.theme.accent}
              height={4}
            />
          </div>

          {unlocked ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
              <Button
                variant={selectedStore === destination.id ? 'secondary' : 'dark'}
                fullWidth
                onClick={() => {
                  selectDestination(destination.id);
                  getAudioManager().playCue('confirm');
                  pushToast({ kind: 'success', title: `${destination.name} set`, message: 'Active route updated.' });
                }}
                icon={selectedStore === destination.id ? <Check size={14} /> : <MapPin size={14} />}
              >
                {selectedStore === destination.id ? 'Active route' : 'Set as active'}
              </Button>
              <Button variant="primary" fullWidth onClick={race} icon={<Play size={14} fill="currentColor" />}>
                Race this route
              </Button>
            </div>
          ) : (
            <>
              <LockBanner>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <Lock size={11} /> {requirement.met ? 'Ready to unlock' : 'Unlock requirements'}
                </strong>
                {requirement.met
                  ? `Costs ${formatNumber(destination.coinCost)} coins.`
                  : requirement.missing.join(' · ')}
              </LockBanner>
              <Button
                variant="primary"
                fullWidth
                style={{ marginTop: 14 }}
                disabled={coins < destination.coinCost || !requirement.met}
                icon={<Unlock size={14} />}
                onClick={() => setUnlocking(true)}
              >
                Unlock · {formatNumber(destination.coinCost)} coins
              </Button>
            </>
          )}

          <div style={{ marginTop: 20 }}>
            <StatRow>
              <span>Music score</span>
              <strong style={{ fontSize: 13, textTransform: 'capitalize' }}>{destination.music}</strong>
            </StatRow>
            <StatRow>
              <span>Cheapest line</span>
              <strong style={{ fontSize: 13 }}>{destination.difficulty === 'insane' ? 'Precision' : 'Traffic threading'}</strong>
            </StatRow>
            <StatRow>
              <span>Route record</span>
              <strong style={{ fontSize: 13 }}>{bestHere > 0 ? formatNumber(bestHere) : 'Unset'}</strong>
            </StatRow>
          </div>
        </Info>
      </div>

      <div style={{ marginTop: 38 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <SectionKicker>All routes</SectionKicker>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                textTransform: 'uppercase',
                fontStyle: 'italic',
              }}
            >
              The full map
            </h2>
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase' }}>
            {unlockedDestinations.length} / {DESTINATIONS.length} unlocked
          </span>
        </div>
        <RouteList>
          {DESTINATIONS.map((item) => {
            const isUnlocked = unlockedDestinations.includes(item.id);
            const best = runs
              .filter((run) => run.destinationId === item.id)
              .reduce((value, run) => Math.max(value, run.score), 0);
            return (
              <MotionRouteCard
                key={item.id}
                $active={item.id === destination.id}
                $locked={!isUnlocked}
                onClick={() => {
                  setBrowsedId(item.id);
                  getAudioManager().playCue('ui');
                }}
                aria-pressed={item.id === destination.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              >
                <DestinationVisual destination={item} height={112} showWeather={false} />
                <CardBody>
                  <CardHead>
                    <EnvironmentIcon environment={item.environment} size={11} /> {item.region}
                  </CardHead>
                  <CardName>{item.name}</CardName>
                  <CardFoot>
                    <Badge $tone={difficultyTone[item.difficulty]}>{item.difficulty}</Badge>
                    <span>{formatDistance(item.distanceTarget, 0)}</span>
                    {best > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Trophy size={10} /> {formatNumber(best)}
                      </span>
                    )}
                  </CardFoot>
                </CardBody>
                <CardAction>
                  {isUnlocked ? (
                    <ChevronRight size={15} color={item.id === destination.id ? 'var(--lime)' : undefined} />
                  ) : (
                    <Lock size={13} />
                  )}
                </CardAction>
              </MotionRouteCard>
            );
          })}
        </RouteList>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 20,
          border: '1px solid var(--line)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,.015)',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Gauge size={22} style={{ color: 'var(--lime)' }} />
          <div>
            <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Need more coins?
            </strong>
            <span style={{ display: 'block', marginTop: 4, color: 'var(--text-muted)', fontSize: 11 }}>
              Daily missions and trophies pay out fast. Check your objectives before your next run.
            </span>
          </div>
        </div>
        <ButtonLink href="/missions" variant="secondary" size="sm" iconRight={<ChevronRight size={13} />}>
          View missions
        </ButtonLink>
      </div>

      <ConfirmDialog
        open={unlocking}
        onClose={() => setUnlocking(false)}
        title={`Unlock ${destination.name}?`}
        message={`${formatNumber(destination.coinCost)} coins will be deducted from your wallet (${formatNumber(coins)} available). The route will become permanently available on this device.`}
        confirmLabel={`Unlock · ${formatNumber(destination.coinCost)}`}
        onConfirm={handleUnlock}
      />
    </PageShell>
  );
}

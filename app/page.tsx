'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import {
  ArrowRight,
  Car,
  Coins,
  Compass,
  Flag,
  Flame,
  Gauge,
  ListChecks,
  Play,
  RotateCcw,
  Settings,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PreviewCanvas } from '@/components/game/PreviewCanvas';
import { CARS_BY_ID, effectiveCarStats, getDefaultCustomization } from '@/lib/data/cars';
import { DESTINATIONS_BY_ID } from '@/lib/data/destinations';
import { useGameStore } from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { formatCompact, formatDistance, formatNumber } from '@/lib/ui/format';
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

const CanvasWrap = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: auto;
`;

const Vignette = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(3, 5, 7, 0.75) 100%),
    linear-gradient(180deg, rgba(3, 5, 7, 0.8) 0%, transparent 16%, transparent 74%, rgba(3, 5, 7, 0.85) 100%),
    linear-gradient(90deg, rgba(3, 5, 7, 0.7) 0%, transparent 35%, transparent 65%, rgba(3, 5, 7, 0.7) 100%);
`;

const Scanlines = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.12) 0 1px,
    transparent 1px 3px
  );
  opacity: 0.55;
`;

const UiOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: max(12px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right))
    max(14px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  pointer-events: auto;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .logo-mark {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 6px;
    border: 1px solid var(--lime);
    background: rgba(215, 255, 63, 0.12);
    color: var(--lime);
    box-shadow: 0 0 16px rgba(215, 255, 63, 0.35);
  }

  .logo-text {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 22px;
    font-style: italic;
    font-weight: 900;
    letter-spacing: -0.02em;
    line-height: 1;
    text-transform: uppercase;

    span {
      color: var(--lime);
      margin-left: 4px;
    }
  }
`;

const TopRightPills = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Pill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 13px;
  border-radius: 4px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.78);
  backdrop-filter: blur(10px);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text);

  svg {
    width: 14px;
    height: 14px;
    color: var(--lime);
  }

  &.currency {
    color: var(--warning);
    border-color: rgba(251, 191, 36, 0.35);
    font-family: ${({ theme }) => theme.fonts.mono};
    svg {
      color: var(--warning);
    }
  }
`;

const AudioToggle = styled.button`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.78);
  color: var(--text-muted);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--lime);
    color: var(--lime);
    background: rgba(215, 255, 63, 0.1);
  }
`;

const CenterContent = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-end;
  gap: 32px;
  margin-top: auto;
  margin-bottom: 24px;

  ${media.desktop} {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const MainMenu = styled.nav`
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;

  ${media.mobile} {
    max-width: 100%;
  }
`;

const TitleBlock = styled.div`
  margin-bottom: 14px;

  h1 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(38px, 6.8vw, 84px);
    font-style: italic;
    font-weight: 900;
    line-height: 0.88;
    letter-spacing: -0.04em;
    text-transform: uppercase;
    text-shadow: 0 4px 28px rgba(0, 0, 0, 0.85);
    margin: 0;

    em {
      color: var(--lime);
      font-style: inherit;
    }
  }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(215,255,63,.4), 0 0 45px rgba(215,255,63,.15); }
  50% { box-shadow: 0 0 35px rgba(215,255,63,.65), 0 0 70px rgba(215,255,63,.3); }
`;

const PlayButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-radius: 4px;
  background: var(--lime);
  color: #07090b;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 20px;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  animation: ${glowPulse} 2.6s infinite ease-in-out;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);

  svg {
    transition: transform 0.2s ease;
  }

  &:hover {
    transform: translateX(6px) scale(1.02);
    background: #e6ff66;
    svg {
      transform: translateX(4px);
    }
  }

  &:active {
    transform: scale(0.98);
  }
`;

const MenuButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  border-radius: 4px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.82);
  backdrop-filter: blur(12px);
  color: var(--text);
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 14px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.16s ease;

  span {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  svg {
    color: var(--text-dim);
    transition: color 0.16s ease, transform 0.16s ease;
  }

  &:hover {
    border-color: var(--lime);
    color: var(--lime);
    background: rgba(215, 255, 63, 0.08);
    transform: translateX(4px);

    svg {
      color: var(--lime);
      transform: translateX(3px);
    }
  }
`;

const TelemetryCard = styled.aside`
  pointer-events: auto;
  width: min(360px, 100%);
  padding: 18px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.84);
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);

  ${media.mobile} {
    display: none;
  }
`;

const MobileVehicleStrip = styled.div`
  display: none;
  pointer-events: auto;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.88);
  backdrop-filter: blur(12px);

  .vehicle-info {
    strong {
      display: block;
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 13px;
      font-style: italic;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--text);
    }
    span {
      display: block;
      margin-top: 2px;
      color: var(--text-dim);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
  }

  .vehicle-stats {
    display: flex;
    align-items: center;
    gap: 6px;

    .class-tag {
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--lime);
      padding: 3px 6px;
      border-radius: 2px;
      background: rgba(215, 255, 63, 0.12);
    }

    .spd-tag {
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 9px;
      font-weight: 800;
      color: var(--text-muted);
    }
  }

  ${media.mobile} {
    display: flex;
  }
`;

const TelemetryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 12px;

  h3 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 16px;
    font-style: italic;
    font-weight: 800;
    text-transform: uppercase;
  }

  span {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--lime);
    padding: 3px 6px;
    border-radius: 2px;
    background: rgba(215, 255, 63, 0.1);
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  .stat {
    span {
      display: block;
      color: var(--text-dim);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }
    strong {
      display: block;
      margin-top: 3px;
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
    }
  }
`;

const QuickHintBar = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
  pointer-events: auto;

  .shortcuts {
    display: flex;
    align-items: center;
    gap: 14px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    kbd {
      padding: 1px 4px;
      border-radius: 2px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.06);
      color: var(--lime);
      font-family: ${({ theme }) => theme.fonts.mono};
    }
  }

  ${media.mobile} {
    .shortcuts {
      display: none;
    }
  }
`;

export default function HomePage() {
  const router = useRouter();
  const selectedCarId = useGameStore((state) => state.selectedCar);
  const selectedDestinationId = useGameStore((state) => state.selectedDestination);
  const coins = useGameStore((state) => state.coins);
  const stats = useGameStore((state) => state.stats);
  const customizations = useGameStore((state) => state.customizations);
  const unlockedTrophies = useGameStore((state) => state.unlockedTrophies);
  const muted = useGameStore((state) => state.settings.audio.muted);
  const updateSetting = useGameStore((state) => state.updateSetting);

  const car = useMemo(
    () => CARS_BY_ID[selectedCarId] ?? CARS_BY_ID['phantom-gt'],
    [selectedCarId],
  );
  const customization = useMemo(
    () => customizations[car.id] ?? getDefaultCustomization(car),
    [customizations, car],
  );
  const destination = useMemo(
    () => DESTINATIONS_BY_ID[selectedDestinationId] ?? DESTINATIONS_BY_ID['alpine-crest'],
    [selectedDestinationId],
  );

  const carStats = useMemo(() => effectiveCarStats(car, customization), [car, customization]);
  const trophyCount = useMemo(() => Object.keys(unlockedTrophies).length, [unlockedTrophies]);

  // Keyboard shortcut listener for instantaneous game feel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        router.push('/play');
      } else if (e.code === 'KeyG') {
        router.push('/garage');
      } else if (e.code === 'KeyD') {
        router.push('/destinations');
      } else if (e.code === 'KeyM') {
        router.push('/missions');
      } else if (e.code === 'KeyT') {
        router.push('/trophies');
      } else if (e.code === 'KeyS') {
        router.push('/settings');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  return (
    <Stage>
      {/* 3D Real-time Highway Scene */}
      <CanvasWrap>
        <PreviewCanvas
          car={car}
          customization={customization}
          mode="destination"
          destination={destination}
          quality="high"
          lateralShift={2.0}
          ariaLabel="Highway Rush 3D Showroom"
        />
      </CanvasWrap>

      <Vignette />
      <Scanlines />

      {/* Futuristic Game HUD Overlay */}
      <UiOverlay>
        <TopBar>
          <Brand>
            <div className="logo-mark">
              <Image
                src="/icon.svg"
                width={32}
                height={32}
                alt="Highway Rush Logo"
                priority
                unoptimized
                style={{ display: 'block', borderRadius: 6, objectFit: 'contain' }}
              />
            </div>
            <div className="logo-text">
              Highway<span>Rush</span>
            </div>
          </Brand>

          <TopRightPills>
            <Pill className="currency" aria-label="Coins">
              <Coins /> {formatNumber(coins)}
            </Pill>
            <Pill aria-label="Best Speed">
              <Gauge /> {Math.round(stats.highestSpeed)} KM/H
            </Pill>
            <AudioToggle
              type="button"
              onClick={() => {
                const nextMuted = !muted;
                updateSetting('audio', 'muted', nextMuted);
                getAudioManager().playCue('ui');
              }}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </AudioToggle>
          </TopRightPills>
        </TopBar>

        <CenterContent>
          <MainMenu>
            <TitleBlock>
              <h1>
                Own the<br /><em>Highway.</em>
              </h1>
            </TitleBlock>

            <PlayButton href="/play">
              <span>Drive Now</span>
              <Play size={20} fill="currentColor" />
            </PlayButton>

            <MobileVehicleStrip>
              <div className="vehicle-info">
                <strong>{car.name}</strong>
                <span>{destination.name}</span>
              </div>
              <div className="vehicle-stats">
                <span className="class-tag">{car.className}</span>
                <span className="spd-tag">{carStats.speed} SPD</span>
              </div>
            </MobileVehicleStrip>

            <MenuButton href="/garage">
              <span>
                <Car size={16} /> Garage & Upgrades
              </span>
              <ArrowRight size={14} />
            </MenuButton>

            <MenuButton href="/destinations">
              <span>
                <Compass size={16} /> Destinations
              </span>
              <ArrowRight size={14} />
            </MenuButton>

            <MenuButton href="/missions">
              <span>
                <ListChecks size={16} /> Missions & Contracts
              </span>
              <ArrowRight size={14} />
            </MenuButton>

            <MenuButton href="/trophies">
              <span>
                <Trophy size={16} /> Trophy Hall ({trophyCount}/28)
              </span>
              <ArrowRight size={14} />
            </MenuButton>

            <MenuButton href="/settings">
              <span>
                <Settings size={16} /> Settings
              </span>
              <ArrowRight size={14} />
            </MenuButton>
          </MainMenu>

          <TelemetryCard>
            <TelemetryHeader>
              <div>
                <h3>{car.name}</h3>
                <span style={{ background: 'none', padding: 0, color: 'var(--text-muted)' }}>
                  {destination.name}
                </span>
              </div>
              <span>{car.className}</span>
            </TelemetryHeader>

            <StatGrid>
              <div className="stat">
                <span>Top Speed</span>
                <strong>{carStats.speed}</strong>
              </div>
              <div className="stat">
                <span>Acceleration</span>
                <strong>{carStats.acceleration}</strong>
              </div>
              <div className="stat">
                <span>Handling</span>
                <strong>{carStats.handling}</strong>
              </div>
              <div className="stat">
                <span>Nitro Power</span>
                <strong>{carStats.nitro}</strong>
              </div>
              <div className="stat">
                <span>Total Distance</span>
                <strong>{formatDistance(stats.totalDistanceM)}</strong>
              </div>
              <div className="stat">
                <span>Near Misses</span>
                <strong>{formatNumber(stats.nearMisses)}</strong>
              </div>
            </StatGrid>
          </TelemetryCard>
        </CenterContent>

        <QuickHintBar>
          <div className="shortcuts">
            <span>
              <kbd>ENTER</kbd> PLAY NOW
            </span>
            <span>
              <kbd>G</kbd> GARAGE
            </span>
            <span>
              <kbd>D</kbd> DESTINATIONS
            </span>
            <span>
              <kbd>M</kbd> MISSIONS
            </span>
            <span>
              <kbd>S</kbd> SETTINGS
            </span>
          </div>

          <div>HIGHWAY RUSH v2.0 · 3D RACING SYSTEM</div>
        </QuickHintBar>
      </UiOverlay>
    </Stage>
  );
}

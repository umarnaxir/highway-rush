'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import {
  ArrowLeft,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flame,
  Gauge,
  Lock,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Unlock,
  Wrench,
  Zap,
} from 'lucide-react';
import { PreviewCanvas } from '@/components/game/PreviewCanvas';
import {
  CARS,
  CARS_BY_ID,
  MAX_UPGRADE_LEVEL,
  UNDERGLOW_COLORS,
  UPGRADE_DEFS,
  effectiveCarStats,
  getDefaultCustomization,
  getUpgradeCost,
  getUpgrades,
} from '@/lib/data/cars';
import { useGameStore } from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { useUiStore } from '@/lib/store/useUiStore';
import { formatNumber, titleCase } from '@/lib/ui/format';
import type {
  CarCustomization,
  DecalStyle,
  SpoilerStyle,
  UpgradeKey,
  WheelStyle,
} from '@/lib/types';
import { media } from '@/lib/ui/theme';

const paintSwatches = [
  '#d7ff3f',
  '#f8fafc',
  '#e5e7eb',
  '#111827',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#38bdf8',
  '#3b82f6',
  '#8b5cf6',
  '#f0abfc',
];

const spoilers: Array<{ value: SpoilerStyle; label: string }> = [
  { value: 'none', label: 'Clean' },
  { value: 'lip', label: 'Lip' },
  { value: 'sport', label: 'Sport' },
  { value: 'gt', label: 'GT Wing' },
];

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
      color: var(--lime);
      width: 13px;
      height: 13px;
    }

    &.currency {
      color: var(--warning);
      border-color: rgba(251, 191, 36, 0.35);
      font-family: ${({ theme }) => theme.fonts.mono};
      svg {
        color: var(--warning);
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
  font-size: clamp(32px, 5vw, 64px);
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

/* 4-COLUMN CENTERED TELEMETRY MATRIX */
const TelemetryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 680px;
  margin: 2px auto 0 auto;

  ${media.mobile} {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
`;

const TelemetryBox = styled.div`
  background: rgba(10, 14, 18, 0.82);
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  padding: 8px 10px;
  backdrop-filter: blur(10px);
  text-align: left;

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 4px;

    b {
      color: var(--text);
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 9px;
    }
  }

  .meter {
    height: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;

    .fill {
      height: 100%;
      border-radius: inherit;
      background: var(--lime);
      box-shadow: 0 0 8px rgba(215, 255, 63, 0.45);
      transition: width 0.3s ease;
    }
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
  min-width: 290px;
  padding: 15px 30px;
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
  text-decoration: none;

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
    padding: 13px 20px;
  }
`;

/* CENTERED STUDIO CONTROLS */
const StudioContainer = styled.div`
  pointer-events: auto;
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const TabRow = styled.div`
  display: flex;
  gap: 6px;
  background: rgba(10, 14, 18, 0.85);
  padding: 4px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  backdrop-filter: blur(14px);
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
`;

const TabBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 4px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(215, 255, 63, 0.16)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 11px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text);
  }
`;

/* CAROUSEL SHELF FOR MACHINE ROSTER */
const CarouselWrap = styled.div`
  width: 100%;
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

const CarCard = styled.button<{ $active: boolean; $locked: boolean }>`
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

/* TUNING GRID PANEL */
const TuningGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 880px;

  ${media.desktop} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${media.mobile} {
    grid-template-columns: 1fr;
    max-height: 220px;
    overflow-y: auto;
  }
`;

const UpgradeCard = styled.div`
  padding: 14px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.88);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    .icon-title {
      display: flex;
      align-items: center;
      gap: 7px;
      color: var(--text);
      svg {
        color: var(--lime);
      }
    }
  }

  .dots {
    display: flex;
    gap: 4px;
    i {
      flex: 1;
      height: 4px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      &.on {
        background: var(--lime);
        box-shadow: 0 0 8px rgba(215, 255, 63, 0.5);
      }
    }
  }

  .desc {
    font-size: 9px;
    color: var(--text-dim);
    line-height: 1.3;
  }
`;

const UpgradeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid rgba(215, 255, 63, 0.4);
  background: rgba(215, 255, 63, 0.12);
  color: var(--lime);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(215, 255, 63, 0.24);
    border-color: var(--lime);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: var(--line);
    color: var(--text-dim);
  }
`;

/* VISUAL CUSTOMIZATION PANEL */
const VisualsPanel = styled.div`
  width: 100%;
  max-width: 820px;
  padding: 16px 20px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.88);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);

  ${media.mobile} {
    max-height: 240px;
    overflow-y: auto;
  }

  .section-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;

    label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--text-dim);
      min-width: 110px;
    }
  }
`;

const SwatchRow = styled.div`
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  align-items: center;
`;

const Swatch = styled.button<{ $color: string; $active: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid ${({ $active }) => ($active ? 'var(--lime)' : 'rgba(255,255,255,.18)')};
  background: ${({ $color }) => $color};
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: ${({ $active }) => ($active ? '0 0 10px rgba(215, 255, 63, 0.6)' : 'none')};
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.18);
  }
`;

const PillRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const OptionPill = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'var(--line-strong)')};
  background: ${({ $active }) => ($active ? 'rgba(215,255,63,.14)' : 'rgba(255,255,255,.03)')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text);
    border-color: var(--lime);
  }
`;

export default function GaragePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'roster' | 'upgrades' | 'customize'>('roster');
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const coins = useGameStore((state) => state.coins);
  const ownedCars = useGameStore((state) => state.ownedCars);
  const selectedCarId = useGameStore((state) => state.selectedCar);
  const selectCar = useGameStore((state) => state.selectCar);
  const purchaseCar = useGameStore((state) => state.purchaseCar);
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);
  const updateCustomization = useGameStore((state) => state.updateCustomization);
  const customizations = useGameStore((state) => state.customizations);
  const pushToast = useUiStore((state) => state.pushToast);

  const displayedCarId = activeCarId ?? selectedCarId;
  const car = useMemo(
    () => CARS_BY_ID[displayedCarId] ?? CARS[0],
    [displayedCarId],
  );
  const customization = useMemo(
    () => customizations[car.id] ?? getDefaultCustomization(car),
    [customizations, car],
  );
  const stats = useMemo(() => effectiveCarStats(car, customization), [car, customization]);
  const upgrades = useMemo(() => getUpgrades(customization), [customization]);
  const isOwned = ownedCars.includes(car.id);
  const isSelected = selectedCarId === car.id;

  const handleCarSelect = useCallback((id: string) => {
    setActiveCarId(id);
    getAudioManager().playCue('ui');
  }, []);

  const handlePrev = useCallback(() => {
    const idx = CARS.findIndex((c) => c.id === car.id);
    const prevIdx = idx > 0 ? idx - 1 : CARS.length - 1;
    handleCarSelect(CARS[prevIdx].id);
  }, [car.id, handleCarSelect]);

  const handleNext = useCallback(() => {
    const idx = CARS.findIndex((c) => c.id === car.id);
    const nextIdx = idx < CARS.length - 1 ? idx + 1 : 0;
    handleCarSelect(CARS[nextIdx].id);
  }, [car.id, handleCarSelect]);

  const handleEquip = useCallback(() => {
    selectCar(car.id);
    getAudioManager().playCue('confirm');
    pushToast({
      kind: 'success',
      title: `${car.name} Equipped`,
      message: 'Active machine ready for the highway.',
    });
  }, [car.id, car.name, pushToast, selectCar]);

  const handleBuy = useCallback(() => {
    const res = purchaseCar(car.id);
    if (res.ok) {
      getAudioManager().playCue('purchase');
      selectCar(car.id);
      pushToast({
        kind: 'success',
        title: `${car.name} Unlocked`,
        message: 'Permanent addition to your collection.',
      });
    } else {
      getAudioManager().playCue('error');
      pushToast({ kind: 'error', title: 'Insufficient Coins', message: res.message });
    }
  }, [car.id, car.name, purchaseCar, pushToast, selectCar]);

  const handleUpgrade = useCallback((key: UpgradeKey) => {
    const res = purchaseUpgrade(car.id, key);
    if (res.ok) {
      getAudioManager().playCue('purchase');
      pushToast({
        kind: 'success',
        title: `${titleCase(key)} Tuned`,
        message: 'Stage upgraded successfully.',
      });
    } else {
      getAudioManager().playCue('error');
      pushToast({ kind: 'error', title: 'Upgrade Failed', message: res.message });
    }
  }, [car.id, purchaseUpgrade, pushToast]);

  const applyCustomization = useCallback((patch: Partial<CarCustomization>) => {
    const next = { ...customization, ...patch };
    updateCustomization(car.id, next);
    getAudioManager().playCue('ui');
  }, [car.id, customization, updateCustomization]);

  // Keyboard controls for carousel and action execution
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'roster') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        }
      }
      if (e.key === 'Enter') {
        if (!isOwned && coins >= car.price) {
          handleBuy();
        } else if (isOwned && !isSelected) {
          handleEquip();
        } else if (isSelected) {
          router.push('/play');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, car.price, coins, handleBuy, handleEquip, handleNext, handlePrev, isOwned, isSelected, router]);

  // Keep active card centered in the roster rail
  useEffect(() => {
    const activeEl = railRef.current?.querySelector<HTMLElement>(`[data-car-id="${car.id}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [car.id, activeTab]);

  return (
    <Stage>
      {/* 3D Interactive Turntable Showroom */}
      <BackgroundCanvas>
        <PreviewCanvas
          car={car}
          customization={customization}
          mode="car"
          quality="high"
          ariaLabel={`${car.name} 3D Showroom`}
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
            <Car size={14} /> <span>Vehicle Showroom</span> {'//'} Garage Spec
          </ScreenTitle>

          <HeaderStats>
            <div className="stat-pill">
              <Sparkles size={13} /> {ownedCars.length}/{CARS.length} Owned
            </div>
            <div className="stat-pill currency">
              <Coins size={13} /> {formatNumber(coins)}
            </div>
          </HeaderStats>
        </TopNav>

        {/* CENTERED HERO WITH SPECS AND CALL TO ACTION */}
        <CenterHero>
          <KickerBadge>
            <Sparkles size={11} /> {car.className.toUpperCase()} CLASS · PERFORMANCE TUNED · HIGHWAY SPEC
          </KickerBadge>

          <HeroTitle>{car.name}</HeroTitle>

          {/* 4-COLUMN CENTERED PERFORMANCE TELEMETRY */}
          <TelemetryGrid>
            <TelemetryBox>
              <div className="head">
                <span>Top Speed</span>
                <b>{stats.speed} KM/H</b>
              </div>
              <div className="meter">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (stats.speed / 100) * 100)}%` }}
                />
              </div>
            </TelemetryBox>

            <TelemetryBox>
              <div className="head">
                <span>Acceleration</span>
                <b>{stats.acceleration}</b>
              </div>
              <div className="meter">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (stats.acceleration / 100) * 100)}%` }}
                />
              </div>
            </TelemetryBox>

            <TelemetryBox>
              <div className="head">
                <span>Handling</span>
                <b>{stats.handling}</b>
              </div>
              <div className="meter">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (stats.handling / 100) * 100)}%` }}
                />
              </div>
            </TelemetryBox>

            <TelemetryBox>
              <div className="head">
                <span>Nitro Boost</span>
                <b>{stats.nitro}</b>
              </div>
              <div className="meter">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (stats.nitro / 100) * 100)}%` }}
                />
              </div>
            </TelemetryBox>
          </TelemetryGrid>

          {/* ACTION CTA BUTTON */}
          {!isOwned ? (
            <MainActionBtn
              type="button"
              $locked
              disabled={coins < car.price}
              onClick={handleBuy}
            >
              <Unlock size={18} /> Unlock Machine ({formatNumber(car.price)} Coins)
            </MainActionBtn>
          ) : !isSelected ? (
            <MainActionBtn type="button" onClick={handleEquip}>
              <Check size={18} /> Equip Machine
            </MainActionBtn>
          ) : (
            <MainActionBtn as={Link} href="/play">
              <Play size={18} fill="currentColor" /> Select &amp; Race Machine
            </MainActionBtn>
          )}
        </CenterHero>

        {/* CENTERED STUDIO SHELF & CONTROLS */}
        <StudioContainer>
          <TabRow>
            <TabBtn
              type="button"
              $active={activeTab === 'roster'}
              onClick={() => {
                setActiveTab('roster');
                getAudioManager().playCue('ui');
              }}
            >
              <Car size={13} /> Machine Roster ({ownedCars.length}/{CARS.length})
            </TabBtn>
            <TabBtn
              type="button"
              $active={activeTab === 'upgrades'}
              onClick={() => {
                setActiveTab('upgrades');
                getAudioManager().playCue('ui');
              }}
            >
              <Wrench size={13} /> Tuning Stages
            </TabBtn>
            <TabBtn
              type="button"
              $active={activeTab === 'customize'}
              onClick={() => {
                setActiveTab('customize');
                getAudioManager().playCue('ui');
              }}
            >
              <Palette size={13} /> Visual Customization
            </TabBtn>
          </TabRow>

          {/* TAB 1: MACHINE ROSTER HORIZONTAL CAROUSEL */}
          {activeTab === 'roster' && (
            <CarouselWrap>
              <ArrowNavBtn
                type="button"
                onClick={handlePrev}
                aria-label="Previous Vehicle"
              >
                <ChevronLeft size={18} />
              </ArrowNavBtn>

              <TrackRail ref={railRef} role="region" aria-label="Vehicle Roster">
                {CARS.map((c) => {
                  const owned = ownedCars.includes(c.id);
                  const selected = c.id === car.id;
                  const isCurrentEquipped = selectedCarId === c.id;

                  return (
                    <CarCard
                      key={c.id}
                      data-car-id={c.id}
                      type="button"
                      $active={selected}
                      $locked={!owned}
                      onClick={() => handleCarSelect(c.id)}
                    >
                      <div className="card-top">
                        <span>{c.className}</span>
                        {!owned ? (
                          <Lock size={10} />
                        ) : isCurrentEquipped ? (
                          <Check size={10} color="var(--lime)" />
                        ) : (
                          <Sparkles size={10} />
                        )}
                      </div>
                      <strong>{c.name}</strong>
                      <div className="card-bottom">
                        {isCurrentEquipped ? (
                          <span style={{ color: 'var(--lime)', fontWeight: 800 }}>EQUIPPED</span>
                        ) : owned ? (
                          <span>OWNED</span>
                        ) : (
                          <span>{formatNumber(c.price)} COINS</span>
                        )}
                      </div>
                    </CarCard>
                  );
                })}
              </TrackRail>

              <ArrowNavBtn
                type="button"
                onClick={handleNext}
                aria-label="Next Vehicle"
              >
                <ChevronRight size={18} />
              </ArrowNavBtn>
            </CarouselWrap>
          )}

          {/* TAB 2: TUNING STAGES CONSOLE */}
          {activeTab === 'upgrades' && (
            <TuningGrid>
              {UPGRADE_DEFS.map((stg) => {
                const level = upgrades[stg.key] ?? 0;
                const maxed = level >= MAX_UPGRADE_LEVEL;
                const cost = getUpgradeCost(car, stg.key, level);

                const icon =
                  stg.key === 'engine' ? (
                    <Zap size={14} />
                  ) : stg.key === 'tyres' ? (
                    <Gauge size={14} />
                  ) : stg.key === 'brakes' ? (
                    <ShieldCheck size={14} />
                  ) : (
                    <Flame size={14} />
                  );

                return (
                  <UpgradeCard key={stg.key}>
                    <div>
                      <div className="head">
                        <div className="icon-title">
                          {icon}
                          <span>{stg.label}</span>
                        </div>
                        <span style={{ color: 'var(--lime)', fontFamily: 'var(--font-mono)' }}>
                          LVL {level}/{MAX_UPGRADE_LEVEL}
                        </span>
                      </div>
                      <div className="dots" style={{ marginTop: 8 }}>
                        {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => (
                          <i key={i} className={i < level ? 'on' : ''} />
                        ))}
                      </div>
                      <p className="desc" style={{ marginTop: 8 }}>
                        {stg.description}
                      </p>
                    </div>

                    <UpgradeBtn
                      type="button"
                      disabled={maxed || !isOwned || cost === null || coins < cost}
                      onClick={() => handleUpgrade(stg.key)}
                    >
                      {maxed || cost === null
                        ? 'MAXED OUT'
                        : !isOwned
                          ? 'OWN CAR TO TUNE'
                          : `+ STAGE ${level + 1} (${formatNumber(cost)} COINS)`}
                    </UpgradeBtn>
                  </UpgradeCard>
                );
              })}
            </TuningGrid>
          )}

          {/* TAB 3: VISUAL CUSTOMIZATION */}
          {activeTab === 'customize' && (
            <VisualsPanel>
              <div className="section-row">
                <label>Factory Paint</label>
                <SwatchRow>
                  {paintSwatches.map((color) => (
                    <Swatch
                      key={color}
                      $color={color}
                      $active={customization.paint.toLowerCase() === color.toLowerCase()}
                      onClick={() => applyCustomization({ paint: color })}
                      aria-label={`Select paint ${color}`}
                    >
                      {customization.paint.toLowerCase() === color.toLowerCase() && (
                        <Check size={11} color="#000" />
                      )}
                    </Swatch>
                  ))}
                </SwatchRow>
              </div>

              <div className="section-row">
                <label>Aero Spoilers</label>
                <PillRow>
                  {spoilers.map((sp) => (
                    <OptionPill
                      key={sp.value}
                      $active={customization.spoiler === sp.value}
                      onClick={() => applyCustomization({ spoiler: sp.value })}
                    >
                      {sp.label}
                    </OptionPill>
                  ))}
                </PillRow>
              </div>

              <div className="section-row">
                <label>Underglow Neon</label>
                <SwatchRow>
                  <button
                    type="button"
                    onClick={() => applyCustomization({ underglow: null })}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '1px solid var(--line-strong)',
                      background: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                    title="Remove Underglow"
                  >
                    ✕
                  </button>
                  {UNDERGLOW_COLORS.map((color) => (
                    <Swatch
                      key={color}
                      $color={color}
                      $active={customization.underglow === color}
                      onClick={() => applyCustomization({ underglow: color })}
                      aria-label={`Select underglow ${color}`}
                    >
                      {customization.underglow === color && (
                        <Check size={11} color="#000" />
                      )}
                    </Swatch>
                  ))}
                </SwatchRow>
              </div>
            </VisualsPanel>
          )}
        </StudioContainer>
      </Overlay>
    </Stage>
  );
}

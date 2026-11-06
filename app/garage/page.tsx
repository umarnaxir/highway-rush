'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
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
  SpoilerStyle,
  UpgradeKey,
} from '@/lib/types';
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
  SidebarBarRow,
  SidebarSection,
  SidebarPillGroup,
  SidebarPill,
  SidebarPrimaryBtn,
  SidebarHeaderRow,
  QuickCycleGroup,
  RosterList,
  RosterItem,
} from '@/components/ui/GameSidebar';

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

/* SIDEBAR STUDIO COMPONENTS */
const TuningStageCard = styled.div`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(12, 17, 24, 0.65);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: rgba(215, 255, 63, 0.3);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    .icon-title {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ffffff;
      svg {
        color: var(--lime);
      }
    }
  }

  .dots {
    display: flex;
    gap: 3px;
    i {
      flex: 1;
      height: 3px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      &.on {
        background: var(--lime);
        box-shadow: 0 0 6px rgba(215, 255, 63, 0.5);
      }
    }
  }

  .desc {
    font-size: 8px;
    color: var(--text-dim);
    line-height: 1.3;
    margin: 0;
  }
`;

const UpgradeActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid rgba(215, 255, 63, 0.4);
  background: rgba(215, 255, 63, 0.12);
  color: var(--lime);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 8.5px;
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
    border-color: rgba(255, 255, 255, 0.08);
    color: var(--text-dim);
  }
`;

const VisualsBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(12, 17, 24, 0.65);

  .section-row {
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--text-dim);
    }
  }
`;

const SwatchRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
`;

const Swatch = styled.button<{ $color: string; $active: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid ${({ $active }) => ($active ? 'var(--lime)' : 'rgba(255,255,255,.18)')};
  background: ${({ $color }) => $color};
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: ${({ $active }) => ($active ? '0 0 8px rgba(215, 255, 63, 0.6)' : 'none')};
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.18);
  }
`;

const PillRow = styled.div`
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
`;

const OptionPill = styled.button<{ $active: boolean }>`
  padding: 5px 9px;
  border-radius: 4px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'rgba(255,255,255,0.08)')};
  background: ${({ $active }) => ($active ? 'rgba(215,255,63,.14)' : 'rgba(255,255,255,.03)')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #ffffff;
    border-color: var(--lime);
  }
`;

export default function GaragePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'roster' | 'upgrades' | 'customize'>('roster');
  const [activeCarId, setActiveCarId] = useState<string | null>(null);

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

  const currentIndex = useMemo(
    () => CARS.findIndex((c) => c.id === car.id),
    [car.id],
  );

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

  // Keyboard controls for cycling and quick action
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter') {
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
  }, [car.price, coins, handleBuy, handleEquip, handleNext, handlePrev, isOwned, isSelected, router]);

  return (
    <Stage>
      {/* 3D Interactive Turntable Showroom with 100% unobstructed view */}
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
      </Overlay>

      {/* ALL-IN-ONE RIGHT-SIDE GLASSMORPHISM SIDEBAR */}
      <GameSidebarRoot aria-label="Machine Specification & Studio Controls">
        <MobileDragHandle />
        <SidebarScroll>
          {/* HEADER ROW WITH QUICK CAR ARROWS */}
          <div>
            <SidebarKicker>
              <Sparkles size={11} /> {car.className.toUpperCase()} CLASS {'//'} SPECIFICATION
            </SidebarKicker>
            <SidebarHeaderRow>
              <SidebarTitle>{car.name}</SidebarTitle>
              <QuickCycleGroup>
                <button type="button" onClick={handlePrev} title="Previous Machine (Left Arrow)">
                  <ChevronLeft size={15} />
                </button>
                <span>{currentIndex + 1}/{CARS.length}</span>
                <button type="button" onClick={handleNext} title="Next Machine (Right Arrow)">
                  <ChevronRight size={15} />
                </button>
              </QuickCycleGroup>
            </SidebarHeaderRow>
            <SidebarSubtitle>
              {isSelected
                ? 'Active Highway Machine'
                : isOwned
                  ? 'Owned in Personal Collection'
                  : 'Locked Showroom Spec'}
            </SidebarSubtitle>
          </div>

          <SidebarBadgeRow>
            <SidebarBadge $tone="var(--lime)">
              {car.className.toUpperCase()}
            </SidebarBadge>
            <SidebarBadge $tone={isSelected ? 'var(--lime)' : isOwned ? 'var(--text)' : 'var(--warning)'}>
              {isSelected ? 'EQUIPPED' : isOwned ? 'OWNED' : `${formatNumber(car.price)} COINS`}
            </SidebarBadge>
            <SidebarBadge>
              {car.drivetrain.toUpperCase()} · {car.powerHp} HP
            </SidebarBadge>
          </SidebarBadgeRow>

          {/* TELEMETRY PERFORMANCE BARS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SidebarBarRow>
              <div className="head">
                <span>Top Speed</span>
                <b>{stats.speed} KM/H</b>
              </div>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (stats.speed / 100) * 100)}%` }}
                />
              </div>
            </SidebarBarRow>

            <SidebarBarRow>
              <div className="head">
                <span>Acceleration</span>
                <b>{stats.acceleration}</b>
              </div>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (stats.acceleration / 100) * 100)}%` }}
                />
              </div>
            </SidebarBarRow>

            <SidebarBarRow>
              <div className="head">
                <span>Handling</span>
                <b>{stats.handling}</b>
              </div>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (stats.handling / 100) * 100)}%` }}
                />
              </div>
            </SidebarBarRow>

            <SidebarBarRow>
              <div className="head">
                <span>Nitro Boost</span>
                <b>{stats.nitro}</b>
              </div>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (stats.nitro / 100) * 100)}%` }}
                />
              </div>
            </SidebarBarRow>
          </div>

          {/* STUDIO CONTROLS: TABS INSIDE SIDEBAR */}
          <SidebarSection>
            <span className="section-label">Garage Studio Panel</span>
            <SidebarPillGroup>
              <SidebarPill
                type="button"
                $active={activeTab === 'roster'}
                onClick={() => {
                  setActiveTab('roster');
                  getAudioManager().playCue('ui');
                }}
              >
                <Car size={11} style={{ marginRight: 4 }} /> Roster ({ownedCars.length}/{CARS.length})
              </SidebarPill>
              <SidebarPill
                type="button"
                $active={activeTab === 'upgrades'}
                onClick={() => {
                  setActiveTab('upgrades');
                  getAudioManager().playCue('ui');
                }}
              >
                <Wrench size={11} style={{ marginRight: 4 }} /> Tuning
              </SidebarPill>
              <SidebarPill
                type="button"
                $active={activeTab === 'customize'}
                onClick={() => {
                  setActiveTab('customize');
                  getAudioManager().playCue('ui');
                }}
              >
                <Palette size={11} style={{ marginRight: 4 }} /> Visuals
              </SidebarPill>
            </SidebarPillGroup>
          </SidebarSection>

          {/* TAB 1: MACHINE ROSTER LIST */}
          {activeTab === 'roster' && (
            <RosterList>
              {CARS.map((c) => {
                const owned = ownedCars.includes(c.id);
                const selected = c.id === car.id;
                const isCurrentEquipped = selectedCarId === c.id;

                return (
                  <RosterItem
                    key={c.id}
                    type="button"
                    $active={selected}
                    $locked={!owned}
                    onClick={() => handleCarSelect(c.id)}
                  >
                    <div className="item-left">
                      <div className="item-class">{c.className}</div>
                      <div className="item-name">{c.name}</div>
                    </div>
                    <div className="item-right">
                      {isCurrentEquipped ? (
                        <span className="tag-equipped">
                          <Check size={11} /> EQUIPPED
                        </span>
                      ) : owned ? (
                        <span className="tag-owned">OWNED</span>
                      ) : (
                        <span className="tag-locked">
                          <Lock size={10} /> {formatNumber(c.price)}
                        </span>
                      )}
                    </div>
                  </RosterItem>
                );
              })}
            </RosterList>
          )}

          {/* TAB 2: TUNING STAGES CONSOLE */}
          {activeTab === 'upgrades' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {UPGRADE_DEFS.map((stg) => {
                const level = upgrades[stg.key] ?? 0;
                const maxed = level >= MAX_UPGRADE_LEVEL;
                const cost = getUpgradeCost(car, stg.key, level);

                const icon =
                  stg.key === 'engine' ? (
                    <Zap size={12} />
                  ) : stg.key === 'tyres' ? (
                    <Gauge size={12} />
                  ) : stg.key === 'brakes' ? (
                    <ShieldCheck size={12} />
                  ) : (
                    <Flame size={12} />
                  );

                return (
                  <TuningStageCard key={stg.key}>
                    <div className="head">
                      <div className="icon-title">
                        {icon}
                        <span>{stg.label}</span>
                      </div>
                      <span style={{ color: 'var(--lime)', fontFamily: 'var(--font-mono)' }}>
                        LVL {level}/{MAX_UPGRADE_LEVEL}
                      </span>
                    </div>
                    <div className="dots">
                      {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => (
                        <i key={i} className={i < level ? 'on' : ''} />
                      ))}
                    </div>
                    <p className="desc">{stg.description}</p>
                    <UpgradeActionBtn
                      type="button"
                      disabled={maxed || !isOwned || cost === null || coins < cost}
                      onClick={() => handleUpgrade(stg.key)}
                    >
                      {maxed || cost === null
                        ? 'MAXED OUT'
                        : !isOwned
                          ? 'OWN MACHINE TO TUNE'
                          : `+ STAGE ${level + 1} (${formatNumber(cost)} COINS)`}
                    </UpgradeActionBtn>
                  </TuningStageCard>
                );
              })}
            </div>
          )}

          {/* TAB 3: VISUAL CUSTOMIZATION */}
          {activeTab === 'customize' && (
            <VisualsBox>
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
                        <Check size={10} color="#000" />
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
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '1px solid var(--line-strong)',
                      background: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: 9,
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
                        <Check size={10} color="#000" />
                      )}
                    </Swatch>
                  ))}
                </SwatchRow>
              </div>
            </VisualsBox>
          )}
        </SidebarScroll>

        <SidebarFooter>
          {!isOwned ? (
            <SidebarPrimaryBtn
              type="button"
              $tone="amber"
              disabled={coins < car.price}
              onClick={handleBuy}
            >
              <Unlock size={18} /> Unlock Machine ({formatNumber(car.price)} Coins)
            </SidebarPrimaryBtn>
          ) : !isSelected ? (
            <SidebarPrimaryBtn type="button" onClick={handleEquip}>
              <Check size={18} /> Equip Machine
            </SidebarPrimaryBtn>
          ) : (
            <SidebarPrimaryBtn as={Link} href="/play">
              <Play size={18} fill="currentColor" /> Drive Now
            </SidebarPrimaryBtn>
          )}
        </SidebarFooter>
      </GameSidebarRoot>
    </Stage>
  );
}

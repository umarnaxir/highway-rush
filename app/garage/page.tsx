'use client';

import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Car,
  Check,
  Coins,
  Lock,
  Palette,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { PageShell, TwoCol } from '@/components/layout/PageShell';
import { Button, ButtonLink, IconButton } from '@/components/ui/Button';
import { Badge, Panel, PanelLabel, ProgressBar, SectionKicker, StatRow } from '@/components/ui/Panel';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PreviewCanvas } from '@/components/game/PreviewCanvas';
import {
  CARS,
  CARS_BY_ID,
  RIM_COLORS,
  UNDERGLOW_COLORS,
  carStatsTotal,
  getDefaultCustomization,
  meetsCarRequirement,
} from '@/lib/data/cars';
import { useGameStore } from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { useUiStore } from '@/lib/store/useUiStore';
import { formatNumber, titleCase } from '@/lib/ui/format';
import type { CarCustomization, DecalStyle, SpoilerStyle, WheelStyle } from '@/lib/types';
import { media } from '@/lib/ui/theme';

const stages = [
  { key: 'speed', label: 'Top speed' },
  { key: 'acceleration', label: 'Acceleration' },
  { key: 'handling', label: 'Handling' },
  { key: 'braking', label: 'Braking' },
  { key: 'nitro', label: 'Nitro' },
] as const;

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
  { value: 'none', label: 'None' },
  { value: 'lip', label: 'Lip' },
  { value: 'sport', label: 'Sport' },
  { value: 'gt', label: 'GT Wing' },
];

const wheels: Array<{ value: WheelStyle; label: string }> = [
  { value: 'sport', label: 'Sport' },
  { value: 'forged', label: 'Forged' },
  { value: 'stealth', label: 'Stealth' },
];

const decals: Array<{ value: DecalStyle; label: string }> = [
  { value: 'none', label: 'Clean' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'racing', label: 'Racing' },
  { value: 'flames', label: 'Flames' },
];

const Showcase = styled.div`
  position: relative;
  min-height: 440px;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 115%, rgba(215, 255, 63, 0.11), transparent 55%),
    radial-gradient(ellipse at 80% 10%, rgba(56, 189, 248, 0.06), transparent 45%),
    linear-gradient(160deg, #111820, #070a0d 70%);

  &::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 42%;
    background: linear-gradient(180deg, transparent, rgba(4, 6, 7, 0.78));
    pointer-events: none;
  }

  ${media.mobile} {
    min-height: 320px;
  }
`;

const ShowcaseTop = styled.div`
  position: absolute;
  top: 18px;
  left: 18px;
  right: 18px;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const ShowcaseBottom = styled.div`
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 20px;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(30px, 4vw, 52px);
    font-style: italic;
    line-height: 0.86;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }
  p {
    margin-top: 7px;
    color: var(--text-muted);
    font-size: 11px;
  }
`;

const InfoPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const StatBars = styled.div`
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 11px;
`;

const StatBar = styled.div`
  display: grid;
  grid-template-columns: 84px 1fr 30px;
  align-items: center;
  gap: 12px;

  span {
    color: var(--text-muted);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  b {
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 10px;
    text-align: right;
    font-weight: 700;
  }
`;

const TagRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 14px;
`;

const Customizer = styled(Panel)`
  margin-top: 16px;
  padding: clamp(20px, 3vw, 30px);
`;

const CustomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 36px;

  ${media.desktop} {
    gap: 0 26px;
  }
  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const Group = styled.div`
  padding: 18px 0;
  border-bottom: 1px solid var(--line);

  &:last-child {
    border-bottom: 0;
  }
`;

const GroupLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-dim);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;

  svg {
    color: var(--lime);
  }
`;

const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
`;

const Swatch = styled.button<{ $color: string; $active: boolean }>`
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${({ $active }) => ($active ? 'var(--text)' : 'rgba(255,255,255,.16)')};
  background: ${({ $color }) => $color};
  box-shadow: ${({ $active, $color }) => ($active ? `0 0 0 3px ${$color}33` : 'none')};
  transition: all 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }

  svg {
    position: absolute;
    inset: 0;
    margin: auto;
    color: ${({ $color }) => (isLight($color) ? '#0b0f13' : '#fff')};
  }
`;

function isLight(hex: string): boolean {
  const value = hex.replace('#', '');
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 165;
}

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Pill = styled.button<{ $active: boolean }>`
  min-height: 31px;
  padding: 0 12px;
  border-radius: 3px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(215,255,63,.55)' : 'var(--line)')};
  background: ${({ $active }) => ($active ? 'rgba(215,255,63,.1)' : 'rgba(255,255,255,.02)')};
  color: ${({ $active, theme }) => ($active ? theme.colors.lime : theme.colors.textMuted)};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  transition: all 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.lineStrong};
  }
`;

const Roster = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;

  ${media.desktop} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  ${media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const CarCard = styled.button<{ $active: boolean; $owned: boolean }>`
  position: relative;
  text-align: left;
  padding: 16px 15px;
  min-height: 134px;
  border-radius: 5px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.lime : 'var(--line)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(150deg, rgba(215,255,63,.09), rgba(255,255,255,.02))'
      : 'rgba(255,255,255,.018)'};
  overflow: hidden;
  transition: all 0.18s ease;

  &:hover {
    border-color: ${({ $active, theme }) => ($active ? theme.colors.lime : theme.colors.lineStrong)};
    transform: translateY(-2px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent);
    opacity: ${({ $active, $owned }) => ($active ? 1 : $owned ? 0.55 : 0.22)};
  }

  &::after {
    content: '';
    position: absolute;
    right: -20px;
    bottom: -26px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.07;
    filter: blur(10px);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--text-dim);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const CardName = styled.strong`
  display: block;
  margin-top: 12px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 18px;
  line-height: 0.95;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  position: relative;
  z-index: 1;
`;

const CardMeta = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 9px;
  font-weight: 700;

  svg {
    color: ${({ theme }) => theme.colors.textDim};
  }
`;

const RequirementBox = styled.div`
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(251, 191, 36, 0.26);
  background: rgba(251, 191, 36, 0.05);
  border-radius: 4px;
  color: var(--warning);
  font-size: 10px;
  line-height: 1.6;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 18px;
  flex-wrap: wrap;
`;

export default function GaragePage() {
  const selectedCarStore = useGameStore((state) => state.selectedCar);
  const ownedCars = useGameStore((state) => state.ownedCars);
  const customizations = useGameStore((state) => state.customizations);
  const coins = useGameStore((state) => state.coins);
  const stats = useGameStore((state) => state.stats);
  const unlockedTrophies = useGameStore((state) => state.unlockedTrophies);
  const quality = useGameStore((state) =>
    state.settings.graphics.performanceMode ? 'low' : state.settings.graphics.effects,
  );
  const invertCamera = useGameStore((state) => state.settings.controls.invertCamera);
  const selectCar = useGameStore((state) => state.selectCar);
  const purchaseCar = useGameStore((state) => state.purchaseCar);
  const updateCustomization = useGameStore((state) => state.updateCustomization);
  const recordCustomization = useGameStore((state) => state.recordCustomization);
  const pushToast = useUiStore((state) => state.pushToast);

  const [browsedId, setBrowsedId] = useState(selectedCarStore);
  const [buying, setBuying] = useState(false);

  const car = CARS_BY_ID[browsedId] ?? CARS[0];
  const customization = customizations[car.id] ?? getDefaultCustomization(car);
  const owned = ownedCars.includes(car.id);
  const trophyCount = Object.keys(unlockedTrophies).length;
  const requirement = useMemo(
    () => meetsCarRequirement(car, stats, trophyCount),
    [car, stats, trophyCount],
  );
  const selectedCustomPaint = customization.paint;

  const changeCar = (id: string) => {
    setBrowsedId(id);
    if (ownedCars.includes(id)) selectCar(id);
    getAudioManager().playCue('ui');
  };

  const apply = (patch: Partial<CarCustomization>, commit = true) => {
    updateCustomization(car.id, patch);
    if (commit) {
      recordCustomization();
      getAudioManager().playCue('ui');
    }
  };

  const handleBuy = () => {
    const result = purchaseCar(car.id);
    pushToast({
      kind: result.ok ? 'success' : 'error',
      title: result.ok ? `${car.name} acquired` : 'Purchase failed',
      message: result.message,
    });
    if (result.ok) {
      setBrowsedId(car.id);
      getAudioManager().playCue('purchase');
    }
  };

  return (
    <PageShell
      kicker="Performance workshop"
      title={
        <>
          Your <em>garage.</em>
        </>
      }
      intro="Every machine is saved locally with its own paint, footwear and aero. Browse the roster, build your spec, then take it to the highway."
      actions={
        <>
          <Badge $tone="warning">
            <Coins size={10} /> {formatNumber(coins)}
          </Badge>
          <ButtonLink href="/play" size="sm" icon={<Play size={13} fill="currentColor" />}>
            Race
          </ButtonLink>
        </>
      }
      wide
    >
      <TwoCol $ratio="minmax(0, 1.55fr) minmax(0, 0.85fr)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Showcase>
            <ShowcaseTop>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge $tone={owned ? 'lime' : 'neutral'}>{owned ? 'Owned' : 'Locked'}</Badge>
                <Badge>{titleCase(car.className)}</Badge>
                {selectedCarStore === car.id && <Badge $tone="info">Active</Badge>}
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-dim)',
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                }}
              >
                <Sparkles size={11} /> Live 3D
              </span>
            </ShowcaseTop>
            <PreviewCanvas
              car={car}
              customization={customization}
              quality={quality}
              invertCamera={invertCamera}
              ariaLabel={`${car.name} preview with current customisation`}
            />
            <ShowcaseBottom>
              <div>
                <p style={{ letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 8 }}>
                  {car.brand} · {car.tagline}
                </p>
                <h2>{car.name}</h2>
              </div>
              <span className="sr-only">{car.description}</span>
            </ShowcaseBottom>
          </Showcase>

          <Customizer>
            <div className="garage-custom-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <SectionKicker>Build sheet</SectionKicker>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 26,
                    textTransform: 'uppercase',
                    fontStyle: 'italic',
                    lineHeight: 1,
                  }}
                >
                  Make it yours
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge $tone="lime">
                  <Wrench size={10} /> {stats.customizationChanges} changes
                </Badge>
                <IconButton
                  $size={32}
                  title="Reset build"
                  aria-label="Reset build to default"
                  onClick={() => {
                    const defaults = getDefaultCustomization(car);
                    updateCustomization(car.id, defaults);
                    recordCustomization();
                    pushToast({ kind: 'info', title: 'Build reset', message: `${car.name} restored to factory spec.` });
                  }}
                >
                  <RotateCcw size={13} />
                </IconButton>
              </div>
            </div>

            <CustomGrid>
              <div>
                <Group>
                  <GroupLabel>
                    <Palette size={12} /> Paint · {selectedCustomPaint.toUpperCase()}
                  </GroupLabel>
                  <Swatches>
                    {paintSwatches.map((color) => (
                      <Swatch
                        key={color}
                        $color={color}
                        $active={selectedCustomPaint.toLowerCase() === color.toLowerCase()}
                        aria-label={`Paint ${color}`}
                        onClick={() => apply({ paint: color })}
                      >
                        {selectedCustomPaint.toLowerCase() === color.toLowerCase() && <Check size={13} />}
                      </Swatch>
                    ))}
                    <input
                      type="color"
                      value={selectedCustomPaint}
                      aria-label="Custom paint colour"
                      onChange={(event) => apply({ paint: event.target.value }, false)}
                      onBlur={() => {
                        recordCustomization();
                        getAudioManager().playCue('ui');
                      }}
                      title="Custom paint"
                    />
                  </Swatches>
                </Group>

                <Group>
                  <GroupLabel>
                    <Wrench size={12} /> Rims
                  </GroupLabel>
                  <Swatches>
                    {RIM_COLORS.map((color) => (
                      <Swatch
                        key={color}
                        $color={color}
                        $active={customization.rim.toLowerCase() === color.toLowerCase()}
                        aria-label={`Rim colour ${color}`}
                        onClick={() => apply({ rim: color })}
                      >
                        {customization.rim.toLowerCase() === color.toLowerCase() && <Check size={13} />}
                      </Swatch>
                    ))}
                  </Swatches>
                </Group>

                <Group>
                  <GroupLabel>
                    <Sparkles size={12} /> Underglow
                  </GroupLabel>
                  <Swatches>
                    <button
                      type="button"
                      aria-label="No underglow"
                      onClick={() => apply({ underglow: null })}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        border: `2px solid ${customization.underglow === null ? 'var(--text)' : 'var(--line-strong)'}`,
                        background: 'rgba(255,255,255,.03)',
                        color: 'var(--text-dim)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Check size={11} style={{ opacity: customization.underglow === null ? 1 : 0.3 }} />
                    </button>
                    {UNDERGLOW_COLORS.map((color) => (
                      <Swatch
                        key={color}
                        $color={color}
                        $active={customization.underglow === color}
                        aria-label={`Underglow ${color}`}
                        onClick={() => apply({ underglow: color })}
                      >
                        {customization.underglow === color && <Check size={13} />}
                      </Swatch>
                    ))}
                  </Swatches>
                </Group>
              </div>

              <div>
                <Group>
                  <GroupLabel>
                    <ShieldCheck size={12} /> Spoiler
                  </GroupLabel>
                  <PillRow>
                    {spoilers.map((option) => (
                      <Pill
                        key={option.value}
                        $active={customization.spoiler === option.value}
                        onClick={() => apply({ spoiler: option.value })}
                      >
                        {option.label}
                      </Pill>
                    ))}
                  </PillRow>
                </Group>

                <Group>
                  <GroupLabel>
                    <Car size={12} /> Wheels
                  </GroupLabel>
                  <PillRow>
                    {wheels.map((option) => (
                      <Pill
                        key={option.value}
                        $active={customization.wheels === option.value}
                        onClick={() => apply({ wheels: option.value })}
                      >
                        {option.label}
                      </Pill>
                    ))}
                  </PillRow>
                </Group>

                <Group>
                  <GroupLabel>
                    <Sparkles size={12} /> Decals
                  </GroupLabel>
                  <PillRow>
                    {decals.map((option) => (
                      <Pill
                        key={option.value}
                        $active={customization.decal === option.value}
                        onClick={() => apply({ decal: option.value })}
                      >
                        {option.label}
                      </Pill>
                    ))}
                  </PillRow>
                </Group>
              </div>
            </CustomGrid>
          </Customizer>
        </div>

        <InfoPanel>
          <PanelLabel>Spec sheet</PanelLabel>
          <h3
            style={{
              marginTop: 10,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px,3vw,38px)',
              lineHeight: 0.92,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {car.name}
          </h3>
          <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7 }}>
            {car.description}
          </p>
          <TagRow>
            <Badge $tone="lime">OVR {carStatsTotal(car)}</Badge>
            <Badge>{car.brand}</Badge>
            <Badge>{titleCase(car.className)}</Badge>
          </TagRow>

          <StatBars>
            {stages.map((stage) => (
              <StatBar key={stage.key}>
                <span>{stage.label}</span>
                <ProgressBar value={car.stats[stage.key]} color={car.accent} height={4} />
                <b>{car.stats[stage.key]}</b>
              </StatBar>
            ))}
          </StatBars>

          {!owned && (
            <>
              <RequirementBox>
                <strong style={{ display: 'block', marginBottom: 4 }}>
                  {requirement.met ? 'Requirements met' : 'Locked requirements'}
                </strong>
                {requirement.met
                  ? 'You qualify to purchase this machine.'
                  : requirement.missing.join(' · ')}
              </RequirementBox>
              <ActionRow>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={coins < car.price || !requirement.met}
                  onClick={() => setBuying(true)}
                  icon={<Coins size={14} />}
                >
                  Buy for {formatNumber(car.price)}
                </Button>
              </ActionRow>
            </>
          )}

          {owned && (
            <ActionRow>
              {selectedCarStore === car.id ? (
                <Button variant="secondary" fullWidth disabled icon={<Check size={14} />}>
                  Active car
                </Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    selectCar(car.id);
                    getAudioManager().playCue('confirm');
                    pushToast({ kind: 'success', title: `${car.name} selected`, message: 'Ready for the next run.' });
                  }}
                  icon={<Car size={14} />}
                >
                  Select this car
                </Button>
              )}
              <ButtonLink href="/play" variant="secondary" fullWidth icon={<Play size={13} />}>
                Race it
              </ButtonLink>
            </ActionRow>
          )}

          <div style={{ marginTop: 20 }}>
            <StatRow>
              <span>Price</span>
              <strong>{car.price === 0 ? 'Starter' : formatNumber(car.price)}</strong>
            </StatRow>
            <StatRow>
              <span>Status</span>
              <strong>{owned ? 'In garage' : 'Locked'}</strong>
            </StatRow>
            <StatRow>
              <span>Upgrade count</span>
              <strong>{owned ? 'Visual only' : '—'}</strong>
            </StatRow>
          </div>
        </InfoPanel>
      </TwoCol>

      <div style={{ marginTop: 38 }}>
        <SectionKicker>The roster</SectionKicker>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            textTransform: 'uppercase',
            fontStyle: 'italic',
          }}
        >
          All machines
        </h2>
        <Roster>
          {CARS.map((item) => {
            const isOwned = ownedCars.includes(item.id);
            return (
              <CarCard
                key={item.id}
                $active={item.id === car.id}
                $owned={isOwned}
                style={{ ['--accent' as string]: item.accent }}
                onClick={() => changeCar(item.id)}
                aria-pressed={item.id === car.id}
              >
                <CardTop>
                  <span>{item.brand}</span>
                  {isOwned ? <Check size={12} style={{ color: 'var(--lime)' }} /> : <Lock size={11} />}
                </CardTop>
                <CardName>{item.name}</CardName>
                <CardMeta>
                  <span>OVR {carStatsTotal(item)}</span>
                  <span>{isOwned ? 'Owned' : `${formatNumber(item.price)} c`}</span>
                </CardMeta>
              </CarCard>
            );
          })}
        </Roster>
      </div>

      <ConfirmDialog
        open={buying}
        onClose={() => setBuying(false)}
        title={`Acquire ${car.name}?`}
        message={`This will deduct ${formatNumber(car.price)} coins from your wallet and add the ${car.name} to your garage. Your balance is ${formatNumber(coins)} coins.`}
        confirmLabel={`Buy · ${formatNumber(car.price)}`}
        onConfirm={handleBuy}
      />
    </PageShell>
  );
}

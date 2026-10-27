'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import {
  ArrowRight,
  ChevronRight,
  Coins,
  Flag,
  Gauge,
  Lock,
  Play,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, Panel, PanelLabel, ProgressBar, SectionKicker, SectionTitle } from '@/components/ui/Panel';
import { DestinationVisual, EnvironmentIcon } from '@/components/ui/DestinationVisual';
import { PreviewCanvas } from '@/components/game/PreviewCanvas';
import { PageMotion } from '@/components/motion/PageMotion';
import { getDefaultCustomization, CARS_BY_ID } from '@/lib/data/cars';
import { DESTINATIONS } from '@/lib/data/destinations';
import { TROPHIES } from '@/lib/data/trophies';
import { useGameStore } from '@/lib/store/useGameStore';
import { formatCompact, formatDistance, formatNumber } from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

const Wrap = styled.div`
  width: var(--page-width);
  margin: 0 auto;
  padding: 0 var(--page-pad);
`;

const Hero = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
  gap: clamp(24px, 4vw, 58px);
  align-items: center;
  width: var(--page-width);
  margin: 0 auto;
  padding: clamp(18px, 3.5vw, 40px) var(--page-pad) clamp(12px, 2vw, 20px);
  animation: pageIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;

  ${media.desktop} {
    grid-template-columns: 1fr;
    padding-top: 16px;
    padding-bottom: 12px;
    min-height: 90vh;
    align-content: center;
  }

  ${media.tablet} {
    gap: 20px;
    padding: 24px var(--page-pad) 16px;
  }

  .hero-desktop-ctas {
    margin-top: 6px;
  }

  ${media.mobile} {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px var(--page-pad) 8px;
    min-height: auto;
    align-content: start;

    .hero-mobile-ctas {
      display: block;
    }

    .hero-desktop-ctas {
      display: none !important;
    }
  }
`;

const HeroCopy = styled.div`
  position: relative;
  z-index: 2;
  min-width: 0;

  ${media.mobile} {
    display: none;
  }
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.lime};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 18px;
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(52px, 7.6vw, 118px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: -0.045em;
  text-transform: uppercase;
  margin-left: -0.04em;

  em {
    display: block;
    font-style: inherit;
    color: ${({ theme }) => theme.colors.lime};
  }

  ${media.mobile} {
    margin-left: 0;
    font-size: clamp(54px, 16.5vw, 80px);
    line-height: 0.8;
    letter-spacing: -0.05em;
  }
`;

const Sub = styled.p`
  margin-top: 22px;
  max-width: 520px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: clamp(13px, 1.2vw, 15px);
  line-height: 1.8;

  ${media.mobile} {
    display: none !important;
  }
`;

const CTAs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;

  ${media.tablet} {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    max-width: 520px;
    gap: 8px;
    margin-top: 24px;

    > a {
      min-height: 48px;
      padding: 0 12px;
      font-size: 11px;
      gap: 7px;
    }

    > a svg {
      width: 14px;
      height: 14px;
    }
  }

  ${media.mobile} {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 12px;

    > a {
      min-height: 44px;
      padding: 0 10px;
      font-size: 10px;
      letter-spacing: 0.05em;
      gap: 6px;
    }

    > a svg {
      width: 14px;
      height: 14px;
    }
  }

  @media (max-width: 359px) {
    grid-template-columns: 1fr;

    > a {
      min-height: 48px;
    }
  }
`;

const QuickFacts = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
  margin-top: 30px;

  div {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.lime};
  }

  ${media.tablet} {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    max-width: 520px;
    margin-top: 24px;

    div {
      justify-content: center;
      min-width: 0;
      gap: 5px;
      font-size: 8.5px;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    div:nth-child(4) {
      display: none;
    }

    svg {
      width: 12px;
      height: 12px;
    }
  }

  ${media.mobile} {
    display: none;
  }
`;

const HeroVisual = styled.div`
  position: relative;
  min-height: 430px;

  ${media.tablet} {
    min-height: 360px;
  }

  ${media.mobile} {
    min-height: 240px;
    width: 100%;
    margin-top: 6px;
    margin-bottom: 6px;
  }
`;

const Glow = styled.div`
  position: absolute;
  inset: 6% 0 2%;
  background: radial-gradient(
    ellipse at 60% 46%,
    rgba(215, 255, 63, 0.13),
    rgba(56, 189, 248, 0.05) 40%,
    transparent 68%
  );
  filter: blur(14px);
  pointer-events: none;
`;

const Stage = styled.div`
  position: relative;
  height: 100%;
  min-height: 430px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 120%, rgba(215, 255, 63, 0.08), transparent 58%),
    linear-gradient(160deg, #111820, #080b0e 68%);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.45);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 55%, rgba(4, 6, 7, 0.72));
    pointer-events: none;
  }

  ${media.tablet} {
    min-height: 360px;
  }

  ${media.mobile} {
    min-height: 330px;
  }
`;

const StageCorner = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 3;
  display: flex;
  gap: 6px;
`;

const StageBottom = styled.div`
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 18px;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;

  ${media.mobile} {
    left: 10px;
    right: 10px;
    bottom: 10px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;

    .hero-mobile-text {
      display: flex !important;
    }
  }
`;

const CarName = styled.div`
  span {
    display: block;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(26px, 3vw, 40px);
    font-weight: 800;
    font-style: italic;
    line-height: 0.9;
    letter-spacing: -0.01em;
    text-transform: uppercase;
  }

  ${media.mobile} {
    span {
      font-size: 7px;
      letter-spacing: 0.2em;
      margin-bottom: 2px;
    }
    strong {
      font-size: clamp(22px, 9vw, 28px);
      white-space: nowrap;
    }
  }
`;

const RotateHint = styled.span`
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
  white-space: nowrap;
  padding-bottom: 4px;
`;

const Ticker = styled.div`
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.015);
  overflow: hidden;
  margin-top: clamp(22px, 4vw, 44px);

  div {
    display: flex;
    width: max-content;
    animation: ticker 38s linear infinite;
    padding: 13px 0;
  }

  span {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0 28px;
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  svg {
    color: ${({ theme }) => theme.colors.lime};
    width: 12px;
    height: 12px;
  }
`;

const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: clamp(28px, 5vw, 56px);
  background: ${({ theme }) => theme.colors.line};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 6px;
  overflow: hidden;

  ${media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Metric = styled.div`
  background: ${({ theme }) => theme.colors.panel};
  padding: 18px 20px;
  span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 9px;
  }
  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
  }
  em {
    display: block;
    margin-top: 5px;
    color: var(--text-dim);
    font-size: 9px;
    font-style: normal;
  }
`;

const Section = styled.section`
  margin-top: clamp(18px, 3vw, 38px);

  ${media.mobile} {
    margin-top: clamp(14px, 6vw, 26px);
  }
`;

const SectionHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
  flex-wrap: wrap;

  ${media.mobile} {
    align-items: flex-start;
    text-align: left;
    gap: 12px;
    margin-bottom: 16px;

    > * {
      width: 100%;
    }
  }
`;

const SectionCopy = styled.div`
  max-width: 640px;
  p {
    margin-top: 14px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    line-height: 1.75;
  }

  ${media.mobile} {
    max-width: 100%;
    p {
      display: none;
    }
  }
`;

const RouteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.tablet} {
    display: flex;
    gap: 12px;
    margin-inline: calc(-1 * var(--page-pad));
    padding: 2px var(--page-pad) 6px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--page-pad);
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }

    > a {
      flex: 0 0 min(84vw, 360px);
      scroll-snap-align: start;
      min-height: 170px;
    }
  }

  ${media.mobile} {
    > a {
      flex: 0 0 90vw;
      min-height: 200px;
    }
  }
`;

const CarouselDots = styled.div`
  display: none;

  ${media.tablet} {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 10px;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 1 14px;
      height: 16px;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    button span {
      display: block;
      width: 100%;
      height: 3px;
      border-radius: 2px;
      background: rgba(245, 246, 247, 0.18);
      transition:
        background 0.2s ease,
        height 0.2s ease,
        box-shadow 0.2s ease;
    }

    button[aria-current='true'] span {
      height: 4px;
      background: var(--lime);
      box-shadow: 0 0 10px rgba(215, 255, 63, 0.25);
    }

    button:focus-visible {
      outline: 2px solid var(--lime);
      outline-offset: -4px;
      border-radius: 999px;
    }
  }
`;

const RouteCard = styled(Link)`
  position: relative;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  background: var(--panel);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--line-strong);
  }

  &:active {
    transform: scale(0.99);
  }

  ${media.tablet} {
    > div:first-child {
      height: 150px;
      min-height: 150px;
    }
  }

  ${media.mobile} {
    > div:first-child {
      height: 170px;
      min-height: 170px;
    }
    > div:first-child {
      height: 112px;
      min-height: 112px;
    }
  }
`;

const RouteInfo = styled.div`
  padding: 14px 15px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 18px;
    font-weight: 800;
    line-height: 1.05;
    text-transform: uppercase;
    letter-spacing: 0.01em;
  }
  small {
    display: block;
    margin-top: 3px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  ${media.mobile} {
    padding: 12px 13px 13px;
    gap: 10px;

    strong {
      font-size: 16px;
    }

    small {
      margin-top: 4px;
      font-size: 7.5px;
      letter-spacing: 0.14em;
    }
  }
`;

const RouteTag = styled.span<{ $locked?: boolean }>`
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid ${({ $locked }) => ($locked ? 'rgba(255,255,255,.12)' : 'rgba(215,255,63,.35)')};
  color: ${({ $locked, theme }) => ($locked ? theme.colors.textDim : theme.colors.lime)};
  background: ${({ $locked }) => ($locked ? 'rgba(255,255,255,.02)' : 'rgba(215,255,63,.06)')};
`;

const Split = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: clamp(12px, 2.5vw, 22px);

  ${media.desktop} {
    grid-template-columns: 1fr;
  }

  ${media.mobile} {
    gap: clamp(10px, 4vw, 16px);
  }
`;

const FeaturePanel = styled(Panel)`
  min-height: 100%;
  padding: clamp(24px, 3.4vw, 38px);
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin-top: 26px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;

  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const Feature = styled.div`
  background: rgba(255, 255, 255, 0.018);
  padding: 18px;
  svg {
    color: var(--lime);
    margin-bottom: 12px;
  }
  strong {
    display: block;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  p {
    margin-top: 6px;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.6;
  }
`;

const ProgressPanel = styled(Panel)`
  padding: clamp(22px, 3vw, 30px);
`;

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 16px 0 7px;
  span {
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  strong {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text);
  }
`;

const LinkRow = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 0;
  border-bottom: 1px solid var(--line);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: color 0.15s ease;
  &:last-child {
    border-bottom: 0;
    padding-bottom: 4px;
  }
  &:hover {
    color: var(--text);
  }
  svg {
    color: var(--text-dim);
  }
`;

const MiniCarList = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 22px;

  ${media.mobile} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MiniCar = styled(Link)`
  position: relative;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.16s ease;

  span {
    display: block;
    font-size: 8px;
    color: var(--text-dim);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  strong {
    display: block;
    margin-top: 4px;
    font-family: var(--font-display);
    font-size: 14px;
    text-transform: uppercase;
    line-height: 1;
  }
  &::before {
    content: '';
    position: absolute;
    top: 10px;
    right: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dot);
    box-shadow: 0 0 10px var(--dot);
  }
  &:hover {
    border-color: var(--line-strong);
    background: rgba(255, 255, 255, 0.04);
  }
`;

export default function HomePage() {
  const selectedCarId = useGameStore((state) => state.selectedCar);
  const customizations = useGameStore((state) => state.customizations);
  const selectedDestinationId = useGameStore((state) => state.selectedDestination);
  const unlockDestinations = useGameStore((state) => state.unlockedDestinations);
  const stats = useGameStore((state) => state.stats);
  const unlocked = useGameStore((state) => state.unlockedTrophies);
  const ownedCars = useGameStore((state) => state.ownedCars);
  const coins = useGameStore((state) => state.coins);
  const tutorialSeen = useGameStore((state) => state.tutorialSeen);
  const routeTrackRef = useRef<HTMLDivElement>(null);
  const [activeRoute, setActiveRoute] = useState(0);

  const handleRouteScroll = () => {
    const track = routeTrackRef.current;
    if (!track) return;

    const cards = Array.from(track.children) as HTMLElement[];
    if (!cards.length) return;

    if (track.scrollWidth <= track.clientWidth) {
      setActiveRoute((current) => (current === 0 ? current : 0));
      return;
    }

    if (track.scrollWidth - track.clientWidth - track.scrollLeft <= 2) {
      const last = cards.length - 1;
      setActiveRoute((current) => (current === last ? current : last));
      return;
    }

    if (track.scrollLeft <= 2) {
      setActiveRoute((current) => (current === 0 ? current : 0));
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const padding = Number.parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
    const snapEdge = trackRect.left + padding;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const nextDistance = Math.abs(cardRect.left - snapEdge);
      if (nextDistance < distance) {
        nearest = index;
        distance = nextDistance;
      }
    });

    setActiveRoute((current) => (current === nearest ? current : nearest));
  };

  const goToRoute = (index: number) => {
    const track = routeTrackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;

    const padding = Number.parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
    const nextLeft =
      track.scrollLeft +
      card.getBoundingClientRect().left -
      track.getBoundingClientRect().left -
      padding;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    track.scrollTo({ left: Math.max(0, nextLeft), behavior: reduced ? 'auto' : 'smooth' });
    setActiveRoute(index);
  };

  const car = CARS_BY_ID[selectedCarId] ?? Object.values(CARS_BY_ID)[0];
  const customization = customizations[car.id] ?? getDefaultCustomization(car);
  const destination = DESTINATIONS.find((item) => item.id === selectedDestinationId) ?? DESTINATIONS[0];
  const trophyCount = Object.keys(unlocked).length;
  const dailyClaims = TROPHIES.filter((trophy) => unlocked[trophy.id]).length;
  const played = stats.runs > 0;
  const carCount = Object.keys(CARS_BY_ID).length;

  return (
    <>
      <NavBar />
      <PageMotion>
      <Hero>
        <HeroCopy>
          <Eyebrow>Endless Drive · Arcade Racing</Eyebrow>
          <Title>
            Own the
            <em>Highway.</em>
          </Title>
          <Sub>
            Thread impossible traffic at 300 km/h. Chain near misses, fire the nitro, and chase a
            personal best across eight hand-built destinations. No downloads. No shortcuts. Just the
            next kilometre.
          </Sub>
          <QuickFacts>
            <div>
              <Flag size={13} /> {DESTINATIONS.length} destinations
            </div>
            <div>
              <Trophy size={13} /> {TROPHIES.length} trophies
            </div>
            <div>
              <Zap size={13} /> Nitro &amp; drift
            </div>
            <div>
              <Lock size={13} /> Local save
            </div>
          </QuickFacts>
        </HeroCopy>
        <HeroVisual>
          <Glow />
          <Stage>
            <StageCorner>
              <Badge $tone="lime">
                <Sparkles size={10} /> Selected
              </Badge>
            </StageCorner>
            <PreviewCanvas
              car={car}
              customization={customization}
              quality="high"
              ariaLabel={`${car.name} interactive preview`}
            />
            <StageBottom>
              <div className="hero-mobile-text" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%', padding: '8px 0' }}>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 12vw, 38px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.84, letterSpacing: '-0.03em', textAlign: 'center', whiteSpace: 'nowrap' }}>OWN THE <em style={{ color: 'var(--lime)', fontStyle: 'inherit' }}>HIGHWAY</em></strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', gap: 10, marginTop: 6 }}>
                <div />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <span style={{ fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>{car.brand} · {car.className}</span>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 7vw, 24px)', fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.9 }}>{car.name}</strong>
                  </div>
                  <RotateHint>Drag to rotate →</RotateHint>
                </div>
              </div>
            </StageBottom>
          </Stage>
        </HeroVisual>
        <div className="hero-desktop-ctas" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <CTAs>
            <ButtonLink href="/play" size="xl" icon={<Play size={16} fill="currentColor" />} prefetch>
              Race Now
            </ButtonLink>
            <ButtonLink href="/garage" size="xl" variant="secondary" icon={<Gauge size={16} />}>
              Enter Garage
            </ButtonLink>
          </CTAs>
        </div>
      </Hero>

      <Ticker aria-hidden="true">
        <div>
          {[...DESTINATIONS, ...DESTINATIONS].map((item, index) => (
            <span key={`${item.id}-${index}`}>
              <EnvironmentIcon environment={item.environment} /> {item.name}
              {item.region}
            </span>
          ))}
        </div>
      </Ticker>

      <Wrap>
        <Metrics>
          <Metric>
            <span>Best score</span>
            <strong>{formatCompact(stats.bestScore)}</strong>
            <em>{played ? 'Personal record' : 'Awaiting first run'}</em>
          </Metric>
          <Metric>
            <span>Total distance</span>
            <strong>{formatDistance(stats.totalDistanceM, 0)}</strong>
            <em>{stats.runs} recorded runs</em>
          </Metric>
          <Metric>
            <span>Trophy room</span>
            <strong>
              {trophyCount}
              <span style={{ fontSize: 15, color: 'var(--text-dim)' }}>/{TROPHIES.length}</span>
            </strong>
            <em>{trophyCount} of {TROPHIES.length} unlocked</em>
          </Metric>
          <Metric>
            <span>Garage</span>
            <strong>
              {ownedCars.length}
              <span style={{ fontSize: 15, color: 'var(--text-dim)' }}>/{carCount}</span>
            </strong>
            <em>{formatNumber(coins)} coins available</em>
          </Metric>
        </Metrics>

        <Section>
          <SectionHead>
            <SectionCopy>
              <SectionKicker>The route map</SectionKicker>
              <SectionTitle>
                Eight ways to <em>disappear.</em>
              </SectionTitle>
              <p>
                Every destination is a complete environment build: custom sky, weather, lighting,
                roadside scenery and its own procedural soundtrack. Unlock them with coins and
                performance.
              </p>
            </SectionCopy>
            <ButtonLink href="/destinations" variant="secondary" size="md" iconRight={<ArrowRight size={14} />}>
              View all routes
            </ButtonLink>
          </SectionHead>
          <RouteGrid ref={routeTrackRef} onScroll={handleRouteScroll}>
            {DESTINATIONS.map((item) => {
              const isUnlocked = unlockDestinations.includes(item.id);
              return (
                <RouteCard key={item.id} href="/destinations">
                  <DestinationVisual destination={item} height={138} />
                  <RouteInfo>
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.region} · {formatDistance(item.distanceTarget, 1)}
                      </small>
                    </div>
                    <RouteTag $locked={!isUnlocked}>
                      {isUnlocked ? <ChevronRight size={14} /> : <Lock size={12} />}
                    </RouteTag>
                  </RouteInfo>
                </RouteCard>
              );
            })}
          </RouteGrid>
          <CarouselDots aria-label="Choose a destination">
            {DESTINATIONS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show ${item.name}`}
                aria-current={activeRoute === index ? 'true' : undefined}
                onClick={() => goToRoute(index)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </CarouselDots>
        </Section>

        <Section>
          <Split>
            <FeaturePanel $glow>
              <SectionKicker>Machine and method</SectionKicker>
              <SectionTitle style={{ fontSize: 'clamp(32px,3.6vw,48px)' }}>
                Built, not <em>borrowed.</em>
              </SectionTitle>
              <p style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.75, maxWidth: 520 }}>
                Eight unique machines with their own handling, acceleration and nitro character.
                Paint, rims, wheels, spoilers, decals and underglow are saved per car in your local
                garage.
              </p>
              <FeatureList>
                <Feature>
                  <Trophy size={18} />
                  <strong>Every trophy counts</strong>
                  <p>Bronze through platinum objectives track distance, speed, drift, crashes and more.</p>
                </Feature>
                <Feature>
                  <Zap size={18} />
                  <strong>Full send audio</strong>
                  <p>Engine note, gear shifts, tyre slip, nitro and ambience are synthesised live.</p>
                </Feature>
                <Feature>
                  <Gauge size={18} />
                  <strong>Race your ghost</strong>
                  <p>Every run is logged. Compare scores, top speed and distance on your local board.</p>
                </Feature>
              </FeatureList>
              <MiniCarList>
                {Object.values(CARS_BY_ID)
                  .slice(0, 4)
                  .map((item) => (
                    <MiniCar
                      key={item.id}
                      href="/garage"
                      style={{ ['--dot' as string]: item.accent }}
                    >
                      <span>{item.brand}</span>
                      <strong>{item.name}</strong>
                    </MiniCar>
                  ))}
              </MiniCarList>
            </FeaturePanel>

            <ProgressPanel>
              <PanelLabel>Next up</PanelLabel>
              <h3
                style={{
                  marginTop: 12,
                  fontFamily: 'var(--font-display)',
                  fontSize: 30,
                  lineHeight: 0.95,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                }}
              >
                Your next run
              </h3>
              <div style={{ marginTop: 18 }}>
                <ProgressRow>
                  <span>{destination.name}</span>
                  <strong>{formatDistance(destination.distanceTarget, 1)}</strong>
                </ProgressRow>
                <ProgressBar
                  value={Math.min(stats.bestScore, 100)}
                  max={100}
                  height={4}
                  color={destination.theme.accent}
                />
                <p style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 10 }}>
                  {unlockDestinations.includes(destination.id)
                    ? 'Route unlocked and ready.'
                    : 'Unlock this route in Destinations.'}
                </p>
              </div>
              <LinkRow href="/play" style={{ marginTop: 18 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Play size={14} /> Start a race
                </span>
                <ChevronRight size={14} />
              </LinkRow>
              <LinkRow href="/missions">
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Target size={14} /> Daily missions
                </span>
                <ChevronRight size={14} />
              </LinkRow>
              <LinkRow href="/trophies">
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Trophy size={14} /> Trophy room
                </span>
                <ChevronRight size={14} />
              </LinkRow>
              <LinkRow href="/statistics">
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Coins size={14} /> Career statistics
                </span>
                <ChevronRight size={14} />
              </LinkRow>
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 18,
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: 8, letterSpacing: '.18em', textTransform: 'uppercase' }}>
                    Current wheels
                  </span>
                  <strong style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 4, textTransform: 'uppercase' }}>
                    {car.name}
                  </strong>
                </div>
                <Button size="sm" variant="dark" onClick={() => undefined} aria-hidden style={{ pointerEvents: 'none' }}>
                  {tutorialSeen ? 'Ready' : 'New driver'}
                </Button>
              </div>
            </ProgressPanel>
          </Split>
        </Section>
      </Wrap>
      <div style={{ marginTop: 28 }} />
      <Footer />
      </PageMotion>
    </>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled, { css } from 'styled-components';
import { motion } from 'motion/react';
import {
  BarChart3,
  Car,
  Coins,
  Flag,
  ListChecks,
  Map,
  Menu,
  Settings,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { MobileBottomNav } from './MobileBottomNav';
import { useGameStore } from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { formatNumber } from '@/lib/ui/format';

const navItems = [
  { href: '/play', label: 'Play', icon: Flag },
  { href: '/garage', label: 'Garage', icon: Car },
  { href: '/destinations', label: 'Destinations', icon: Map },
  { href: '/missions', label: 'Missions', icon: ListChecks },
  { href: '/trophies', label: 'Trophies', icon: Trophy },
  { href: '/statistics', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const extraItems = [
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/how-to-play', label: 'How to Play' },
  { href: '/credits', label: 'Credits' },
];

const NAV_SPRING = { type: 'spring' as const, stiffness: 420, damping: 38, mass: 0.7 };

const OUTER_CLIP =
  'polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 18px)';
const INNER_CLIP =
  'polygon(17px 1px, calc(100% - 17px) 1px, calc(100% - 1px) 17px, calc(100% - 1px) calc(100% - 13px), calc(100% - 13px) calc(100% - 1px), 13px calc(100% - 1px), 1px calc(100% - 13px), 1px 17px)';

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 500;
  height: var(--nav-total-height);
  padding: var(--nav-gap-y) 0;
  isolation: isolate;
  pointer-events: none;
`;

const Shell = styled.div`
  position: absolute;
  top: var(--nav-gap-y);
  bottom: var(--nav-gap-y);
  left: 50%;
  z-index: 0;
  width: min(calc(100% - var(--nav-gap-x) - var(--nav-gap-x)), var(--page-max));
  transform: translateX(-50%);
  clip-path: ${OUTER_CLIP};
  background: linear-gradient(
    180deg,
    rgba(215, 255, 63, 0.34) 0%,
    rgba(245, 246, 247, 0.2) 16%,
    rgba(245, 246, 247, 0.05) 52%,
    rgba(215, 255, 63, 0.22) 100%
  );
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4));

  &::before {
    content: '';
    position: absolute;
    inset: 1px;
    clip-path: ${INNER_CLIP};
    background-color: rgba(8, 10, 13, 0.94);
    background-image:
      linear-gradient(108deg, transparent 0 44%, rgba(215, 255, 63, 0.045) 44% 44.45%, transparent 44.45%),
      repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.019) 0 1px, transparent 1px 5px),
      repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.013) 0 1px, transparent 1px 5px),
      radial-gradient(ellipse at 50% 140%, rgba(215, 255, 63, 0.09), transparent 58%),
      linear-gradient(180deg, rgba(21, 25, 31, 0.92), rgba(7, 9, 11, 0.97));
    backdrop-filter: blur(14px) saturate(1.14);
    -webkit-backdrop-filter: blur(14px) saturate(1.14);
  }
`;

const Inner = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(178px, 1fr) auto minmax(130px, 1fr);
  align-items: center;
  gap: clamp(10px, 1.5vw, 26px);
  width: min(calc(100% - var(--nav-gap-x) - var(--nav-gap-x)), var(--page-max));
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--page-pad);
  pointer-events: auto;

  @media (max-width: 1023px) {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
`;

const BrandBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 0 0 auto;

  /* The compact nav lockup still needs a little breathing room on narrow phones. */
  @media (max-width: 430px) {
    width: 154px;

    > a {
      transform: scale(0.88);
      transform-origin: left center;
    }
  }

  @media (max-width: 380px) {
    width: 140px;

    > a {
      transform: scale(0.82);
    }
  }
`;

const RacingStripes = styled.span`
  display: block;
  flex: 0 0 auto;
  width: 18px;
  height: 36px;
  background: repeating-linear-gradient(
    90deg,
    rgba(215, 255, 63, 0.52) 0 1px,
    transparent 1px 5px
  );
  opacity: 0.7;
  transform: skewX(-24deg);
  mask-image: linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent);

  @media (max-width: 1180px) {
    display: none;
  }
`;

const DesktopLinks = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;

  @media (max-width: 1023px) {
    display: none;
  }
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 40px;
  padding: 0 clamp(6px, 0.65vw, 10px);
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'rgba(245, 246, 247, 0.58)')};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(8.5px, 0.66vw, 9.5px);
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  transition:
    color 0.18s ease,
    text-shadow 0.18s ease;
  -webkit-tap-highlight-color: transparent;

  > svg,
  .nav-label {
    position: relative;
    z-index: 2;
  }

  svg {
    width: 12.5px;
    height: 12.5px;
    flex: 0 0 auto;
    stroke-width: 2.15;
    transition:
      transform 0.2s ease,
      filter 0.2s ease;
  }

  .nav-active-wash {
    position: absolute;
    inset: 4px 2px 3px;
    z-index: 0;
    clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
    border: 1px solid rgba(215, 255, 63, 0.11);
    background: linear-gradient(180deg, rgba(215, 255, 63, 0.11), rgba(215, 255, 63, 0.025));
    pointer-events: none;
  }

  .nav-active-rail {
    position: absolute;
    right: 14px;
    bottom: 2px;
    left: 14px;
    z-index: 3;
    height: 2px;
    border-radius: 999px;
    background: var(--lime);
    box-shadow: 0 0 11px rgba(215, 255, 63, 0.55);
    pointer-events: none;
  }

  @media (hover: hover) {
    &:hover {
      color: var(--text);
      text-shadow: 0 0 18px rgba(245, 246, 247, 0.2);

      svg {
        filter: drop-shadow(0 0 6px rgba(215, 255, 63, 0.45));
        transform: translateY(-1px);
      }
    }

    &:hover:not([aria-current='page']) .nav-label {
      color: var(--text);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--lime);
    outline-offset: -4px;
  }

  @media (max-width: 1180px) {
    gap: 4px;
    padding: 0 5px;
    font-size: 8.5px;

    svg {
      width: 11.5px;
      height: 11.5px;
    }
  }
`;

const Right = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;

  @media (max-width: 380px) {
    gap: 6px;
  }
`;

const ControlsDivider = styled.span`
  width: 1px;
  height: 24px;
  margin: 0 1px;
  background: linear-gradient(180deg, transparent, rgba(245, 246, 247, 0.2), transparent);

  @media (max-width: 1023px) {
    display: none;
  }
`;

const Wallet = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  border: 1px solid rgba(251, 191, 36, 0.26);
  background:
    linear-gradient(180deg, rgba(251, 191, 36, 0.11), rgba(251, 191, 36, 0.025)),
    linear-gradient(145deg, rgba(31, 27, 16, 0.94), rgba(14, 13, 10, 0.96));
  color: #f4cf62;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.035em;
  white-space: nowrap;
  box-shadow: inset 0 1px 0 rgba(255, 236, 178, 0.1);

  svg {
    width: 12px;
    height: 12px;
    color: #f4cf62;
    filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.28));
  }

  /* At 320px the logo, wallet and controls cannot share one row cleanly. */
  @media (max-width: 359px) {
    display: none;
  }
`;

const SoundButton = styled.button`
  display: inline-grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 25%, rgba(245, 246, 247, 0.08), transparent 55%),
    rgba(9, 12, 15, 0.88);
  color: var(--text-muted);
  box-shadow: inset 0 1px 0 rgba(245, 246, 247, 0.06);
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  svg {
    width: 14px;
    height: 14px;
    transition: transform 0.2s ease;
  }

  &:hover {
    border-color: rgba(215, 255, 63, 0.45);
    background: rgba(215, 255, 63, 0.07);
    color: var(--lime);
    box-shadow: 0 0 18px rgba(215, 255, 63, 0.12);
  }

  &:hover svg {
    transform: scale(1.08);
  }

  &:focus-visible {
    outline: 2px solid var(--lime);
    outline-offset: 2px;
  }
`;

const MobileToggle = styled.button`
  display: none;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.025);
  color: var(--text);
  transition:
    color 0.18s ease,
    border-color 0.18s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    border-color: rgba(215, 255, 63, 0.4);
    color: var(--lime);
  }

  &:focus-visible {
    outline: 2px solid var(--lime);
    outline-offset: 2px;
  }

  @media (max-width: 1023px) {
    display: inline-grid;
  }
`;

const Drawer = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: calc(var(--nav-height) + var(--nav-gap-y)) 0 0;
  z-index: 490;
  display: grid;
  grid-template-columns: 1fr;
  align-content: start;
  gap: 6px;
  padding: 22px clamp(18px, 5vw, 38px) 40px;
  background: rgba(5, 7, 9, 0.98);
  backdrop-filter: blur(20px);
  overflow-y: auto;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transform: translateY(${({ $open }) => ($open ? '0' : '-10px')});
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
`;

const DrawerLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 54px;
  padding: 0 4px;
  border-bottom: 1px solid var(--line);
  color: ${({ $active, theme }) => ($active ? theme.colors.lime : theme.colors.text)};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;

  span {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: ${({ theme }) => theme.colors.textDim};
  }
`;

const DrawerExtra = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
  a {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
`;

const DrawerFooter = styled.div`
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 700;
  }
`;

function routeIsActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar() {
  const pathname = usePathname();
  const coins = useGameStore((state) => state.coins);
  const muted = useGameStore((state) => state.settings.audio.muted);
  const updateSetting = useGameStore((state) => state.updateSetting);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleMute = () => {
    updateSetting('audio', 'muted', !muted);
    const audio = getAudioManager();
    if (muted) {
      void audio.unlock().then(() => audio.playCue('ui'));
    }
  };

  return (
    <>
      <Bar>
        <Shell aria-hidden="true" />
        <Inner>
          <BrandBlock>
            <Logo size="nav" />
            <RacingStripes aria-hidden="true" />
          </BrandBlock>
          <DesktopLinks aria-label="Main navigation">
            {navItems.map((item) => {
              const active = routeIsActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  $active={active}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <>
                      <motion.span
                        className="nav-active-wash"
                        layoutId="nav-active-wash"
                        transition={NAV_SPRING}
                      />
                      <motion.span
                        className="nav-active-rail"
                        layoutId="nav-active-rail"
                        transition={NAV_SPRING}
                      />
                    </>
                  )}
                  <Icon aria-hidden="true" />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </DesktopLinks>
          <Right>
            <Wallet aria-label={`${formatNumber(coins)} coins`}>
              <Coins aria-hidden="true" />
              {formatNumber(coins)}
            </Wallet>
            <ControlsDivider aria-hidden="true" />
            <SoundButton
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              title={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
            </SoundButton>
            <MobileToggle
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="main-menu-drawer"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </MobileToggle>
          </Right>
        </Inner>
      </Bar>
      <Drawer id="main-menu-drawer" $open={open} aria-hidden={!open}>
        {navItems.map((item) => (
          <DrawerLink
            key={item.href}
            href={item.href}
            $active={routeIsActive(pathname, item.href)}
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
          >
            {item.label}
            <span>Open</span>
          </DrawerLink>
        ))}
        <DrawerExtra>
          {extraItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              {item.label}
            </Link>
          ))}
        </DrawerExtra>
        <DrawerFooter>
          Highway Rush · <strong>Built by Umar Nazir</strong>
        </DrawerFooter>
      </Drawer>
      <MobileBottomNav />
    </>
  );
}

export const NavSpacer = styled.div`
  height: 0;
`;

export const navStyles = css``;

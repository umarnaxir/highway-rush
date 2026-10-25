'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled, { css } from 'styled-components';
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
import { IconButton } from '@/components/ui/Button';
import { useGameStore } from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { formatNumber } from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

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

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 500;
  height: var(--nav-height);
  background: rgba(7, 9, 11, 0.82);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px) saturate(1.15);
`;

const Inner = styled.div`
  max-width: 1420px;
  height: 100%;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 36px);
  display: flex;
  align-items: center;
  gap: clamp(16px, 2vw, 34px);
`;

const DesktopLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 0;

  ${media.desktop} {
    display: none;
  }
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 10px;
  border-radius: 3px;
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: all 0.16s ease;

  svg {
    width: 14px;
    height: 14px;
    color: ${({ $active, theme }) => ($active ? theme.colors.lime : 'inherit')};
  }

  &::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 1px;
    height: 2px;
    background: ${({ theme }) => theme.colors.lime};
    transform: scaleX(${({ $active }) => ($active ? 1 : 0)});
    transform-origin: left;
    transition: transform 0.2s ease;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: rgba(255, 255, 255, 0.04);
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
`;

const Wallet = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 215, 59, 0.04);
  color: var(--warning);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const MobileToggle = styled.button`
  display: none;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);

  ${media.desktop} {
    display: inline-grid;
  }
`;

const Drawer = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: var(--nav-height) 0 0;
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

export function NavBar() {
  const pathname = usePathname();
  const coins = useGameStore((state) => state.coins);
  const muted = useGameStore((state) => state.settings.audio.muted);
  const updateSetting = useGameStore((state) => state.updateSetting);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
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
        <Inner>
          <Logo size="sm" />
          <DesktopLinks aria-label="Main navigation">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === '/play' && pathname.startsWith('/play'));
              const Icon = item.icon;
              return (
                <NavLink key={item.href} href={item.href} $active={active}>
                  <Icon />
                  {item.label}
                </NavLink>
              );
            })}
          </DesktopLinks>
          <Right>
            <Wallet aria-label={`${formatNumber(coins)} coins`}>
              <Coins />
              {formatNumber(coins)}
            </Wallet>
            <IconButton
              type="button"
              $size={38}
              onClick={toggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              title={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </IconButton>
            <MobileToggle
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </MobileToggle>
          </Right>
        </Inner>
      </Bar>
      <Drawer $open={open} aria-hidden={!open}>
        {navItems.map((item) => (
          <DrawerLink
            key={item.href}
            href={item.href}
            $active={pathname === item.href}
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
    </>
  );
}

export const NavSpacer = styled.div`
  height: 0;
`;

export const navStyles = css``;

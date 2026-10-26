'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import { Car, Flag, Home, Settings, Trophy } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/garage', label: 'Garage', icon: Car },
  { href: '/play', label: 'Drive', icon: Flag, primary: true },
  { href: '/trophies', label: 'Rewards', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const Nav = styled.nav`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 600;
  display: none;
  padding: 7px max(8px, env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom))
    max(8px, env(safe-area-inset-left));
  border-top: 1px solid rgba(245, 246, 247, 0.11);
  background: rgba(11, 13, 16, 0.88);
  box-shadow: 0 -18px 50px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(22px) saturate(1.2);
  -webkit-backdrop-filter: blur(22px) saturate(1.2);

  @media (max-width: 1023px) {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: stretch;
    gap: 3px;
  }
`;

const Item = styled(Link)<{ $active: boolean; $primary?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  min-height: 52px;
  border-radius: 12px;
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  -webkit-tap-highlight-color: transparent;
  transition:
    color 0.18s ease,
    background 0.18s ease;

  svg {
    width: 19px;
    height: 19px;
    stroke-width: 2.2;
    color: ${({ $active, $primary, theme }) =>
      $primary ? theme.colors.limeInk : $active ? theme.colors.lime : 'currentColor'};
  }

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    width: 16px;
    height: 2px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.lime};
    opacity: ${({ $active }) => ($active ? 1 : 0)};
    transform: scaleX(${({ $active }) => ($active ? 1 : 0.4)});
    transition: all 0.18s ease;
  }

  ${({ $primary, theme }) =>
    $primary &&
    `
      margin: 0 3px;
      background: ${theme.colors.lime};
      color: ${theme.colors.limeInk};
      box-shadow: 0 8px 26px rgba(215, 255, 63, 0.2);
      &::after { display: none; }
    `}

  ${({ $primary }) =>
    $primary &&
    `
      svg { color: var(--lime-ink); }
      span { color: var(--lime-ink); }
    `}

  &:focus-visible {
    outline: 2px solid var(--lime);
    outline-offset: -2px;
  }

  @media (hover: hover) {
    &:hover {
      color: var(--text);
      background: rgba(245, 246, 247, 0.05);
    }
  }

  @media (orientation: landscape) and (max-height: 560px) {
    min-height: 42px;
    flex-direction: row;
    gap: 6px;
    font-size: 7px;

    svg {
      width: 16px;
      height: 16px;
    }

    &::after {
      display: none;
    }
  }
`;

const Label = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <Nav aria-label="Primary mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === '/'
            ? pathname === '/'
            : item.href === '/trophies'
              ? pathname.startsWith('/trophies') || pathname.startsWith('/missions')
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Item
            key={item.href}
            href={item.href}
            $active={active}
            $primary={item.primary}
            aria-current={active ? 'page' : undefined}
          >
            <Icon aria-hidden="true" />
            <Label>{item.label}</Label>
          </Item>
        );
      })}
    </Nav>
  );
}

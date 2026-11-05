'use client';

import Link from 'next/link';
import styled from 'styled-components';
import {
  Gamepad2,
  Keyboard,
  ShieldCheck,
  Trophy,
  Zap,
} from 'lucide-react';
import { media } from '@/lib/ui/theme';

const GamingBar = styled.footer`
  position: relative;
  z-index: 100;
  width: 100%;
  border-top: 1px solid rgba(215, 255, 63, 0.2);
  background: rgba(7, 9, 11, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 10px clamp(16px, 3vw, 36px);
  font-family: ${({ theme }) => theme.fonts.body};
  margin-top: auto;
`;

const BarInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: var(--page-max);
  margin: 0 auto;
  flex-wrap: wrap;

  ${media.mobile} {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }
`;

const LeftStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-dim);

  i {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--lime);
    box-shadow: 0 0 8px var(--lime);
    animation: pulseGlow 2s ease-in-out infinite;
  }

  span {
    color: var(--text);
  }
`;

const ControlsHint = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);

  ${media.tablet} {
    display: none;
  }

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  kbd {
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    height: 18px;
    padding: 0 4px;
    border: 1px solid var(--line-strong);
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--lime);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 8px;
    font-weight: 800;
  }
`;

const QuickLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;

  a {
    padding: 4px 8px;
    border-radius: 3px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-muted);
    transition: all 0.15s ease;

    &:hover {
      border-color: var(--lime);
      color: var(--lime);
      background: rgba(215, 255, 63, 0.08);
    }
  }
`;

export function Footer() {
  return (
    <GamingBar>
      <BarInner>
        <LeftStatus>
          <i /> <span>HIGHWAY RUSH</span> · 3D RACING SYSTEM v2.0
        </LeftStatus>

        <ControlsHint>
          <span>
            <kbd>W</kbd> <kbd>↑</kbd> DRIVE
          </span>
          <span>
            <kbd>A</kbd> <kbd>D</kbd> STEER
          </span>
          <span>
            <kbd>S</kbd> <kbd>↓</kbd> BRAKE
          </span>
          <span>
            <kbd>SPACE</kbd> NITRO
          </span>
        </ControlsHint>

        <QuickLinks>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/how-to-play">Guide</Link>
          <Link href="/credits">Credits</Link>
        </QuickLinks>
      </BarInner>
    </GamingBar>
  );
}

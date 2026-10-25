'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { Heart, Volume2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { media } from '@/lib/ui/theme';

const Foot = styled.footer`
  margin-top: clamp(60px, 9vw, 110px);
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.012), transparent 60%);
`;

const Inner = styled.div`
  max-width: 1420px;
  margin: 0 auto;
  padding: clamp(36px, 5vw, 62px) clamp(18px, 3vw, 36px) 26px;
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(120px, 0.55fr));
  gap: 36px;

  ${media.desktop} {
    grid-template-columns: 1fr 1fr;
  }
  ${media.mobile} {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

const BrandCol = styled.div`
  max-width: 360px;

  p {
    margin-top: 16px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 12px;
    line-height: 1.75;
  }
`;

const Col = styled.div`
  h4 {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textDim};
    margin-bottom: 14px;
  }

  a {
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    padding: 5px 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    transition: color 0.15s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.lime};
    }
  }
`;

const Bottom = styled.div`
  max-width: 1420px;
  margin: 0 auto;
  padding: 18px clamp(18px, 3vw, 36px) 28px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const Credit = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  letter-spacing: 0.08em;
  text-transform: none;

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 800;
    border-bottom: 1px solid rgba(215, 255, 63, 0.5);
  }
`;

export function Footer() {
  return (
    <Foot>
      <Inner>
        <BrandCol>
          <Logo size="md" showKicker />
          <p>
            Seven routes. Eight machines. One endless stretch of asphalt. A premium arcade racing
            experience built entirely for the browser.
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14 }}>
            <Volume2 size={12} /> Fully procedural engine, tyre and ambience audio
          </p>
        </BrandCol>
        <Col>
          <h4>Drive</h4>
          <Link href="/play">Play Now</Link>
          <Link href="/garage">Garage</Link>
          <Link href="/destinations">Destinations</Link>
          <Link href="/how-to-play">How to Play</Link>
        </Col>
        <Col>
          <h4>Progress</h4>
          <Link href="/missions">Missions</Link>
          <Link href="/trophies">Trophy Room</Link>
          <Link href="/statistics">Statistics</Link>
          <Link href="/leaderboard">Leaderboard</Link>
        </Col>
        <Col>
          <h4>Game</h4>
          <Link href="/settings">Settings</Link>
          <Link href="/credits">Credits</Link>
          <Link href="/settings#about">About</Link>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 5, fontSize: 11, color: 'var(--text-dim)' }}>
            <Heart size={11} /> Local-first saves
          </span>
        </Col>
      </Inner>
      <Bottom>
        <span>© {new Date().getFullYear()} Highway Rush. All rights reserved.</span>
        <Credit>
          Built by <strong>Umar Nazir</strong>
        </Credit>
      </Bottom>
    </Foot>
  );
}

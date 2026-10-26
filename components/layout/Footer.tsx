'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import {
  BadgeCheck,
  BarChart3,
  Car,
  CircleHelp,
  Flag,
  Info,
  ListChecks,
  Map,
  Medal,
  Settings,
  Trophy,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { media } from '@/lib/ui/theme';

const Foot = styled.footer`
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-height: clamp(230px, 16vw, 260px);
  margin-top: clamp(56px, 8vw, 96px);
  overflow: hidden;
  border-top: 1px solid rgba(215, 255, 63, 0.2);
  background-color: #070a0c;
  background-image:
    linear-gradient(
      90deg,
      rgba(7, 9, 11, 0.74) 0%,
      rgba(7, 9, 11, 0.84) 22%,
      rgba(7, 9, 11, 0.76) 42%,
      rgba(7, 9, 11, 0.56) 60%,
      rgba(7, 9, 11, 0.3) 82%,
      rgba(7, 9, 11, 0.34) 100%
    ),
    linear-gradient(180deg, rgba(7, 9, 11, 0.02) 0%, rgba(7, 9, 11, 0.08) 36%, rgba(7, 9, 11, 0.48) 84%, rgba(7, 9, 11, 0.88) 100%),
    url('/images/footer-bg.png');
  background-repeat: no-repeat;
  background-position: center 45%;
  background-size: cover;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image:
      repeating-linear-gradient(
        108deg,
        transparent 0 82px,
        rgba(215, 255, 63, 0.018) 82px 83px,
        transparent 83px 176px
      ),
      radial-gradient(ellipse at 78% 38%, rgba(215, 255, 63, 0.055), transparent 48%);
    pointer-events: none;
  }

  ${media.desktop} {
    background-image:
      linear-gradient(
        90deg,
        rgba(7, 9, 11, 0.88) 0%,
        rgba(7, 9, 11, 0.8) 30%,
        rgba(7, 9, 11, 0.72) 55%,
        rgba(7, 9, 11, 0.6) 100%
      ),
      linear-gradient(180deg, rgba(7, 9, 11, 0.08) 0%, rgba(7, 9, 11, 0.18) 38%, rgba(7, 9, 11, 0.66) 86%, rgba(7, 9, 11, 0.92) 100%),
      url('/images/footer-bg.png');
  }

  ${media.mobile} {
    background-image:
      linear-gradient(
        180deg,
        rgba(7, 9, 11, 0.44) 0%,
        rgba(7, 9, 11, 0.7) 55%,
        rgba(7, 9, 11, 0.94) 100%
      ),
      url('/images/footer-bg.png');
    background-position: center 38%;
  }
`;

const Inner = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(28px, 3.4vw, 44px) clamp(18px, 4.4vw, 64px) clamp(20px, 2.5vw, 30px);
`;

const Main = styled.div`
  display: grid;
  grid-template-columns: minmax(178px, 210px) minmax(0, 1fr);
  align-items: start;
  gap: clamp(30px, 4.8vw, 64px);
  width: 100%;

  ${media.mobile} {
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(20px, 3.2vw, 26px);
  }
`;

const BrandPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  justify-content: center;
  min-width: 0;
  text-align: center;
`;

const BrandCol = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;
  text-align: center;
`;

const LinkGrid = styled.nav`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(18px, 2.6vw, 40px);
  width: 100%;

  ${media.mobile} {
    gap: clamp(8px, 2.2vw, 14px);
  }
`;

const Col = styled.div`
  min-width: 0;
  text-align: center;

  h4 {
    margin: 0 0 14px;
    color: var(--text);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.18em;
    line-height: 1.1;
    text-transform: uppercase;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.72);
  }

  ${media.mobile} {
    h4 {
      margin-bottom: 10px;
      font-size: 10.5px;
      letter-spacing: 0.14em;
    }
  }
`;

const Links = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: fit-content;
  margin: 0 auto;
  text-align: left;

  a {
    display: grid;
    grid-template-columns: 14px minmax(0, 1fr);
    align-items: center;
    column-gap: 9px;
    width: 100%;
    padding: 5px 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 750;
    letter-spacing: 0.02em;
    line-height: 1.2;
    text-align: left;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.72);
    white-space: nowrap;
    transition:
      color 0.15s ease,
      transform 0.15s ease;

    svg {
      width: 13px;
      height: 13px;
      justify-self: center;
      color: var(--lime);
      opacity: 0.78;
      transition:
        opacity 0.15s ease,
        filter 0.15s ease;
    }

    &:hover {
      color: var(--lime);
      transform: translateX(2px);

      svg {
        opacity: 1;
        filter: drop-shadow(0 0 5px rgba(215, 255, 63, 0.38));
      }
    }

    &:active {
      color: var(--lime);
      transform: translateX(1px);
    }

    &[aria-current='page'] {
      color: var(--lime);
      text-shadow: 0 0 14px rgba(215, 255, 63, 0.18);

      svg {
        opacity: 1;
        filter: drop-shadow(0 0 5px rgba(215, 255, 63, 0.38));
      }
    }

    &:focus-visible {
      outline: 2px solid var(--lime);
      outline-offset: 4px;
    }
  }

  ${media.tablet} {
    a {
      grid-template-columns: 12px minmax(0, 1fr);
      column-gap: 6px;
      min-height: 34px;
      padding: 0;
      font-size: 10.5px;
      letter-spacing: 0.015em;

      svg {
        width: 11px;
        height: 11px;
      }
    }
  }
`;

const Bottom = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 24px;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 13px clamp(18px, 4.4vw, 64px) 18px;
  border-top: 1px solid rgba(245, 246, 247, 0.08);
  color: var(--text-dim);
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-align: left;
  text-transform: uppercase;

  ${media.mobile} {
    gap: 8px 14px;
    padding: 12px clamp(18px, 4.4vw, 64px) 16px;
    font-size: 7.5px;
    letter-spacing: 0.13em;
  }

  @media (max-width: 340px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
  }
`;

const Credit = styled.p`
  margin: 0 0 0 auto;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: right;
  text-transform: none;

  strong {
    color: var(--text);
    font-weight: 800;
  }

  ${media.mobile} {
    font-size: 8px;
  }

  @media (max-width: 340px) {
    margin-left: 0;
    text-align: left;
  }
`;

export function Footer() {
  const pathname = usePathname();
  const currentPage = (href: string): 'page' | undefined =>
    pathname === href ? 'page' : undefined;

  return (
    <Foot>
      <Inner>
        <Main>
          <BrandPanel>
            <BrandCol>
              <Logo size="nav" showKicker />
            </BrandCol>
          </BrandPanel>

          <LinkGrid aria-label="Footer navigation">
            <Col>
              <h4>Drive</h4>
              <Links>
                <Link href="/play" aria-current={currentPage('/play')}>
                  <Flag aria-hidden="true" />
                  Play Now
                </Link>
                <Link href="/garage" aria-current={currentPage('/garage')}>
                  <Car aria-hidden="true" />
                  Garage
                </Link>
                <Link href="/destinations" aria-current={currentPage('/destinations')}>
                  <Map aria-hidden="true" />
                  Destinations
                </Link>
                <Link href="/how-to-play" aria-current={currentPage('/how-to-play')}>
                  <CircleHelp aria-hidden="true" />
                  How to Play
                </Link>
              </Links>
            </Col>
            <Col>
              <h4>Progress</h4>
              <Links>
                <Link href="/missions" aria-current={currentPage('/missions')}>
                  <ListChecks aria-hidden="true" />
                  Missions
                </Link>
                <Link href="/trophies" aria-current={currentPage('/trophies')}>
                  <Trophy aria-hidden="true" />
                  Trophy Room
                </Link>
                <Link href="/statistics" aria-current={currentPage('/statistics')}>
                  <BarChart3 aria-hidden="true" />
                  Statistics
                </Link>
                <Link href="/leaderboard" aria-current={currentPage('/leaderboard')}>
                  <Medal aria-hidden="true" />
                  Leaderboard
                </Link>
              </Links>
            </Col>
            <Col>
              <h4>Game</h4>
              <Links>
                <Link href="/settings" aria-current={currentPage('/settings')}>
                  <Settings aria-hidden="true" />
                  Settings
                </Link>
                <Link href="/credits" aria-current={currentPage('/credits')}>
                  <BadgeCheck aria-hidden="true" />
                  Credits
                </Link>
                <Link href="/settings#about" aria-current={currentPage('/settings#about')}>
                  <Info aria-hidden="true" />
                  About
                </Link>
              </Links>
            </Col>
          </LinkGrid>
        </Main>
      </Inner>
      <Bottom>
        <span>© {new Date().getFullYear()} Highway Rush</span>
        <Credit>
          Built by <strong>Umar Nazir</strong>
        </Credit>
      </Bottom>
    </Foot>
  );
}

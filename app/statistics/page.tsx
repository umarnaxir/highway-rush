'use client';

import Link from 'next/link';
import styled from 'styled-components';
import {
  Activity,
  ArrowLeft,
  Car,
  Coins,
  Compass,
  Flag,
  Flame,
  Gauge,
  Heart,
  Route,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import { useGameStore } from '@/lib/store/useGameStore';
import { CARS_BY_ID } from '@/lib/data/cars';
import { DESTINATIONS_BY_ID } from '@/lib/data/destinations';
import {
  formatDistance,
  formatDuration,
  formatNumber,
  formatRelativeDate,
  formatSpeed,
} from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

const Stage = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: #030507;
  color: var(--text);
  padding: clamp(16px, 3vw, 32px);
  user-select: none;
`;

const ContentWrap = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TopNav = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const BackPill = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 4px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.82);
  backdrop-filter: blur(10px);
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

const HeaderTitle = styled.div`
  h1 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(28px, 4vw, 42px);
    font-style: italic;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.02em;
    text-transform: uppercase;

    em {
      color: var(--lime);
      font-style: inherit;
    }
  }

  span {
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatTile = styled.div`
  padding: 16px;
  border-radius: 5px;
  border: 1px solid var(--line-strong);
  background: rgba(8, 12, 16, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-dim);

    svg {
      color: var(--lime);
      width: 14px;
      height: 14px;
    }
  }

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: clamp(22px, 2.5vw, 30px);
    font-weight: 800;
    color: var(--text);
    line-height: 1;
  }
`;

const RunsCard = styled.div`
  padding: 18px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(8, 12, 16, 0.85);
  display: flex;
  flex-direction: column;
  gap: 12px;

  h3 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 16px;
    font-style: italic;
    font-weight: 800;
    text-transform: uppercase;
  }
`;

const RunList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RunRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.015);
  font-size: 10px;

  .route {
    strong {
      display: block;
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 12px;
      font-style: italic;
      text-transform: uppercase;
    }
    span {
      font-size: 8px;
      color: var(--text-dim);
      text-transform: uppercase;
    }
  }

  .score {
    text-align: right;
    strong {
      display: block;
      font-family: ${({ theme }) => theme.fonts.mono};
      color: var(--lime);
      font-size: 12px;
    }
    span {
      font-size: 8px;
      color: var(--text-dim);
    }
  }
`;

export default function StatisticsPage() {
  const stats = useGameStore((state) => state.stats);
  const runs = useGameStore((state) => state.runs);
  const coins = useGameStore((state) => state.coins);
  const speedUnit = useGameStore((state) => state.settings.gameplay.speedUnit);

  const bestSpeedFormatted = formatSpeed(stats.highestSpeed, speedUnit);

  return (
    <Stage>
      <ContentWrap>
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <HeaderTitle>
            <span>DRIVER TELEMETRY</span>
            <h1>
              Career <em>Telemetry</em>
            </h1>
          </HeaderTitle>

          <div style={{ width: 40 }} />
        </TopNav>

        <StatGrid>
          <StatTile>
            <div className="head">
              <span>Top Speed</span>
              <Gauge />
            </div>
            <strong>{bestSpeedFormatted}</strong>
          </StatTile>

          <StatTile>
            <div className="head">
              <span>Total Distance</span>
              <Route />
            </div>
            <strong>{formatDistance(stats.totalDistanceM)}</strong>
          </StatTile>

          <StatTile>
            <div className="head">
              <span>Best Score</span>
              <Trophy />
            </div>
            <strong>{formatNumber(stats.bestScore)}</strong>
          </StatTile>

          <StatTile>
            <div className="head">
              <span>Near Misses</span>
              <Target />
            </div>
            <strong>{formatNumber(stats.nearMisses)}</strong>
          </StatTile>

          <StatTile>
            <div className="head">
              <span>Nitro Burns</span>
              <Zap />
            </div>
            <strong>{formatNumber(stats.nitroUses)}</strong>
          </StatTile>

          <StatTile>
            <div className="head">
              <span>Drift Distance</span>
              <Activity />
            </div>
            <strong>{formatDistance(stats.driftDistanceM)}</strong>
          </StatTile>

          <StatTile>
            <div className="head">
              <span>Total Playtime</span>
              <Timer />
            </div>
            <strong>{formatDuration(stats.totalPlaytimeMs)}</strong>
          </StatTile>

          <StatTile>
            <div className="head">
              <span>Coins Banked</span>
              <Coins />
            </div>
            <strong>{formatNumber(stats.coinsEarned)}</strong>
          </StatTile>
        </StatGrid>

        <RunsCard>
          <h3>Recent Run Telemetry</h3>
          {runs.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 11 }}>No race records logged yet. Head to the track!</p>
          ) : (
            <RunList>
              {runs.slice(-6).reverse().map((run) => {
                const dest = DESTINATIONS_BY_ID[run.destinationId];
                const car = CARS_BY_ID[run.carId];
                return (
                  <RunRow key={run.id}>
                    <div className="route">
                      <strong>{dest?.name ?? run.destinationId}</strong>
                      <span>{car?.name ?? run.carId} · {run.difficulty.toUpperCase()}</span>
                    </div>

                    <div className="score">
                      <strong>{formatNumber(run.score)} PTS</strong>
                      <span>{formatDistance(run.distanceM)} · {formatSpeed(run.topSpeedKph, speedUnit)}</span>
                    </div>
                  </RunRow>
                );
              })}
            </RunList>
          )}
        </RunsCard>
      </ContentWrap>
    </Stage>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import {
  ArrowLeft,
  Crown,
  Flag,
  Info,
  MapPin,
  Trophy,
} from 'lucide-react';
import { useGameStore } from '@/lib/store/useGameStore';
import { DESTINATIONS, DESTINATIONS_BY_ID } from '@/lib/data/destinations';
import { CARS_BY_ID } from '@/lib/data/cars';
import { getAudioManager } from '@/lib/audio/AudioManager';
import {
  formatCompact,
  formatDistance,
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
  max-width: 1080px;
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

const TopBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const BestBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 4px;
  border: 1px solid rgba(215, 255, 63, 0.35);
  background: rgba(215, 255, 63, 0.08);
  color: var(--lime);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const RaceLinkBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 4px;
  border: 1px solid var(--lime);
  background: var(--lime);
  color: #07090b;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 13px;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: #e6ff66;
    transform: scale(1.02);
  }
`;

const TerminalPanel = styled.div`
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.88);
  backdrop-filter: blur(12px);
  overflow: hidden;
`;

const FilterStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 3px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'var(--line)')};
  background: ${({ $active }) => ($active ? 'rgba(215, 255, 63, 0.15)' : 'rgba(255, 255, 255, 0.03)')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--lime);
    color: var(--text);
  }
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 56px 1.5fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--line);
  color: var(--text-dim);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;

  ${media.mobile} {
    grid-template-columns: 44px 1.5fr 1fr;
  }
`;

const TableRow = styled.div<{ $top: boolean }>`
  display: grid;
  grid-template-columns: 56px 1.5fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  background: ${({ $top }) => ($top ? 'rgba(215, 255, 63, 0.04)' : 'transparent')};
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.025);
  }

  &:last-child {
    border-bottom: 0;
  }

  ${media.mobile} {
    grid-template-columns: 44px 1.5fr 1fr;
    padding: 12px 14px;
  }
`;

const RankCell = styled.div<{ $top: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 19px;
  font-style: italic;
  font-weight: 900;
  color: ${({ $top }) => ($top ? 'var(--lime)' : 'var(--text-dim)')};
  font-variant-numeric: tabular-nums;

  svg {
    color: #fbbf24;
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.5));
  }
`;

const MainCell = styled.div`
  min-width: 0;

  strong {
    display: block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    display: block;
    margin-top: 3px;
    color: var(--text-dim);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const MetricCell = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  b {
    color: var(--text);
    font-weight: 800;
  }

  ${media.mobile} {
    &:nth-child(4),
    &:nth-child(5),
    &:nth-child(6) {
      display: none;
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 10px;

  svg {
    color: var(--text-dim);
  }

  strong {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 18px;
    font-style: italic;
    text-transform: uppercase;
  }

  p {
    color: var(--text-dim);
    font-size: 11px;
    max-width: 380px;
  }
`;

const BestsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const BestCard = styled.div`
  padding: 16px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: rgba(10, 14, 18, 0.65);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(215, 255, 63, 0.4);
    background: rgba(10, 14, 18, 0.9);
  }

  .loc {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .score {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 22px;
    font-style: italic;
    font-weight: 900;
    color: var(--text);
    line-height: 1;
  }

  .count {
    color: var(--text-dim);
    font-size: 9px;
    font-family: ${({ theme }) => theme.fonts.mono};
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 20px;
    font-style: italic;
    font-weight: 900;
    text-transform: uppercase;
  }

  span {
    color: var(--text-dim);
    font-size: 9px;
    font-family: ${({ theme }) => theme.fonts.mono};
  }
`;

const LocalNote = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.35);
  color: var(--text-dim);
  font-size: 10px;

  svg {
    color: var(--lime);
    flex-shrink: 0;
  }
`;

export default function LeaderboardPage() {
  const runs = useGameStore((state) => state.runs);
  const bestScore = useGameStore((state) => state.stats.bestScore);
  const speedUnit = useGameStore((state) => state.settings.gameplay.speedUnit);
  const [filter, setFilter] = useState('all');

  const handleFilterClick = (destinationId: string) => {
    setFilter(destinationId);
    getAudioManager().playCue('ui');
  };

  const filtered = useMemo(
    () =>
      runs
        .filter((run) => filter === 'all' || run.destinationId === filter)
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 25),
    [runs, filter],
  );

  return (
    <Stage>
      <ContentWrap>
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <HeaderTitle>
            <span>Telemetry Archive</span>
            <h1>
              House <em>Records</em>
            </h1>
          </HeaderTitle>

          <TopBadges>
            <BestBadge>
              <Trophy size={14} /> Personal Best: {formatCompact(bestScore)}
            </BestBadge>
            <RaceLinkBtn href="/play">
              <Flag size={14} /> Race Now
            </RaceLinkBtn>
          </TopBadges>
        </TopNav>

        <TerminalPanel>
          <FilterStrip>
            <FilterBtn
              $active={filter === 'all'}
              onClick={() => handleFilterClick('all')}
            >
              All Routes ({runs.length})
            </FilterBtn>
            {DESTINATIONS.map((dest) => (
              <FilterBtn
                key={dest.id}
                $active={filter === dest.id}
                onClick={() => handleFilterClick(dest.id)}
              >
                {dest.name}
              </FilterBtn>
            ))}
          </FilterStrip>

          <TableHead>
            <span>Rank</span>
            <span>Route / Vehicle</span>
            <span>Final Score</span>
            <span>Distance</span>
            <span>Top Speed</span>
            <span>Date</span>
          </TableHead>

          {filtered.length === 0 ? (
            <EmptyState>
              <Crown size={28} />
              <strong>No Records Logged</strong>
              <p>
                Complete or push your vehicle on the highway to log your telemetry and establish new track records.
              </p>
            </EmptyState>
          ) : (
            filtered.map((run, index) => {
              const dest = DESTINATIONS_BY_ID[run.destinationId];
              const car = CARS_BY_ID[run.carId];
              const isFirst = index === 0;

              return (
                <TableRow key={run.id} $top={isFirst}>
                  <RankCell $top={isFirst}>
                    {isFirst ? <Crown size={15} /> : null}
                    {String(index + 1).padStart(2, '0')}
                  </RankCell>

                  <MainCell>
                    <strong>{dest?.name ?? 'Unknown Route'}</strong>
                    <span>
                      {car?.name ?? 'Unknown Vehicle'} · {run.difficulty} · {run.reason}
                    </span>
                  </MainCell>

                  <MetricCell>
                    <b style={{ color: isFirst ? 'var(--lime)' : 'var(--text)' }}>
                      {formatNumber(run.score)}
                    </b>
                  </MetricCell>

                  <MetricCell>{formatDistance(run.distanceM, 1)}</MetricCell>
                  <MetricCell>{formatSpeed(run.topSpeedKph, speedUnit)}</MetricCell>
                  <MetricCell>{formatRelativeDate(run.date)}</MetricCell>
                </TableRow>
              );
            })
          )}
        </TerminalPanel>

        <SectionHeader>
          <h2>Route Personal Records</h2>
          <span>{runs.length} total logged sessions</span>
        </SectionHeader>

        <BestsGrid>
          {DESTINATIONS.map((destination) => {
            const best = runs
              .filter((run) => run.destinationId === destination.id)
              .reduce((value, run) => Math.max(value, run.score), 0);
            const count = runs.filter((run) => run.destinationId === destination.id).length;

            return (
              <BestCard key={destination.id}>
                <div className="loc">
                  <MapPin size={10} /> {destination.name}
                </div>
                <div className="score" style={{ color: best > 0 ? 'var(--lime)' : 'var(--text-dim)' }}>
                  {best > 0 ? formatNumber(best) : 'UNSET'}
                </div>
                <div className="count">{count} {count === 1 ? 'run' : 'runs'} on record</div>
              </BestCard>
            );
          })}
        </BestsGrid>

        <LocalNote>
          <Info size={14} />
          <span>
            Telemetry is calculated and preserved in device storage. Every machine, difficulty modifier, and route is tracked with zero telemetry lag.
          </span>
        </LocalNote>
      </ContentWrap>
    </Stage>
  );
}

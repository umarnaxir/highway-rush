'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { Crown, Flag, Info, MapPin, Trophy } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Badge, Panel, PanelLabel } from '@/components/ui/Panel';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { useGameStore } from '@/lib/store/useGameStore';
import { DESTINATIONS, DESTINATIONS_BY_ID } from '@/lib/data/destinations';
import { CARS_BY_ID } from '@/lib/data/cars';
import {
  formatCompact,
  formatDistance,
  formatNumber,
  formatRelativeDate,
  formatSpeed,
} from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.18);
  width: fit-content;
  max-width: 100%;
`;

const Filter = styled.button<{ $active: boolean }>`
  min-height: 33px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: ${({ $active, theme }) => ($active ? theme.colors.lime : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.limeInk : theme.colors.textMuted)};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all 0.15s ease;
`;

const Board = styled(Panel)`
  padding: 0;
  overflow: hidden;
`;

const Head = styled.div`
  display: grid;
  grid-template-columns: 54px 1.5fr 0.8fr 0.8fr 0.7fr 0.8fr;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  color: var(--text-dim);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;

  ${media.mobile} {
    grid-template-columns: 38px 1fr 0.7fr;
  }
`;

const Row = styled.div<{ $top: boolean }>`
  display: grid;
  grid-template-columns: 54px 1.5fr 0.8fr 0.8fr 0.7fr 0.8fr;
  gap: 12px;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  background: ${({ $top }) => ($top ? 'rgba(215,255,63,.03)' : 'transparent')};
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.027);
  }
  &:last-child {
    border-bottom: 0;
  }

  ${media.mobile} {
    grid-template-columns: 38px 1fr 0.7fr;
    padding: 13px 14px;
  }
`;

const Rank = styled.div<{ $top: boolean }>`
  font-family: var(--font-display);
  font-size: 20px;
  font-style: italic;
  color: ${({ $top, theme }) => ($top ? theme.colors.lime : theme.colors.textDim)};
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 5px;

  svg {
    color: var(--warning);
  }
`;

const Main = styled.div`
  min-width: 0;
  strong {
    display: block;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  span {
    display: block;
    margin-top: 3px;
    color: var(--text-dim);
    font-size: 8px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Cell = styled.div`
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  b {
    color: var(--text);
    font-weight: 700;
  }

  ${media.mobile} {
    &:nth-child(4),
    &:nth-child(5),
    &:nth-child(6) {
      display: none;
    }
  }
`;

const Note = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-left: 2px solid var(--info);
  background: rgba(56, 189, 248, 0.04);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;

  svg {
    color: var(--info);
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

const DestBests = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 18px;

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const BestCard = styled(Link)`
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.018);
  transition: all 0.16s ease;
  &:hover {
    border-color: var(--line-strong);
    background: rgba(255, 255, 255, 0.035);
  }
  span {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  strong {
    display: block;
    margin-top: 7px;
    font-family: var(--font-display);
    font-size: 19px;
    line-height: 1;
  }
  em {
    display: block;
    margin-top: 4px;
    color: var(--text-muted);
    font-style: normal;
    font-size: 9px;
  }
`;

// Keep the board cards keyboard-accessible via real links.

export default function LeaderboardPage() {
  const runs = useGameStore((state) => state.runs);
  const bestScore = useGameStore((state) => state.stats.bestScore);
  const speedUnit = useGameStore((state) => state.settings.gameplay.speedUnit);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(
    () =>
      runs
        .filter((run) => filter === 'all' || run.destinationId === filter)
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 20),
    [runs, filter],
  );

  return (
    <PageShell
      kicker="Local leaderboard"
      title={
        <>
          House <em>records.</em>
        </>
      }
      intro="Your best runs on this device, ranked by score. This board is intentionally local — there is no server, account or global ranking."
      actions={
        <Badge $tone="warning">
          <Trophy size={10} /> Best {formatCompact(bestScore)}
        </Badge>
      }
      wide
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <FilterBar aria-label="Filter by destination">
          <Filter $active={filter === 'all'} onClick={() => setFilter('all')}>
            All routes
          </Filter>
          {DESTINATIONS.map((destination) => (
            <Filter
              key={destination.id}
              $active={filter === destination.id}
              onClick={() => setFilter(destination.id)}
            >
              {destination.name}
            </Filter>
          ))}
        </FilterBar>
        <ButtonLink href="/play" size="sm" icon={<Flag size={12} />}>
          Race
        </ButtonLink>
      </div>

      <Board style={{ marginTop: 16 }}>
        <Head>
          <span>Rank</span>
          <span>Route / car</span>
          <span>Score</span>
          <span>Distance</span>
          <span>Speed</span>
          <span>Date</span>
        </Head>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Crown size={24} />}
            title="No records yet"
            description="Your finished and failed runs are both logged. Hit the highway to open the board."
            action={
              <ButtonLink href="/play" size="sm" style={{ marginTop: 6 }}>
                Set a record
              </ButtonLink>
            }
          />
        ) : (
          filtered.map((run, index) => {
            const destination = DESTINATIONS_BY_ID[run.destinationId];
            const car = CARS_BY_ID[run.carId];
            return (
              <Row key={run.id} $top={index === 0}>
                <Rank $top={index === 0}>
                  {index === 0 ? <Crown size={16} /> : null}
                  {String(index + 1).padStart(2, '0')}
                </Rank>
                <Main>
                  <strong>{destination?.name ?? 'Unknown route'}</strong>
                  <span>
                    {car?.name ?? 'Unknown car'} · {run.difficulty} · {run.reason}
                  </span>
                </Main>
                <Cell>
                  <b>{formatNumber(run.score)}</b>
                </Cell>
                <Cell>{formatDistance(run.distanceM, 1)}</Cell>
                <Cell>{formatSpeed(run.topSpeedKph, speedUnit)}</Cell>
                <Cell>{formatRelativeDate(run.date)}</Cell>
              </Row>
            );
          })
        )}
      </Board>

      <Note>
        <Info size={14} />
        <span>
          <strong style={{ color: 'var(--text)' }}>Local only.</strong> Highway Rush has no backend. Scores are stored in
          browser local storage and are never uploaded. Clearing site data resets this board. Runs
          are shared across all cars and difficulties but can be filtered by route.
        </span>
      </Note>

      <div style={{ marginTop: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <PanelLabel>Route bests</PanelLabel>
            <h2
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                textTransform: 'uppercase',
                fontStyle: 'italic',
              }}
            >
              Personal records
            </h2>
          </div>
          <Badge>{runs.length} total runs logged</Badge>
        </div>
        <DestBests>
          {DESTINATIONS.map((destination) => {
            const best = runs
              .filter((run) => run.destinationId === destination.id)
              .reduce((value, run) => Math.max(value, run.score), 0);
            const count = runs.filter((run) => run.destinationId === destination.id).length;
            return (
              <BestCard key={destination.id} href="/leaderboard">
                <span>
                  <MapPin size={9} /> {destination.name}
                </span>
                <strong>{best > 0 ? formatNumber(best) : 'Unset'}</strong>
                <em>{count} runs</em>
              </BestCard>
            );
          })}
        </DestBests>
      </div>
    </PageShell>
  );
}

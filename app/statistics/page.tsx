'use client';

import styled from 'styled-components';
import {
  Activity,
  Car,
  Coins,
  Flag,
  Gauge,
  Heart,
  Route,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Badge, Panel, PanelLabel, ProgressBar, StatRow } from '@/components/ui/Panel';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { useGameStore } from '@/lib/store/useGameStore';
import { CARS_BY_ID } from '@/lib/data/cars';
import { DESTINATIONS_BY_ID } from '@/lib/data/destinations';
import {
  formatCompact,
  formatDistance,
  formatDuration,
  formatNumber,
  formatRelativeDate,
  formatSpeed,
} from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  ${media.desktop} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  ${media.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.mobile} {
    grid-template-columns: 1fr 1fr;
  }
`;

const StatCard = styled(Panel)`
  padding: 18px;
  min-height: 116px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;

  &::before {
    background: radial-gradient(320px circle at 100% 0%, rgba(215, 255, 63, 0.05), transparent 60%);
  }
`;

const StatTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;

  svg {
    color: ${({ theme }) => theme.colors.lime};
  }
`;

const StatValue = styled.strong`
  display: block;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(26px, 3.4vw, 38px);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
`;

const StatFoot = styled.span`
  display: block;
  color: var(--text-dim);
  font-size: 9px;
  line-height: 1.4;
`;

const Split = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr);
  gap: 14px;
  margin-top: 18px;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
  h3 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 22px;
    text-transform: uppercase;
    font-style: italic;
    line-height: 1;
  }
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.8fr 0.8fr 0.7fr;
  gap: 12px;
  padding: 0 10px 9px;
  border-bottom: 1px solid var(--line);
  color: var(--text-dim);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;

  ${media.mobile} {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.8fr 0.8fr 0.7fr;
  gap: 12px;
  align-items: center;
  padding: 11px 10px;
  border-bottom: 1px solid var(--line);
  font-size: 10px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.025);
  }
  &:last-child {
    border-bottom: 0;
  }

  ${media.mobile} {
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
  }
`;

const RunMain = styled.div`
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
  }
`;

const Cell = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  b {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 700;
  }

  ${media.mobile} {
    &:nth-child(5) {
      display: none;
    }
  }
`;

const DestList = styled.div`
  display: flex;
  flex-direction: column;
`;

const DestItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  &:last-child {
    border-bottom: 0;
  }
`;

const DestTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
  font-size: 10px;

  strong {
    font-weight: 700;
  }
  span {
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 9px;
  }
`;

export default function StatisticsPage() {
  const stats = useGameStore((state) => state.stats);
  const runs = useGameStore((state) => state.runs);
  const unlocked = useGameStore((state) => state.unlockedTrophies);
  const speedUnit = useGameStore((state) => state.settings.gameplay.speedUnit);

  const trophyCount = Object.keys(unlocked).length;
  const recent = runs.slice(0, 12);
  const maxRuns = Math.max(1, ...Object.values(stats.destinationRaces));
  const totalNitro = stats.nitroUses;

  const cards = [
    {
      label: 'Total distance',
      value: formatDistance(stats.totalDistanceM, 0),
      foot: `${formatNumber(stats.runs)} runs recorded`,
      icon: <Route size={13} />,
    },
    {
      label: 'Best score',
      value: formatCompact(stats.bestScore),
      foot: 'Personal record',
      icon: <Trophy size={13} />,
    },
    {
      label: 'Top speed',
      value: formatSpeed(stats.highestSpeed, speedUnit),
      foot: 'All-time fastest',
      icon: <Gauge size={13} />,
    },
    {
      label: 'Playtime',
      value: formatDuration(stats.totalPlaytimeMs),
      foot: 'Time behind the wheel',
      icon: <Timer size={13} />,
    },
    {
      label: 'Coins earned',
      value: formatCompact(stats.coinsEarned),
      foot: 'Across every run',
      icon: <Coins size={13} />,
    },
    {
      label: 'Races completed',
      value: formatNumber(stats.racesCompleted),
      foot: `${formatNumber(stats.crashes)} crashes total`,
      icon: <Flag size={13} />,
    },
    {
      label: 'Near misses',
      value: formatCompact(stats.nearMisses),
      foot: 'Traffic threaded',
      icon: <Target size={13} />,
    },
    {
      label: 'Drift distance',
      value: formatDistance(stats.driftDistanceM, 0),
      foot: 'Sideways metres',
      icon: <Activity size={13} />,
    },
    {
      label: 'Nitro uses',
      value: formatCompact(totalNitro),
      foot: 'Bottles emptied',
      icon: <Zap size={13} />,
    },
    {
      label: 'Checkpoints',
      value: formatCompact(stats.checkpoints),
      foot: 'Gates cleared',
      icon: <TrendingUp size={13} />,
    },
    {
      label: 'Crash-free best',
      value: formatDistance(stats.crashFreeStreakBest, 0),
      foot: 'Longest clean streak',
      icon: <Heart size={13} />,
    },
    {
      label: 'Trophies',
      value: `${trophyCount}`,
      foot: 'Objectives completed',
      icon: <Trophy size={13} />,
    },
  ];

  return (
    <PageShell
      kicker="Career record"
      title={
        <>
          The long <em>numbers.</em>
        </>
      }
      intro="Every run is committed to this device: distance, speed, drift, nitro, crashes and coins. No account required, no server upload."
      actions={
        <ButtonLink href="/play" size="sm" variant="primary">
          Add another run
        </ButtonLink>
      }
      wide
    >
      <StatGrid>
        {cards.map((card) => (
          <StatCard key={card.label}>
            <StatTop>
              <span>{card.label}</span>
              {card.icon}
            </StatTop>
            <div>
              <StatValue>{card.value}</StatValue>
              <StatFoot>{card.foot}</StatFoot>
            </div>
          </StatCard>
        ))}
      </StatGrid>

      <Split>
        <Panel>
          <PanelHead>
            <h3>Recent runs</h3>
            <Badge $tone={runs.length > 0 ? 'lime' : 'neutral'}>{runs.length} logged</Badge>
          </PanelHead>
          {recent.length === 0 ? (
            <EmptyState
              icon={<Flag size={22} />}
              title="No runs yet"
              description="Finish a race and your result, distance, top speed and score will appear here."
              action={
                <ButtonLink href="/play" size="sm" style={{ marginTop: 6 }}>
                  Start racing
                </ButtonLink>
              }
            />
          ) : (
            <Table>
              <TableHead>
                <span>Run</span>
                <span>Score</span>
                <span>Distance</span>
                <span>Top speed</span>
                <span>Result</span>
              </TableHead>
              {recent.map((run) => {
                const destination = DESTINATIONS_BY_ID[run.destinationId];
                const car = CARS_BY_ID[run.carId];
                return (
                  <TableRow key={run.id}>
                    <RunMain>
                      <strong>{destination?.name ?? 'Unknown route'}</strong>
                      <span>
                        {car?.name ?? 'Unknown car'} · {formatRelativeDate(run.date)}
                      </span>
                    </RunMain>
                    <Cell>
                      <b>{formatNumber(run.score)}</b>
                    </Cell>
                    <Cell>{formatDistance(run.distanceM, 1)}</Cell>
                    <Cell>{formatSpeed(run.topSpeedKph, speedUnit)}</Cell>
                    <Cell>
                      <span
                        style={{
                          color:
                            run.reason === 'finish'
                              ? 'var(--lime)'
                              : run.reason === 'quit'
                                ? 'var(--text-dim)'
                                : 'var(--danger)',
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '.08em',
                        }}
                      >
                        {run.reason === 'finish' ? 'Finished' : run.reason === 'fuel' ? 'Out of fuel' : run.reason === 'crash' ? 'Crashed' : 'Quit'}
                      </span>
                    </Cell>
                  </TableRow>
                );
              })}
            </Table>
          )}
        </Panel>

        <Panel>
          <PanelHead>
            <h3>Route history</h3>
            <Car size={15} style={{ color: 'var(--text-dim)' }} />
          </PanelHead>
          {Object.keys(stats.destinationRaces).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7 }}>
              Destination totals appear after your first completed run on each route.
            </p>
          ) : (
            <DestList>
              {Object.entries(stats.destinationRaces).map(([id, count]) => {
                const destination = DESTINATIONS_BY_ID[id];
                if (!destination) return null;
                const best = runs
                  .filter((run) => run.destinationId === id)
                  .reduce((value, run) => Math.max(value, run.score), 0);
                return (
                  <DestItem key={id}>
                    <DestTop>
                      <strong>{destination.name}</strong>
                      <span>{count} runs</span>
                    </DestTop>
                    <ProgressBar value={(count / maxRuns) * 100} color={destination.theme.accent} height={4} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 5 }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                        Best
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                        {best > 0 ? formatNumber(best) : '—'}
                      </span>
                    </div>
                  </DestItem>
                );
              })}
            </DestList>
          )}

          <div style={{ marginTop: 20 }}>
            <StatRow>
              <span>Clean finish rate</span>
              <strong style={{ fontSize: 18 }}>
                {stats.runs > 0 ? `${Math.round((stats.racesCompleted / stats.runs) * 100)}%` : '—'}
              </strong>
            </StatRow>
            <StatRow>
              <span>Coins per race</span>
              <strong style={{ fontSize: 18 }}>
                {stats.runs > 0 ? formatNumber(stats.coinsEarned / stats.runs) : '—'}
              </strong>
            </StatRow>
            <StatRow>
              <span>Avg. run time</span>
              <strong style={{ fontSize: 18 }}>
                {stats.runs > 0 ? formatDuration(stats.totalPlaytimeMs / stats.runs) : '—'}
              </strong>
            </StatRow>
          </div>
        </Panel>
      </Split>

      <div
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          flexWrap: 'wrap',
          padding: '18px 20px',
          border: '1px solid var(--line)',
          borderRadius: 6,
          background: 'rgba(255,255,255,.015)',
        }}
      >
        <div>
          <PanelLabel>Data storage</PanelLabel>
          <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 11 }}>
            Statistics are stored in your browser&apos;s local storage. Clearing site data will erase
            progress permanently.
          </p>
        </div>
        <ButtonLink href="/leaderboard" variant="secondary" size="sm">
          View local leaderboard
        </ButtonLink>
      </div>
    </PageShell>
  );
}

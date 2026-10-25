'use client';

import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Check,
  ChevronRight,
  Clock3,
  Coins,
  Flag,
  Gift,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Badge, Panel, PanelLabel, ProgressBar, SectionKicker } from '@/components/ui/Panel';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import {
  getLongTermProgress,
  useGameStore,
  type LongTermMission,
} from '@/lib/store/useGameStore';
import { LONG_TERM_MISSIONS } from '@/lib/data/missions';
import { useUiStore } from '@/lib/store/useUiStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { formatNumber } from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

const MissionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const Mission = styled(Panel)<{ $complete: boolean; $claimed: boolean }>`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-color: ${({ $complete, $claimed, theme }) =>
    $claimed
      ? theme.colors.line
      : $complete
        ? 'rgba(215,255,63,.45)'
        : theme.colors.line};
  background: ${({ $complete, $claimed }) =>
    $claimed
      ? 'rgba(255,255,255,.012)'
      : $complete
        ? 'linear-gradient(150deg, rgba(215,255,63,.07), rgba(255,255,255,.015))'
        : undefined};
  opacity: ${({ $claimed }) => ($claimed ? 0.62 : 1)};
`;

const MissionTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const MissionCopy = styled.div`
  min-width: 0;
  span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }
  strong {
    display: block;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 22px;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 0.01em;
  }
  p {
    margin-top: 7px;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.6;
  }
`;

const Reward = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--warning);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  padding: 7px 10px;
  border: 1px solid rgba(251, 191, 36, 0.25);
  background: rgba(251, 191, 36, 0.05);
  border-radius: 4px;
`;

const MissionFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: auto;
`;

const Timer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin: 40px 0 18px;
  flex-wrap: wrap;

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 26px;
    text-transform: uppercase;
    font-style: italic;
    line-height: 1;
  }
`;

const Summary = styled(Panel)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  padding: 0;
  overflow: hidden;
  background: var(--line);

  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const SummaryCell = styled.div`
  background: var(--panel);
  padding: 18px 20px;
  span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  strong {
    display: block;
    margin-top: 8px;
    font-family: var(--font-display);
    font-size: 28px;
    line-height: 1;
  }
  em {
    display: block;
    margin-top: 4px;
    color: var(--text-muted);
    font-style: normal;
    font-size: 10px;
  }
`;

function useMidnightCountdown() {
  const [remaining, setRemaining] = useState('—');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(`${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return remaining;
}

export default function MissionsPage() {
  const hydrated = useGameStore((state) => state.hydrated);
  const daily = useGameStore((state) => state.daily);
  const ensureDailyMissions = useGameStore((state) => state.ensureDailyMissions);
  const claimDailyMission = useGameStore((state) => state.claimDailyMission);
  const claimLongTermMission = useGameStore((state) => state.claimLongTermMission);
  const claimedLongTerm = useGameStore((state) => state.claimedLongTermMissions);
  const stats = useGameStore((state) => state.stats);
  const ownedCars = useGameStore((state) => state.ownedCars);
  const unlockedTrophies = useGameStore((state) => state.unlockedTrophies);
  const pushToast = useUiStore((state) => state.pushToast);
  const countdown = useMidnightCountdown();

  useEffect(() => {
    ensureDailyMissions();
  }, [ensureDailyMissions]);

  const longTermProgress = useMemo(
    () =>
      getLongTermProgress(stats, {
        carsOwned: ownedCars.length,
        customizations: stats.customizationChanges,
        trophyCount: Object.keys(unlockedTrophies).length,
      }),
    [stats, ownedCars.length, unlockedTrophies],
  );

  const completedDaily = daily.missions.filter((mission) => mission.progress >= mission.target).length;
  const claimedDaily = daily.missions.filter((mission) => mission.claimed).length;
  const claimableDaily = daily.missions.filter(
    (mission) => mission.progress >= mission.target && !mission.claimed,
  ).length;
  const claimableLong = LONG_TERM_MISSIONS.filter(
    (mission) =>
      !claimedLongTerm.includes(mission.id) &&
      (longTermProgress[mission.id] ?? 0) >= mission.target,
  ).length;

  const handleDaily = (id: string) => {
    const result = claimDailyMission(id);
    pushToast({
      kind: result.ok ? 'reward' : 'error',
      title: result.ok ? 'Mission reward claimed' : 'Unable to claim',
      message: result.message,
    });
    if (result.ok) getAudioManager().playCue('coin');
  };

  const handleLong = (mission: LongTermMission) => {
    const result = claimLongTermMission(mission.id);
    pushToast({
      kind: result.ok ? 'reward' : 'error',
      title: result.ok ? `${mission.name} complete` : 'Unable to claim',
      message: result.message,
    });
    if (result.ok) getAudioManager().playCue('coin');
  };

  return (
    <PageShell
      kicker="Objectives"
      title={
        <>
          Missions &amp; <em>paydays.</em>
        </>
      }
      intro="Daily objectives rotate at midnight and stack into long-term career goals. Rewards are paid once and saved to this device."
      actions={
        <>
          <Badge $tone={claimableDaily + claimableLong > 0 ? 'lime' : 'neutral'}>
            <Gift size={10} /> {claimableDaily + claimableLong} claimable
          </Badge>
          <ButtonLink href="/play" size="sm" icon={<Flag size={13} />}>
            Race
          </ButtonLink>
        </>
      }
    >
      <Summary>
        <SummaryCell>
          <span>
            <Target size={11} /> Daily progress
          </span>
          <strong>
            {completedDaily}
            <span style={{ fontSize: 15, color: 'var(--text-dim)' }}> / {daily.missions.length || 4}</span>
          </strong>
          <em>{claimedDaily} rewards banked</em>
        </SummaryCell>
        <SummaryCell>
          <span>
            <Sparkles size={11} /> Long-term
          </span>
          <strong>
            {claimedLongTerm.length}
            <span style={{ fontSize: 15, color: 'var(--text-dim)' }}> / {LONG_TERM_MISSIONS.length}</span>
          </strong>
          <em>{claimableLong} ready to claim</em>
        </SummaryCell>
        <SummaryCell>
          <span>
            <Clock3 size={11} /> Resets in
          </span>
          <strong style={{ fontSize: 24 }}>{countdown}</strong>
          <em>Local midnight · deterministic daily set</em>
        </SummaryCell>
      </Summary>

      <SectionHead>
        <div>
          <SectionKicker>Today's board</SectionKicker>
          <h2>Daily objectives</h2>
        </div>
        <Timer>
          <Clock3 size={11} /> Refreshes at midnight
        </Timer>
      </SectionHead>

      {!hydrated && daily.missions.length === 0 ? (
        <EmptyState icon={<Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />} title="Loading objectives" />
      ) : daily.missions.length === 0 ? (
        <EmptyState
          icon={<Target size={22} />}
          title="No missions generated"
          description="The daily board could not be generated. Reload the page or reset progress from Settings."
        />
      ) : (
        <MissionGrid>
          {daily.missions.map((mission) => {
            const complete = mission.progress >= mission.target;
            const percent = mission.target > 0 ? (mission.progress / mission.target) * 100 : 0;
            return (
              <Mission key={mission.id} $complete={complete} $claimed={mission.claimed}>
                <MissionTop>
                  <MissionCopy>
                    <span>
                      <Target size={10} /> {mission.metric.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <strong>{mission.title}</strong>
                    <p>{mission.description}</p>
                  </MissionCopy>
                  <Reward>
                    <Coins size={13} /> {formatNumber(mission.reward)}
                  </Reward>
                </MissionTop>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
                    <PanelLabel>Progress</PanelLabel>
                    <span style={{ color: complete ? 'var(--lime)' : 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(mission.progress)} / {formatNumber(mission.target)}
                    </span>
                  </div>
                  <ProgressBar value={percent} color={complete ? 'var(--lime)' : 'var(--info)'} height={5} />
                </div>
                <MissionFoot>
                  <Badge $tone={mission.claimed ? 'neutral' : complete ? 'lime' : 'info'}>
                    {mission.claimed ? (
                      <>
                        <Check size={9} /> Claimed
                      </>
                    ) : complete ? (
                      'Ready'
                    ) : (
                      'In progress'
                    )}
                  </Badge>
                  <Button
                    size="sm"
                    variant={complete && !mission.claimed ? 'primary' : 'dark'}
                    disabled={!complete || mission.claimed}
                    onClick={() => handleDaily(mission.id)}
                    icon={mission.claimed ? <Check size={12} /> : <Gift size={12} />}
                  >
                    {mission.claimed ? 'Banked' : `Claim ${formatNumber(mission.reward)}`}
                  </Button>
                </MissionFoot>
              </Mission>
            );
          })}
        </MissionGrid>
      )}

      <SectionHead>
        <div>
          <SectionKicker>Career objectives</SectionKicker>
          <h2>Long-term missions</h2>
        </div>
        <Timer>
          <ChevronRight size={11} /> Permanent progression
        </Timer>
      </SectionHead>

      <MissionGrid>
        {LONG_TERM_MISSIONS.map((mission) => {
          const progress = longTermProgress[mission.id] ?? 0;
          const complete = progress >= mission.target;
          const claimed = claimedLongTerm.includes(mission.id);
          const percent = mission.target > 0 ? (progress / mission.target) * 100 : 0;
          return (
            <Mission key={mission.id} $complete={complete} $claimed={claimed}>
              <MissionTop>
                <MissionCopy>
                  <span>
                    <Sparkles size={10} /> Career · {mission.metric.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <strong>{mission.name}</strong>
                  <p>{mission.description}</p>
                </MissionCopy>
                <Reward>
                  <Coins size={13} /> {formatNumber(mission.reward)}
                </Reward>
              </MissionTop>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
                  <PanelLabel>Progress</PanelLabel>
                  <span style={{ color: complete ? 'var(--lime)' : 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(progress)} / {formatNumber(mission.target)}
                  </span>
                </div>
                <ProgressBar value={percent} color={complete ? 'var(--lime)' : 'var(--purple)'} height={5} />
              </div>
              <MissionFoot>
                <Badge $tone={claimed ? 'neutral' : complete ? 'lime' : 'purple'}>
                  {claimed ? (
                    <>
                      <Check size={9} /> Claimed
                    </>
                  ) : complete ? (
                    'Ready'
                  ) : (
                    'In progress'
                  )}
                </Badge>
                <Button
                  size="sm"
                  variant={complete && !claimed ? 'primary' : 'dark'}
                  disabled={!complete || claimed}
                  onClick={() => handleLong(mission)}
                  icon={claimed ? <Check size={12} /> : <Gift size={12} />}
                >
                  {claimed ? 'Banked' : `Claim ${formatNumber(mission.reward)}`}
                </Button>
              </MissionFoot>
            </Mission>
          );
        })}
      </MissionGrid>
    </PageShell>
  );
}

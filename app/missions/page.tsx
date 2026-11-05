'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import {
  ArrowLeft,
  Check,
  Clock,
  Coins,
  Flag,
  Gift,
  ListChecks,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
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

const CurrencyPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  background: rgba(10, 14, 18, 0.82);
  color: var(--warning);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  font-weight: 800;
`;

const TabRow = styled.div`
  display: flex;
  gap: 6px;
  background: rgba(10, 14, 18, 0.6);
  padding: 4px;
  border-radius: 5px;
  border: 1px solid var(--line);
  width: fit-content;
`;

const TabBtn = styled.button<{ $active: boolean }>`
  padding: 8px 14px;
  border-radius: 4px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(215,255,63,.14)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 11px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
`;

const MissionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const MissionCard = styled.div<{ $completed: boolean; $claimed: boolean }>`
  padding: 16px;
  border-radius: 5px;
  border: 1px solid
    ${({ $claimed, $completed, theme }) =>
      $claimed ? 'var(--line)' : $completed ? theme.colors.lime : 'var(--line-strong)'};
  background: ${({ $claimed, $completed }) =>
    $claimed
      ? 'rgba(10, 14, 18, 0.5)'
      : $completed
        ? 'linear-gradient(150deg, rgba(215,255,63,.09), rgba(10, 14, 18, 0.9))'
        : 'rgba(8, 12, 16, 0.85)'};
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: ${({ $claimed }) => ($claimed ? 0.65 : 1)};
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  .info {
    span {
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--lime);
    }
    strong {
      display: block;
      margin-top: 3px;
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 15px;
      font-style: italic;
      font-weight: 800;
      text-transform: uppercase;
    }
    p {
      margin-top: 4px;
      font-size: 10px;
      color: var(--text-muted);
      line-height: 1.5;
    }
  }

  .reward {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 3px;
    border: 1px solid rgba(251, 191, 36, 0.3);
    background: rgba(251, 191, 36, 0.08);
    color: var(--warning);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }
`;

const ProgressTrack = styled.div`
  .bar-top {
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    font-weight: 800;
    color: var(--text-dim);
    margin-bottom: 4px;
    font-family: ${({ theme }) => theme.fonts.mono};
  }

  .track {
    height: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    border-radius: inherit;
    background: var(--lime);
    box-shadow: 0 0 6px rgba(215, 255, 63, 0.4);
    transition: width 0.3s ease;
  }
`;

const ClaimBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: none;
  background: var(--lime);
  color: #07090b;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 12px;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #e6ff66;
    transform: translateY(-1px);
  }
`;

export default function MissionsPage() {
  const [tab, setTab] = useState<'daily' | 'career'>('daily');

  const coins = useGameStore((state) => state.coins);
  const daily = useGameStore((state) => state.daily);
  const stats = useGameStore((state) => state.stats);
  const ownedCars = useGameStore((state) => state.ownedCars);
  const unlockedTrophies = useGameStore((state) => state.unlockedTrophies);
  const claimedLongTerm = useGameStore((state) => state.claimedLongTermMissions);
  const claimDailyMission = useGameStore((state) => state.claimDailyMission);
  const claimLongTermMission = useGameStore((state) => state.claimLongTermMission);
  const pushToast = useUiStore((state) => state.pushToast);

  const careerProgress = useMemo(() => {
    const extras = {
      carsOwned: ownedCars.length,
      customizations: stats.customizationChanges,
      trophyCount: Object.keys(unlockedTrophies).length,
    };
    return getLongTermProgress(stats, extras);
  }, [stats, ownedCars, unlockedTrophies]);

  const handleClaimDaily = (id: string, reward: number) => {
    claimDailyMission(id);
    getAudioManager().playCue('purchase');
    pushToast({ kind: 'reward', title: 'Reward Claimed', message: `+${formatNumber(reward)} Coins banked.` });
  };

  const handleClaimCareer = (id: string, reward: number) => {
    claimLongTermMission(id);
    getAudioManager().playCue('purchase');
    pushToast({ kind: 'reward', title: 'Milestone Claimed', message: `+${formatNumber(reward)} Coins banked.` });
  };

  return (
    <Stage>
      <ContentWrap>
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <HeaderTitle>
            <span>OPERATIONAL CONTRACTS</span>
            <h1>
              Mission <em>Terminal</em>
            </h1>
          </HeaderTitle>

          <CurrencyPill>
            <Coins size={14} /> {formatNumber(coins)} COINS
          </CurrencyPill>
        </TopNav>

        <TabRow>
          <TabBtn type="button" $active={tab === 'daily'} onClick={() => setTab('daily')}>
            <Clock size={12} /> Daily Contracts ({daily.missions.filter((m) => m.progress >= m.target && !m.claimed).length} Ready)
          </TabBtn>
          <TabBtn type="button" $active={tab === 'career'} onClick={() => setTab('career')}>
            <Target size={12} /> Career Milestones
          </TabBtn>
        </TabRow>

        {tab === 'daily' && (
          <MissionGrid>
            {daily.missions.map((m) => {
              const completed = m.progress >= m.target;
              const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
              return (
                <MissionCard key={m.id} $completed={completed} $claimed={m.claimed}>
                  <CardTop>
                    <div className="info">
                      <span>DAILY CONTRACT</span>
                      <strong>{m.title}</strong>
                      <p>{m.description}</p>
                    </div>
                    <div className="reward">
                      <Coins size={12} /> +{formatNumber(m.reward)}
                    </div>
                  </CardTop>

                  <ProgressTrack>
                    <div className="bar-top">
                      <span>PROGRESS</span>
                      <span>
                        {formatNumber(m.progress)} / {formatNumber(m.target)} ({pct}%)
                      </span>
                    </div>
                    <div className="track">
                      <div className="fill" style={{ width: `${pct}%` }} />
                    </div>
                  </ProgressTrack>

                  {completed && !m.claimed && (
                    <ClaimBtn type="button" onClick={() => handleClaimDaily(m.id, m.reward)}>
                      <Gift size={14} /> Claim Reward
                    </ClaimBtn>
                  )}
                </MissionCard>
              );
            })}
          </MissionGrid>
        )}

        {tab === 'career' && (
          <MissionGrid>
            {LONG_TERM_MISSIONS.map((m) => {
              const current = careerProgress[m.id] ?? 0;
              const completed = current >= m.target;
              const claimed = claimedLongTerm.includes(m.id);
              const pct = Math.min(100, Math.round((current / m.target) * 100));
              return (
                <MissionCard key={m.id} $completed={completed} $claimed={claimed}>
                  <CardTop>
                    <div className="info">
                      <span>CAREER MILESTONE</span>
                      <strong>{m.name}</strong>
                      <p>{m.description}</p>
                    </div>
                    <div className="reward">
                      <Coins size={12} /> +{formatNumber(m.reward)}
                    </div>
                  </CardTop>

                  <ProgressTrack>
                    <div className="bar-top">
                      <span>PROGRESS</span>
                      <span>
                        {formatNumber(current)} / {formatNumber(m.target)} ({pct}%)
                      </span>
                    </div>
                    <div className="track">
                      <div className="fill" style={{ width: `${pct}%` }} />
                    </div>
                  </ProgressTrack>

                  {completed && !claimed && (
                    <ClaimBtn type="button" onClick={() => handleClaimCareer(m.id, m.reward)}>
                      <Gift size={14} /> Claim Milestone
                    </ClaimBtn>
                  )}
                </MissionCard>
              );
            })}
          </MissionGrid>
        )}
      </ContentWrap>
    </Stage>
  );
}

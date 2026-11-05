'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import {
  ArrowLeft,
  Award,
  Check,
  Coins,
  Crown,
  Lock,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  TROPHIES,
  TROPHY_TIERS,
  TROPHY_TIER_META,
  formatTrophyRequirement,
  trophyProgress,
} from '@/lib/data/trophies';
import { getTrophyExtras, useGameStore } from '@/lib/store/useGameStore';
import { formatDate, formatNumber } from '@/lib/ui/format';
import type { TrophyTier } from '@/lib/types';
import { media } from '@/lib/ui/theme';

type Filter = 'all' | TrophyTier | 'locked' | 'unlocked';

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

const OverviewBanner = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(8, 12, 16, 0.88);
  backdrop-filter: blur(14px);

  ${media.mobile} {
    grid-template-columns: 1fr;
    text-align: center;
    justify-items: center;
  }
`;

const ProgressRing = styled.div<{ $pct: number }>`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at center, #080c10 60%, transparent 61%),
    conic-gradient(var(--lime) 0 ${({ $pct }) => $pct}%, rgba(255, 255, 255, 0.08) ${({ $pct }) => $pct}% 100%);
  box-shadow: 0 0 25px rgba(215, 255, 63, 0.15);

  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 22px;
    font-weight: 800;
    color: var(--text);
  }
`;

const OverviewText = styled.div`
  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 20px;
    font-style: italic;
    font-weight: 800;
    text-transform: uppercase;
  }
  p {
    margin-top: 4px;
    color: var(--text-muted);
    font-size: 11px;
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  padding: 7px 12px;
  border-radius: 3px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'var(--line)')};
  background: ${({ $active }) => ($active ? 'rgba(215,255,63,.14)' : 'rgba(10, 14, 18, 0.6)')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 10px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
`;

const TrophyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const TrophyCard = styled.div<{ $tier: TrophyTier; $unlocked: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 5px;
  border: 1px solid
    ${({ $unlocked, $tier }) =>
      $unlocked ? `${TROPHY_TIER_META[$tier].color}66` : 'var(--line)'};
  background: ${({ $unlocked, $tier }) =>
    $unlocked
      ? `linear-gradient(150deg, ${TROPHY_TIER_META[$tier].color}14, rgba(10, 14, 18, 0.9))`
      : 'rgba(8, 12, 16, 0.7)'};
  opacity: ${({ $unlocked }) => ($unlocked ? 1 : 0.5)};
  transition: all 0.15s ease;

  .badge-icon {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 1px solid ${({ $tier }) => `${TROPHY_TIER_META[$tier].color}88`};
    background: ${({ $tier }) => `${TROPHY_TIER_META[$tier].color}18`};
    color: ${({ $tier }) => TROPHY_TIER_META[$tier].color};
  }

  .details {
    flex: 1;
    min-width: 0;

    .tier-tag {
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${({ $tier }) => TROPHY_TIER_META[$tier].color};
    }

    strong {
      display: block;
      margin-top: 2px;
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 14px;
      font-style: italic;
      font-weight: 800;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    p {
      margin-top: 3px;
      font-size: 9px;
      color: var(--text-muted);
      line-height: 1.4;
    }
  }

  .reward-block {
    flex: 0 0 auto;
    text-align: right;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--warning);
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 10px;
      font-weight: 800;
    }

    small {
      display: block;
      margin-top: 3px;
      font-size: 7px;
      color: var(--text-dim);
      text-transform: uppercase;
    }
  }
`;

export default function TrophiesPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const stats = useGameStore((state) => state.stats);
  const unlocked = useGameStore((state) => state.unlockedTrophies);
  const ownedCars = useGameStore((state) => state.ownedCars);
  const extras = useMemo(() => getTrophyExtras(stats, ownedCars, unlocked), [stats, ownedCars, unlocked]);

  const totalCount = TROPHIES.length;
  const unlockedCount = Object.keys(unlocked).length;
  const pct = Math.round((unlockedCount / totalCount) * 100);

  const filtered = useMemo(() => {
    return TROPHIES.filter((t) => {
      const isUn = Boolean(unlocked[t.id]);
      if (filter === 'all') return true;
      if (filter === 'unlocked') return isUn;
      if (filter === 'locked') return !isUn;
      return t.tier === filter;
    });
  }, [filter, unlocked]);

  return (
    <Stage>
      <ContentWrap>
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <HeaderTitle>
            <span>HALL OF ACCOMPLISHMENTS</span>
            <h1>
              Trophy <em>Showcase</em>
            </h1>
          </HeaderTitle>

          <div style={{ width: 40 }} />
        </TopNav>

        <OverviewBanner>
          <ProgressRing $pct={pct}>
            <strong>{pct}%</strong>
          </ProgressRing>
          <OverviewText>
            <h2>
              {unlockedCount} of {totalCount} Trophies Mastered
            </h2>
            <p>Complete precision driving milestones to earn coins and status.</p>
          </OverviewText>
        </OverviewBanner>

        <FilterRow>
          {(['all', 'unlocked', 'locked', 'bronze', 'silver', 'gold', 'platinum'] as Filter[]).map((f) => (
            <FilterBtn key={f} type="button" $active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </FilterBtn>
          ))}
        </FilterRow>

        <TrophyGrid>
          {filtered.map((t) => {
            const isUn = Boolean(unlocked[t.id]);
            return (
              <TrophyCard key={t.id} $tier={t.tier} $unlocked={isUn}>
                <div className="badge-icon">
                  {isUn ? <Trophy size={18} /> : <Lock size={16} />}
                </div>

                <div className="details">
                  <span className="tier-tag">{t.tier} Tier</span>
                  <strong>{t.name}</strong>
                  <p>{t.description}</p>
                </div>

                <div className="reward-block">
                  <span>
                    <Coins size={11} /> +{formatNumber(t.reward)}
                  </span>
                  <small>{isUn ? 'COMPLETED' : 'LOCKED'}</small>
                </div>
              </TrophyCard>
            );
          })}
        </TrophyGrid>
      </ContentWrap>
    </Stage>
  );
}

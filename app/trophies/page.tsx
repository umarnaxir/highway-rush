'use client';

import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'motion/react';
import { Award, Check, Coins, Crown, Lock, Medal, Sparkles, Trophy } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Badge, Panel, PanelLabel, ProgressBar, SectionKicker } from '@/components/ui/Panel';
import { ButtonLink } from '@/components/ui/Button';
import { TROPHIES, TROPHY_TIERS, TROPHY_TIER_META, formatTrophyRequirement, trophyProgress } from '@/lib/data/trophies';
import { getTrophyExtras, useGameStore } from '@/lib/store/useGameStore';
import { formatDate, formatNumber } from '@/lib/ui/format';
import type { TrophyTier } from '@/lib/types';
import { media } from '@/lib/ui/theme';

type Filter = 'all' | TrophyTier | 'locked' | 'unlocked';

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 4px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.18);
  border-radius: 5px;
  width: fit-content;
  max-width: 100%;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: ${({ $active, theme }) => ($active ? theme.colors.lime : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.limeInk : theme.colors.textMuted)};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.15s ease;

  &:hover {
    color: ${({ $active, theme }) => ($active ? theme.colors.limeInk : theme.colors.text)};
  }
`;

const Hero = styled(Panel)`
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 28px;
  align-items: center;
  padding: clamp(24px, 4vw, 38px);

  ${media.mobile} {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
`;

const Ring = styled.div<{ $percent: number }>`
  width: 168px;
  height: 168px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at center, var(--panel) 61%, transparent 62%),
    conic-gradient(var(--lime) 0 ${({ $percent }) => $percent}%, rgba(255, 255, 255, 0.08) ${({ $percent }) => $percent}% 100%);
  box-shadow: 0 0 40px rgba(215, 255, 63, 0.08);

  div {
    text-align: center;
  }
  strong {
    display: block;
    font-family: var(--font-display);
    font-size: 42px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  span {
    display: block;
    margin-top: 5px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
`;

const HeroCopy = styled.div`
  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(28px, 4vw, 46px);
    text-transform: uppercase;
    font-style: italic;
    line-height: 0.95;
    letter-spacing: -0.01em;
  }
  p {
    margin-top: 12px;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.7;
    max-width: 620px;
  }
`;

const TierRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
`;

const TierChip = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border: 1px solid color-mix(in srgb, ${({ $color }) => $color} 32%, transparent);
  background: color-mix(in srgb, ${({ $color }) => $color} 7%, transparent);
  border-radius: 3px;
  color: ${({ $color }) => $color};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  b {
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 10px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(Panel)<{ $unlocked: boolean; $tierColor: string }>`
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-color: ${({ $unlocked, $tierColor }) =>
    $unlocked ? `color-mix(in srgb, ${$tierColor} 40%, transparent)` : undefined};
  background: ${({ $unlocked, $tierColor }) =>
    $unlocked ? `linear-gradient(155deg, color-mix(in srgb, ${$tierColor} 8%, transparent), transparent 65%)` : undefined};
  opacity: ${({ $unlocked }) => ($unlocked ? 1 : 0.82)};

  &::before {
    background: radial-gradient(
      420px circle at 20% 0%,
      color-mix(in srgb, ${({ $tierColor }) => $tierColor} 12%, transparent),
      transparent 55%
    );
  }
`;

const MotionCard = motion.create(Card);

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 13px;
`;

const TierIcon = styled.div<{ $color: string; $unlocked: boolean }>`
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid ${({ $color }) => `color-mix(in srgb, ${$color} 45%, transparent)`};
  background: ${({ $color, $unlocked }) =>
    $unlocked ? `color-mix(in srgb, ${$color} 14%, transparent)` : 'rgba(255,255,255,.02)'};
  color: ${({ $color, $unlocked }) => ($unlocked ? $color : 'var(--text-dim)')};
  box-shadow: ${({ $unlocked, $color }) => ($unlocked ? `0 0 22px color-mix(in srgb, ${$color} 22%, transparent)` : 'none')};
`;

const CardCopy = styled.div`
  min-width: 0;
  flex: 1;
  span {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  strong {
    display: block;
    margin-top: 5px;
    font-family: var(--font-display);
    font-size: 20px;
    line-height: 1;
    text-transform: uppercase;
  }
`;

const Description = styled.p`
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;
  min-height: 35px;
`;

const CardFoot = styled.div`
  margin-top: auto;
`;

const BottomLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  color: var(--text-dim);
  font-size: 9px;
  font-weight: 700;
`;

export default function TrophiesPage() {
  const stats = useGameStore((state) => state.stats);
  const ownedCars = useGameStore((state) => state.ownedCars);
  const unlocked = useGameStore((state) => state.unlockedTrophies);
  const [filter, setFilter] = useState<Filter>('all');

  const trophyCount = Object.keys(unlocked).length;
  const extras = useMemo(
    () => getTrophyExtras(stats, ownedCars, unlocked),
    [stats, ownedCars, unlocked],
  );

  const tierCounts = useMemo(() => {
    const counts: Record<TrophyTier, { total: number; unlocked: number }> = {
      bronze: { total: 0, unlocked: 0 },
      silver: { total: 0, unlocked: 0 },
      gold: { total: 0, unlocked: 0 },
      platinum: { total: 0, unlocked: 0 },
    };
    TROPHIES.forEach((trophy) => {
      counts[trophy.tier].total += 1;
      if (unlocked[trophy.id]) counts[trophy.tier].unlocked += 1;
    });
    return counts;
  }, [unlocked]);

  const visible = TROPHIES.filter((trophy) => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return Boolean(unlocked[trophy.id]);
    if (filter === 'locked') return !unlocked[trophy.id];
    return trophy.tier === filter;
  });
  const completion = TROPHIES.length > 0 ? (trophyCount / TROPHIES.length) * 100 : 0;

  return (
    <PageShell
      kicker="Trophy room"
      title={
        <>
          Prove the <em>mile.</em>
        </>
      }
      intro="Bronze, silver, gold and platinum objectives across every discipline. Trophies pay coins automatically the moment they are earned."
      actions={
        <Badge $tone="warning">
          <Coins size={10} /> Rewards paid instantly
        </Badge>
      }
      wide
    >
      <Hero $glow>
        <Ring $percent={completion}>
          <div>
            <strong>
              {trophyCount}
              <span style={{ display: 'inline', fontSize: 16, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                /{TROPHIES.length}
              </span>
            </strong>
            <span>Trophies earned</span>
          </div>
        </Ring>
        <HeroCopy>
          <SectionKicker>Collection status</SectionKicker>
          <h2>
            {completion >= 100 ? 'The shelf is full.' : completion > 50 ? 'Halfway to legend.' : 'Every legend starts somewhere.'}
          </h2>
          <p>
            {completion >= 100
              ? 'Every objective is complete. The highway has nothing left to prove — except a faster time.'
              : `${Math.round(completion)}% complete. ${TROPHIES.length - trophyCount} objectives remain across distance, speed, drift, nitro, crashes, cars and destinations.`}
          </p>
          <TierRow>
            {TROPHY_TIERS.map((tier) => {
              const meta = TROPHY_TIER_META[tier];
              return (
                <TierChip key={tier} $color={meta.color}>
                  {tier === 'bronze' && <Medal size={12} />}
                  {tier === 'silver' && <Award size={12} />}
                  {tier === 'gold' && <Trophy size={12} />}
                  {tier === 'platinum' && <Crown size={12} />}
                  {meta.label} <b>{tierCounts[tier].unlocked}/{tierCounts[tier].total}</b>
                </TierChip>
              );
            })}
          </TierRow>
        </HeroCopy>
      </Hero>

      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filters>
          {(['all', 'bronze', 'silver', 'gold', 'platinum', 'unlocked', 'locked'] as Filter[]).map((value) => (
            <FilterButton key={value} $active={filter === value} onClick={() => setFilter(value)}>
              {value === 'all' ? `All ${TROPHIES.length}` : value}
            </FilterButton>
          ))}
        </Filters>
        <ButtonLink href="/missions" variant="secondary" size="sm" iconRight={<Sparkles size={13} />}>
          Bonus objectives
        </ButtonLink>
      </div>

      <Grid>
        {visible.map((trophy) => {
          const meta = TROPHY_TIER_META[trophy.tier];
          const isUnlocked = Boolean(unlocked[trophy.id]);
          const progress = trophyProgress(trophy, stats, extras);
          const percent = trophy.target > 0 ? Math.min(100, (progress / trophy.target) * 100) : 0;
          return (
            <MotionCard
              key={trophy.id}
              $unlocked={isUnlocked}
              $tierColor={meta.color}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              <CardTop>
                <TierIcon $color={meta.color} $unlocked={isUnlocked}>
                  {isUnlocked ? <Check size={17} /> : <Lock size={15} />}
                </TierIcon>
                <CardCopy>
                  <span>
                    {isUnlocked ? meta.label : `${meta.label} objective`}
                    {isUnlocked && <Badge $tone="lime">Unlocked</Badge>}
                  </span>
                  <strong>{trophy.name}</strong>
                </CardCopy>
              </CardTop>
              <Description>{trophy.description}</Description>
              <CardFoot>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <PanelLabel>{formatTrophyRequirement(trophy)}</PanelLabel>
                  <span style={{ color: isUnlocked ? 'var(--lime)' : 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(Math.min(progress, trophy.target))}/{formatNumber(trophy.target)}
                  </span>
                </div>
                <ProgressBar value={percent} color={isUnlocked ? 'var(--lime)' : meta.color} height={4} />
                <BottomLine>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Coins size={10} /> {formatNumber(trophy.reward)} reward
                  </span>
                  <span>{isUnlocked ? `Earned ${formatDate(unlocked[trophy.id])}` : 'In progress'}</span>
                </BottomLine>
              </CardFoot>
            </MotionCard>
          );
        })}
      </Grid>
    </PageShell>
  );
}

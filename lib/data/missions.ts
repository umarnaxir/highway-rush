import type { DailyMissionProgress, LongTermMission, TrophyMetric } from '@/lib/types';

interface DailyTemplate {
  id: string;
  title: string;
  description: string;
  metric: TrophyMetric;
  targets: [number, number, number];
  reward: number;
}

const DAILY_TEMPLATES: DailyTemplate[] = [
  {
    id: 'daily-coins',
    title: 'Coin Run',
    description: 'Collect {target} coins.',
    metric: 'coins',
    targets: [30, 60, 100],
    reward: 250,
  },
  {
    id: 'daily-near-miss',
    title: 'Paint Trade',
    description: 'Record {target} near misses.',
    metric: 'nearMisses',
    targets: [8, 15, 25],
    reward: 300,
  },
  {
    id: 'daily-distance',
    title: 'Distance Duty',
    description: 'Drive a cumulative {target} metres today.',
    metric: 'distance',
    targets: [2500, 5000, 8000],
    reward: 350,
  },
  {
    id: 'daily-drift',
    title: 'Slide Session',
    description: 'Drift a cumulative {target} metres today.',
    metric: 'driftDistance',
    targets: [250, 500, 900],
    reward: 300,
  },
  {
    id: 'daily-nitro',
    title: 'Bottle It Up',
    description: 'Fire nitro {target} times.',
    metric: 'nitroUses',
    targets: [10, 20, 35],
    reward: 250,
  },
  {
    id: 'daily-checkpoint',
    title: 'Gate Crasher',
    description: 'Pass {target} checkpoints.',
    metric: 'checkpoints',
    targets: [3, 6, 10],
    reward: 300,
  },
  {
    id: 'daily-races',
    title: 'Grid Regular',
    description: 'Finish {target} runs.',
    metric: 'races',
    targets: [2, 3, 5],
    reward: 400,
  },
  {
    id: 'daily-speed',
    title: 'Speed Check',
    description: 'Hit {target} km/h in a single run.',
    metric: 'topSpeed',
    targets: [220, 260, 300],
    reward: 350,
  },
];

const LONG_TERM: LongTermMission[] = [
  {
    id: 'lt-distance-1',
    name: 'Route Master',
    description: 'Drive a total of 25,000 metres.',
    metric: 'distance',
    target: 25000,
    reward: 1500,
  },
  {
    id: 'lt-near-miss-1',
    name: 'Traffic Whisperer',
    description: 'Record 75 near misses.',
    metric: 'nearMisses',
    target: 75,
    reward: 1200,
  },
  {
    id: 'lt-speed-1',
    name: 'Triple Ton',
    description: 'Reach 300 km/h in any car.',
    metric: 'topSpeed',
    target: 300,
    reward: 1500,
  },
  {
    id: 'lt-drift-1',
    name: 'Tyre Fund',
    description: 'Drift a total of 2,000 metres.',
    metric: 'driftDistance',
    target: 2000,
    reward: 1300,
  },
  {
    id: 'lt-checkpoint-1',
    name: 'Checkpoint Circuit',
    description: 'Pass 30 checkpoints.',
    metric: 'checkpoints',
    target: 30,
    reward: 1200,
  },
  {
    id: 'lt-garage-1',
    name: 'Build Program',
    description: 'Own 4 cars.',
    metric: 'carsOwned',
    target: 4,
    reward: 2000,
  },
  {
    id: 'lt-races-1',
    name: 'Season Regular',
    description: 'Complete 25 runs.',
    metric: 'races',
    target: 25,
    reward: 2500,
  },
  {
    id: 'lt-score-1',
    name: 'Point Break',
    description: 'Set a personal best score above 100,000.',
    metric: 'score',
    target: 100000,
    reward: 2500,
  },
  {
    id: 'lt-coins-1',
    name: 'Treasury Run',
    description: 'Collect 2,000 coins.',
    metric: 'coins',
    target: 2000,
    reward: 1800,
  },
  {
    id: 'lt-trophies-1',
    name: 'Silver Shelf',
    description: 'Unlock 12 trophies.',
    metric: 'trophies',
    target: 12,
    reward: 3000,
  },
];

export const LONG_TERM_MISSIONS = LONG_TERM;
export const DAILY_MISSION_COUNT = 4;

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTodayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateDailyMissions(date = getTodayKey()): DailyMissionProgress[] {
  const random = mulberry32(hashString(`highway-rush:${date}`));
  const pool = [...DAILY_TEMPLATES];
  const chosen: DailyTemplate[] = [];
  while (chosen.length < DAILY_MISSION_COUNT && pool.length) {
    const index = Math.floor(random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen.map((template, index) => {
    const tierIndex = Math.min(2, Math.floor(random() * 3));
    const target = template.targets[tierIndex];
    return {
      id: `${date}:${template.id}`,
      templateId: template.id,
      title: template.title,
      description: template.description.replace('{target}', target.toLocaleString()),
      metric: template.metric,
      target,
      reward: template.reward + tierIndex * 75 + index * 10,
      progress: 0,
      claimed: false,
    };
  });
}

export function missionProgressValue(
  metric: TrophyMetric,
  run: {
    coins: number;
    nearMisses: number;
    distanceM: number;
    driftDistanceM: number;
    nitroUses: number;
    checkpoints: number;
    topSpeedKph: number;
  },
  runsCompleted: number,
): number {
  switch (metric) {
    case 'coins':
      return run.coins;
    case 'nearMisses':
      return run.nearMisses;
    case 'distance':
      return run.distanceM;
    case 'driftDistance':
      return run.driftDistanceM;
    case 'nitroUses':
      return run.nitroUses;
    case 'checkpoints':
      return run.checkpoints;
    case 'races':
      return runsCompleted;
    case 'topSpeed':
      return run.topSpeedKph;
    default:
      return 0;
  }
}

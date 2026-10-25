import type { TrophyDefinition, TrophyMetric, TrophyTier } from '@/lib/types';

export const TROPHY_TIERS: TrophyTier[] = ['bronze', 'silver', 'gold', 'platinum'];

export const TROPHY_TIER_META: Record<
  TrophyTier,
  { label: string; color: string; glow: string; rank: number }
> = {
  bronze: { label: 'Bronze', color: '#c98a5b', glow: 'rgba(201,138,91,.35)', rank: 1 },
  silver: { label: 'Silver', color: '#cbd5e1', glow: 'rgba(203,213,225,.3)', rank: 2 },
  gold: { label: 'Gold', color: '#fbbf24', glow: 'rgba(251,191,36,.35)', rank: 3 },
  platinum: { label: 'Platinum', color: '#d7ff3f', glow: 'rgba(215,255,63,.4)', rank: 4 },
};

export const TROPHIES: TrophyDefinition[] = [
  {
    id: 'first-drive',
    name: 'First Drive',
    description: 'Complete your very first run on the highway.',
    tier: 'bronze',
    metric: 'races',
    target: 1,
    reward: 100,
  },
  {
    id: 'open-road',
    name: 'Open Road',
    description: 'Drive a cumulative 2,000 metres.',
    tier: 'bronze',
    metric: 'distance',
    target: 2000,
    reward: 150,
  },
  {
    id: 'long-hauler',
    name: 'Long Hauler',
    description: 'Drive a cumulative 15,000 metres.',
    tier: 'silver',
    metric: 'distance',
    target: 15000,
    reward: 400,
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    description: 'Drive a cumulative 75,000 metres.',
    tier: 'gold',
    metric: 'distance',
    target: 75000,
    reward: 1200,
  },
  {
    id: 'century',
    name: 'Highway Century',
    description: 'Drive a cumulative 250,000 metres.',
    tier: 'platinum',
    metric: 'distance',
    target: 250000,
    reward: 5000,
  },
  {
    id: 'coin-purse',
    name: 'Loose Change',
    description: 'Collect 100 coins across all runs.',
    tier: 'bronze',
    metric: 'coins',
    target: 100,
    reward: 100,
  },
  {
    id: 'coin-bank',
    name: 'Highway Bank',
    description: 'Collect 1,000 coins across all runs.',
    tier: 'silver',
    metric: 'coins',
    target: 1000,
    reward: 500,
  },
  {
    id: 'coin-mint',
    name: 'The Mint',
    description: 'Collect 5,000 coins across all runs.',
    tier: 'gold',
    metric: 'coins',
    target: 5000,
    reward: 1500,
  },
  {
    id: 'near-miss-rookie',
    name: 'Close Call',
    description: 'Record 10 near misses.',
    tier: 'bronze',
    metric: 'nearMisses',
    target: 10,
    reward: 100,
  },
  {
    id: 'needle',
    name: 'Threading The Needle',
    description: 'Record 100 near misses.',
    tier: 'gold',
    metric: 'nearMisses',
    target: 100,
    reward: 900,
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Reach 200 km/h.',
    tier: 'bronze',
    metric: 'topSpeed',
    target: 200,
    reward: 150,
  },
  {
    id: 'autobahn',
    name: 'Autobahn Legend',
    description: 'Reach 320 km/h.',
    tier: 'gold',
    metric: 'topSpeed',
    target: 320,
    reward: 1000,
  },
  {
    id: 'drift-rookie',
    name: 'Sideways',
    description: 'Drift a cumulative 500 metres.',
    tier: 'bronze',
    metric: 'driftDistance',
    target: 500,
    reward: 150,
  },
  {
    id: 'drift-king',
    name: 'Drift King',
    description: 'Drift a cumulative 5,000 metres.',
    tier: 'gold',
    metric: 'driftDistance',
    target: 5000,
    reward: 1000,
  },
  {
    id: 'nitro-rookie',
    name: 'Bottle Rocket',
    description: 'Activate nitro 25 times.',
    tier: 'bronze',
    metric: 'nitroUses',
    target: 25,
    reward: 100,
  },
  {
    id: 'nitro-addict',
    name: 'Nitro Addict',
    description: 'Activate nitro 250 times.',
    tier: 'gold',
    metric: 'nitroUses',
    target: 250,
    reward: 1200,
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Complete a 1,500 m crash-free streak.',
    tier: 'silver',
    metric: 'crashFree',
    target: 1500,
    reward: 350,
  },
  {
    id: 'iron-nerves',
    name: 'Iron Nerves',
    description: 'Complete a 5,000 m crash-free streak.',
    tier: 'gold',
    metric: 'crashFree',
    target: 5000,
    reward: 1000,
  },
  {
    id: 'checkpoint-hunter',
    name: 'Checkpoint Hunter',
    description: 'Pass 20 checkpoints.',
    tier: 'silver',
    metric: 'checkpoints',
    target: 20,
    reward: 350,
  },
  {
    id: 'checkpoint-legend',
    name: 'Checkpoint Legend',
    description: 'Pass 100 checkpoints.',
    tier: 'gold',
    metric: 'checkpoints',
    target: 100,
    reward: 1100,
  },
  {
    id: 'racer',
    name: 'Racer',
    description: 'Complete 10 runs.',
    tier: 'silver',
    metric: 'races',
    target: 10,
    reward: 300,
  },
  {
    id: 'veteran',
    name: 'Highway Veteran',
    description: 'Complete 50 runs.',
    tier: 'gold',
    metric: 'races',
    target: 50,
    reward: 1400,
  },
  {
    id: 'score-hunter',
    name: 'Score Hunter',
    description: 'Set a personal best score of 50,000.',
    tier: 'silver',
    metric: 'score',
    target: 50000,
    reward: 400,
  },
  {
    id: 'score-legend',
    name: 'Score Legend',
    description: 'Set a personal best score of 250,000.',
    tier: 'platinum',
    metric: 'score',
    target: 250000,
    reward: 4000,
  },
  {
    id: 'garage-starter',
    name: 'Garage Starter',
    description: 'Own 3 cars.',
    tier: 'silver',
    metric: 'carsOwned',
    target: 3,
    reward: 350,
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Own every car in the game.',
    tier: 'platinum',
    metric: 'carsOwned',
    target: 8,
    reward: 6000,
  },
  {
    id: 'stylist',
    name: 'Style Icon',
    description: 'Customise your cars 10 times.',
    tier: 'bronze',
    metric: 'customizations',
    target: 10,
    reward: 150,
  },
  {
    id: 'mountain-master',
    name: 'Mountain Master',
    description: 'Complete 5 runs on Mountain Highway.',
    tier: 'silver',
    metric: 'destinationRaces',
    target: 5,
    destinationId: 'mountain-highway',
    reward: 400,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete 5 runs in City Night.',
    tier: 'silver',
    metric: 'destinationRaces',
    target: 5,
    destinationId: 'city-night',
    reward: 400,
  },
  {
    id: 'desert-nomad',
    name: 'Desert Nomad',
    description: 'Complete 5 runs on Desert Highway.',
    tier: 'silver',
    metric: 'destinationRaces',
    target: 5,
    destinationId: 'desert-highway',
    reward: 400,
  },
  {
    id: 'neon-legend',
    name: 'Neon Legend',
    description: 'Complete 5 runs in Neon City.',
    tier: 'platinum',
    metric: 'destinationRaces',
    target: 5,
    destinationId: 'neon-city',
    reward: 1800,
  },
  {
    id: 'highway-legend',
    name: 'Highway Legend',
    description: 'Unlock 25 other trophies.',
    tier: 'platinum',
    metric: 'trophies',
    target: 25,
    reward: 8000,
  },
];

export function trophyProgress(
  trophy: TrophyDefinition,
  stats: {
    totalDistanceM: number;
    coinsEarned: number;
    nearMisses: number;
    highestSpeed: number;
    driftDistanceM: number;
    nitroUses: number;
    crashFreeStreakBest: number;
    racesCompleted: number;
    bestScore: number;
    checkpoints: number;
    destinationRaces: Record<string, number>;
  },
  extras: { carsOwned: number; customizations: number; trophyCount: number },
): number {
  switch (trophy.metric) {
    case 'distance':
      return stats.totalDistanceM;
    case 'coins':
      return stats.coinsEarned;
    case 'nearMisses':
      return stats.nearMisses;
    case 'topSpeed':
      return stats.highestSpeed;
    case 'driftDistance':
      return stats.driftDistanceM;
    case 'nitroUses':
      return stats.nitroUses;
    case 'crashFree':
      return stats.crashFreeStreakBest;
    case 'races':
      return stats.racesCompleted;
    case 'score':
      return stats.bestScore;
    case 'carsOwned':
      return extras.carsOwned;
    case 'customizations':
      return extras.customizations;
    case 'checkpoints':
      return stats.checkpoints;
    case 'destinationRaces':
      return trophy.destinationId ? stats.destinationRaces[trophy.destinationId] ?? 0 : 0;
    case 'trophies':
      // Do not count this trophy itself when evaluating it.
      return extras.trophyCount;
    default:
      return 0;
  }
}

export function formatTrophyRequirement(trophy: TrophyDefinition): string {
  const n = trophy.target.toLocaleString();
  switch (trophy.metric) {
    case 'distance':
      return `${n} m driven`;
    case 'coins':
      return `${n} coins collected`;
    case 'nearMisses':
      return `${n} near misses`;
    case 'topSpeed':
      return `${n} km/h top speed`;
    case 'driftDistance':
      return `${n} m drifted`;
    case 'nitroUses':
      return `${n} nitro activations`;
    case 'crashFree':
      return `${n} m crash-free`;
    case 'races':
      return `${n} runs`;
    case 'score':
      return `${n} score`;
    case 'carsOwned':
      return `${n} cars`;
    case 'customizations':
      return `${n} customisations`;
    case 'checkpoints':
      return `${n} checkpoints`;
    case 'trophies':
      return `${n} trophies`;
    case 'destinationRaces':
      return `${n} runs here`;
    default:
      return `${n}`;
  }
}

export const TROPHY_METRIC_LABEL: Record<TrophyMetric, string> = {
  distance: 'Distance',
  coins: 'Coins',
  nearMisses: 'Near misses',
  topSpeed: 'Top speed',
  driftDistance: 'Drift distance',
  nitroUses: 'Nitro uses',
  crashFree: 'Crash-free streak',
  races: 'Runs',
  score: 'Best score',
  carsOwned: 'Cars owned',
  customizations: 'Customisations',
  checkpoints: 'Checkpoints',
  trophies: 'Trophies',
  destinationRaces: 'Destination runs',
};

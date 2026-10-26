import type {
  CarCustomization,
  CarDefinition,
  CarStats,
  CarUpgrades,
  UpgradeKey,
} from '@/lib/types';

/**
 * Real-world-inspired line-up.
 *
 * IMPORTANT ASSET NOTE: every car below is rendered by the original procedural
 * Three.js studio model in `lib/game/carModel.ts`. No manufacturer CAD, scan or
 * licensed GLB is bundled. The `asset` block is deliberately explicit so the
 * garage never presents a placeholder as official vehicle art. Drop a verified,
 * licensed GLB into `/public/models` and set `asset.kind = 'glb'` plus
 * `asset.assetUrl` to hand the asset off to a future loader without changing UI.
 */
const PROCEDURAL_ASSET = {
  kind: 'procedural' as const,
  licence: 'Original in-house geometry · not an official manufacturer asset',
  credit: 'Highway Rush procedural studio model',
  note: 'Stylised original mesh. Trademarks and model names belong to their respective owners.',
};

export const CARS: CarDefinition[] = [
  {
    id: 'veloce-gt',
    name: 'Audi R8 V10',
    brand: 'Audi',
    className: 'super',
    bodyStyle: 'supercar',
    engineProfile: 'v10',
    tagline: 'Everyday theatre. Midnight manners.',
    description:
      'A mid-engined V10 supercar with a naturally aspirated soundtrack and surprising civility. The free starter build is balanced enough to learn the highway and quick enough to keep it interesting.',
    price: 0,
    stats: { speed: 87, acceleration: 84, handling: 82, braking: 79, nitro: 78 },
    palette: ['#d7ff3f', '#f5f6f7', '#0b0d10', '#ff5b45', '#3a8bff', '#c4c9d1'],
    defaultPaint: '#d7ff3f',
    accent: '#d7ff3f',
    powerHp: 602,
    drivetrain: 'Mid-engine quattro',
    gearbox: '7-speed S tronic',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'nightfall-rs',
    name: 'Mercedes-AMG GT',
    brand: 'Mercedes-AMG',
    className: 'super',
    bodyStyle: 'coupe',
    engineProfile: 'v8-crossplane',
    tagline: 'Long bonnet. Longer memory.',
    description:
      'A front-mid V8 grand tourer with a broad torque curve and a deep, barrel-chested exhaust note. Stable at speed, playful when you ask for the rear axle.',
    price: 3200,
    stats: { speed: 82, acceleration: 84, handling: 72, braking: 76, nitro: 73 },
    palette: ['#8b5cf6', '#0b0d10', '#f5f6f7', '#ff2d55', '#f59e0b', '#38bdf8'],
    defaultPaint: '#8b5cf6',
    accent: '#a78bfa',
    powerHp: 577,
    drivetrain: 'Front-mid RWD',
    gearbox: '7-speed DCT',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'dune-reaper',
    name: 'AMG G 63',
    brand: 'Mercedes-AMG',
    className: 'offroad',
    bodyStyle: 'suv',
    engineProfile: 'offroad-v8',
    tagline: 'Immovable object. Unreasonable speed.',
    description:
      'A body-on-frame icon with a hand-built twin-turbo V8. Tall, wide and absurdly capable, with suspension travel that laughs at broken tarmac.',
    price: 5200,
    stats: { speed: 70, acceleration: 78, handling: 65, braking: 70, nitro: 68 },
    palette: ['#f59e0b', '#4b3b2a', '#e8e1d2', '#ef4444', '#65a30d', '#0b0d10'],
    defaultPaint: '#f59e0b',
    accent: '#fbbf24',
    powerHp: 577,
    drivetrain: '4MATIC AWD',
    gearbox: '9-speed automatic',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'apex-venom',
    name: 'BMW M4',
    brand: 'BMW M',
    className: 'sport',
    bodyStyle: 'coupe',
    engineProfile: 'inline-six',
    tagline: 'A scalpel with a turbo whistle.',
    description:
      'A rear-drive sports coupe built around a punchy twin-turbo straight six. Sharp turn-in, huge brakes and a chassis that rewards clean, early inputs.',
    price: 9500,
    stats: { speed: 79, acceleration: 82, handling: 86, braking: 82, nitro: 78 },
    palette: ['#22c55e', '#052e16', '#e2e8f0', '#facc15', '#0ea5e9', '#f43f5e'],
    defaultPaint: '#22c55e',
    accent: '#4ade80',
    requirement: { races: 2 },
    powerHp: 503,
    drivetrain: 'Rear-wheel drive',
    gearbox: '8-speed M Steptronic',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'frostbite-ev',
    name: 'Porsche 911 Turbo S',
    brand: 'Porsche',
    className: 'super',
    bodyStyle: 'coupe',
    engineProfile: 'flat-six',
    tagline: 'The reference lap. In every weather.',
    description:
      'A rear-engine flat-six with all-wheel drive and a reputation for making fast drivers look smooth. Devastating traction, unflappable brakes.',
    price: 12500,
    stats: { speed: 89, acceleration: 92, handling: 87, braking: 88, nitro: 84 },
    palette: ['#38bdf8', '#e0f2fe', '#0b0d10', '#8b5cf6', '#f5f6f7', '#06b6d4'],
    defaultPaint: '#38bdf8',
    accent: '#7dd3fc',
    requirement: { races: 4 },
    powerHp: 640,
    drivetrain: 'Rear-engine AWD',
    gearbox: '8-speed PDK',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'goliath-v8',
    name: 'Ford Mustang Dark Horse',
    brand: 'Ford',
    className: 'muscle',
    bodyStyle: 'muscle',
    engineProfile: 'v8-crossplane',
    tagline: 'A landslide with licence plates.',
    description:
      'A naturally aspirated 5.0 V8 with a long bonnet, a short fuse and a soundtrack that arrives before the car does. Straight-line violence, no apology.',
    price: 22000,
    stats: { speed: 83, acceleration: 85, handling: 69, braking: 74, nitro: 79 },
    palette: ['#ef4444', '#0b0d10', '#f5f5f4', '#f97316', '#1d4ed8', '#eab308'],
    defaultPaint: '#ef4444',
    accent: '#f87171',
    requirement: { nearMisses: 20 },
    powerHp: 500,
    drivetrain: 'Rear-wheel drive',
    gearbox: '6-speed manual feel',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'neon-phantom',
    name: 'Nissan GT-R Nismo',
    brand: 'Nissan',
    className: 'super',
    bodyStyle: 'coupe',
    engineProfile: 'v8-flatplane',
    tagline: 'Machine-built for the midnight grid.',
    description:
      'A twin-turbo V6 legend with torque vectoring and a launch-control reputation. Less about delicate feel, more about ruthless, repeatable speed.',
    price: 18000,
    stats: { speed: 90, acceleration: 91, handling: 88, braking: 84, nitro: 88 },
    palette: ['#f0abfc', '#2e1065', '#0891b2', '#e2e8f0', '#f43f5e', '#a3e635'],
    defaultPaint: '#f0abfc',
    accent: '#e879f9',
    requirement: { races: 7, nearMisses: 30 },
    powerHp: 600,
    drivetrain: 'ATTESA E-TS AWD',
    gearbox: '6-speed dual-clutch',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'hyperion-x',
    name: 'McLaren 720S',
    brand: 'McLaren',
    className: 'hyper',
    bodyStyle: 'supercar',
    engineProfile: 'v8-flatplane',
    tagline: 'The final boss of the highway.',
    description:
      'A carbon-tubbed, twin-turbo V8 hypercar with active aerodynamics and a top speed politely described as sufficient. Built to make the impossible feel routine.',
    price: 32000,
    stats: { speed: 97, acceleration: 96, handling: 95, braking: 94, nitro: 97 },
    palette: ['#f5f6f7', '#d7ff3f', '#0b0d10', '#ef4444', '#3b82f6', '#f59e0b'],
    defaultPaint: '#f5f6f7',
    accent: '#d7ff3f',
    requirement: { races: 10, trophies: 8 },
    powerHp: 720,
    drivetrain: 'Rear-wheel drive',
    gearbox: '7-speed SSG',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'audi-rs7',
    name: 'Audi RS7',
    brand: 'Audi',
    className: 'sport',
    bodyStyle: 'sedan',
    engineProfile: 'v8-crossplane',
    tagline: 'A four-door missile in a tailored suit.',
    description:
      'Twin-turbo V8, quattro traction and autobahn gearing. The RS7 hides supercar pace under a fastback body and a quiet cabin.',
    price: 14500,
    stats: { speed: 86, acceleration: 85, handling: 78, braking: 80, nitro: 76 },
    palette: ['#64748b', '#f5f6f7', '#0b0d10', '#d7ff3f', '#3b82f6', '#ef4444'],
    defaultPaint: '#64748b',
    accent: '#cbd5e1',
    requirement: { races: 5 },
    powerHp: 591,
    drivetrain: 'quattro AWD',
    gearbox: '8-speed tiptronic',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'bmw-m5',
    name: 'BMW M5',
    brand: 'BMW M',
    className: 'sport',
    bodyStyle: 'sedan',
    engineProfile: 'v8-crossplane',
    tagline: 'Business class with a launch mode.',
    description:
      'A super-saloon with a twin-turbo V8, adaptive all-wheel drive and a chassis that can be rear-drive on demand. The quiet way to be extremely illegal.',
    price: 16500,
    stats: { speed: 87, acceleration: 88, handling: 82, braking: 83, nitro: 80 },
    palette: ['#1e40af', '#f5f6f7', '#0b0d10', '#d7ff3f', '#ef4444', '#94a3b8'],
    defaultPaint: '#1e40af',
    accent: '#60a5fa',
    requirement: { races: 8 },
    powerHp: 617,
    drivetrain: 'M xDrive AWD',
    gearbox: '8-speed M Steptronic',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'huracan-evo',
    name: 'Lamborghini Huracán',
    brand: 'Lamborghini',
    className: 'super',
    bodyStyle: 'supercar',
    engineProfile: 'v10',
    tagline: 'A V10 aria at 8,500 rpm.',
    description:
      'A naturally aspirated V10 with razor throttle response and a wedge silhouette. Dramatic, unapologetic and unexpectedly easy to place in traffic.',
    price: 24500,
    stats: { speed: 91, acceleration: 90, handling: 90, braking: 86, nitro: 89 },
    palette: ['#facc15', '#d7ff3f', '#0b0d10', '#f5f6f7', '#f97316', '#22c55e'],
    defaultPaint: '#facc15',
    accent: '#fde047',
    requirement: { races: 9, nearMisses: 45 },
    powerHp: 631,
    drivetrain: 'Rear-wheel drive',
    gearbox: '7-speed dual-clutch',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'ferrari-488',
    name: 'Ferrari 488 GTB',
    brand: 'Ferrari',
    className: 'super',
    bodyStyle: 'supercar',
    engineProfile: 'v8-flatplane',
    tagline: 'The red line is a destination.',
    description:
      'A mid-engined twin-turbo V8 with telepathic steering and a howling flat-plane exhaust. Precision first, drama always.',
    price: 28500,
    stats: { speed: 92, acceleration: 91, handling: 91, braking: 88, nitro: 90 },
    palette: ['#dc2626', '#facc15', '#f5f6f7', '#0b0d10', '#3b82f6', '#f97316'],
    defaultPaint: '#dc2626',
    accent: '#fca5a5',
    requirement: { races: 11, trophies: 7 },
    powerHp: 661,
    drivetrain: 'Rear-wheel drive',
    gearbox: '7-speed dual-clutch',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'ferrari-f8',
    name: 'Ferrari F8 Tributo',
    brand: 'Ferrari',
    className: 'hyper',
    bodyStyle: 'supercar',
    engineProfile: 'v8-flatplane',
    tagline: 'A tribute written in tyre smoke.',
    description:
      'The final evolution of the twin-turbo V8 mid-engine formula. More downforce, more aggression, and a power delivery that keeps pulling past the horizon.',
    price: 36000,
    stats: { speed: 95, acceleration: 94, handling: 93, braking: 92, nitro: 94 },
    palette: ['#ef4444', '#f5f6f7', '#0b0d10', '#facc15', '#38bdf8', '#a3e635'],
    defaultPaint: '#ef4444',
    accent: '#f87171',
    requirement: { races: 14, trophies: 12 },
    powerHp: 710,
    drivetrain: 'Rear-wheel drive',
    gearbox: '7-speed dual-clutch',
    asset: PROCEDURAL_ASSET,
  },
  {
    id: 'range-rover-sv',
    name: 'Range Rover Sport SV',
    brand: 'Range Rover',
    className: 'offroad',
    bodyStyle: 'suv',
    engineProfile: 'v8-crossplane',
    tagline: 'A velvet hammer for broken horizons.',
    description:
      'A luxury performance SUV with a twin-turbo V8 and a ride that flattens distance. Imposing on the road, calm when the weather turns hostile.',
    price: 31000,
    stats: { speed: 84, acceleration: 86, handling: 74, braking: 78, nitro: 81 },
    palette: ['#0f766e', '#f5f6f7', '#0b0d10', '#d7ff3f', '#b45309', '#64748b'],
    defaultPaint: '#0f766e',
    accent: '#5eead4',
    requirement: { races: 12, trophies: 6 },
    powerHp: 626,
    drivetrain: 'All-wheel drive',
    gearbox: '8-speed automatic',
    asset: PROCEDURAL_ASSET,
  },
];

export const CARS_BY_ID: Record<string, CarDefinition> = Object.fromEntries(
  CARS.map((car) => [car.id, car]),
);

export const DEFAULT_UPGRADES: CarUpgrades = {
  engine: 0,
  tyres: 0,
  brakes: 0,
  nitro: 0,
};

export const MAX_UPGRADE_LEVEL = 3;

export const UPGRADE_DEFS: Array<{
  key: UpgradeKey;
  label: string;
  description: string;
  costs: number[];
}> = [
  {
    key: 'engine',
    label: 'Engine tune',
    description: '+3 speed · +4 acceleration per stage',
    costs: [1400, 2300, 3600],
  },
  {
    key: 'tyres',
    label: 'Tyres',
    description: '+4 handling · +1 braking per stage',
    costs: [1100, 1900, 3000],
  },
  {
    key: 'brakes',
    label: 'Brakes',
    description: '+5 braking per stage',
    costs: [1000, 1700, 2700],
  },
  {
    key: 'nitro',
    label: 'Nitro system',
    description: '+5 nitro response per stage',
    costs: [1200, 2000, 3100],
  },
];

export const DEFAULT_CUSTOMIZATION: CarCustomization = {
  paint: '#d7ff3f',
  rim: '#c4d0d9',
  spoiler: 'sport',
  wheels: 'sport',
  decal: 'none',
  underglow: null,
  upgrades: { ...DEFAULT_UPGRADES },
};

export function getUpgrades(customization?: CarCustomization | null): CarUpgrades {
  return {
    engine: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, customization?.upgrades?.engine ?? 0)),
    tyres: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, customization?.upgrades?.tyres ?? 0)),
    brakes: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, customization?.upgrades?.brakes ?? 0)),
    nitro: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, customization?.upgrades?.nitro ?? 0)),
  };
}

export function totalUpgradeLevel(customization?: CarCustomization | null): number {
  const upgrades = getUpgrades(customization);
  return upgrades.engine + upgrades.tyres + upgrades.brakes + upgrades.nitro;
}

export function getUpgradeCost(
  car: CarDefinition,
  key: UpgradeKey,
  level: number,
): number | null {
  const def = UPGRADE_DEFS.find((entry) => entry.key === key);
  if (!def || level >= MAX_UPGRADE_LEVEL) return null;
  // Higher-tier cars cost more to develop, but the curve stays predictable.
  const base = def.costs[Math.max(0, Math.min(MAX_UPGRADE_LEVEL - 1, level))];
  const carFactor = Math.round((car.price / 4000) * 100);
  return Math.round((base + carFactor) / 50) * 50;
}

/**
 * Garage upgrades feed directly into the race model. Base stats remain visible
 * in `CarDefinition` so every machine keeps a comparable showroom rating.
 */
export function effectiveCarStats(
  car: CarDefinition,
  customization?: CarCustomization | null,
): CarStats {
  const upgrades = getUpgrades(customization);
  return {
    speed: Math.min(99, car.stats.speed + upgrades.engine * 3),
    acceleration: Math.min(99, car.stats.acceleration + upgrades.engine * 4),
    handling: Math.min(99, car.stats.handling + upgrades.tyres * 4),
    braking: Math.min(99, car.stats.braking + upgrades.brakes * 5 + upgrades.tyres),
    nitro: Math.min(99, car.stats.nitro + upgrades.nitro * 5),
  };
}

export const RIM_COLORS = ['#c4d0d9', '#1f2937', '#d4af37', '#d7ff3f', '#f43f5e', '#f8fafc'];
export const UNDERGLOW_COLORS = ['#d7ff3f', '#38bdf8', '#f43f5e', '#a78bfa', '#f59e0b', '#22c55e'];

export function getDefaultCustomization(car: CarDefinition): CarCustomization {
  return { ...DEFAULT_CUSTOMIZATION, paint: car.defaultPaint };
}

export function carStatsTotal(car: CarDefinition, customization?: CarCustomization | null): number {
  const s = effectiveCarStats(car, customization);
  return Math.round((s.speed + s.acceleration + s.handling + s.braking + s.nitro) / 5);
}

export function meetsCarRequirement(
  car: CarDefinition,
  stats: { racesCompleted: number; nearMisses: number },
  trophies: number,
): { met: boolean; missing: string[] } {
  const missing: string[] = [];
  if (car.requirement?.races && stats.racesCompleted < car.requirement.races) {
    missing.push(`${car.requirement.races} races completed`);
  }
  if (car.requirement?.nearMisses && stats.nearMisses < car.requirement.nearMisses) {
    missing.push(`${car.requirement.nearMisses} near misses`);
  }
  if (car.requirement?.trophies && trophies < car.requirement.trophies) {
    missing.push(`${car.requirement.trophies} trophies`);
  }
  return { met: missing.length === 0, missing };
}

import type { CarCustomization, CarDefinition } from '@/lib/types';

export const CARS: CarDefinition[] = [
  {
    id: 'veloce-gt',
    name: 'Veloce GT',
    brand: 'STRADA',
    className: 'sport',
    tagline: 'Your first taste of the rush.',
    description:
      'A balanced rear-wheel-drive coupe. Forgiving on the limit, quick enough to thread traffic, and the perfect canvas for your first build.',
    price: 0,
    stats: { speed: 62, acceleration: 61, handling: 68, braking: 60, nitro: 56 },
    palette: ['#d7ff3f', '#f6f7f2', '#1c2430', '#ff5b45', '#3a8bff', '#c4c9d1'],
    defaultPaint: '#d7ff3f',
    accent: '#d7ff3f',
  },
  {
    id: 'nightfall-rs',
    name: 'Nightfall RS',
    brand: 'KESTREL',
    className: 'muscle',
    tagline: 'Old-school muscle. New-school manners.',
    description:
      'A supercharged V8 grand tourer with a long-legged sixth gear and a soundtrack to match. Straight-line violence, surprisingly civil in the corners.',
    price: 3200,
    stats: { speed: 73, acceleration: 76, handling: 58, braking: 64, nitro: 66 },
    palette: ['#8b5cf6', '#0f172a', '#f6f7f2', '#ff2d55', '#f59e0b', '#38bdf8'],
    defaultPaint: '#8b5cf6',
    accent: '#a78bfa',
  },
  {
    id: 'dune-reaper',
    name: 'Dune Reaper',
    brand: 'TERRA',
    className: 'offroad',
    tagline: 'Built for roads that forgot to be roads.',
    description:
      'A rally-bred desert runner with long-travel suspension and a torquey twin-turbo six. Wide, planted and impossible to unsettle.',
    price: 5200,
    stats: { speed: 66, acceleration: 68, handling: 78, braking: 72, nitro: 62 },
    palette: ['#f59e0b', '#4b3b2a', '#e8e1d2', '#ef4444', '#65a30d', '#1f2937'],
    defaultPaint: '#f59e0b',
    accent: '#fbbf24',
  },
  {
    id: 'apex-venom',
    name: 'Apex Venom',
    brand: 'APEX',
    className: 'super',
    tagline: 'A scalpel for the asphalt.',
    description:
      'Mid-engined, carbon-tubbed and savagely quick. The Venom rewards clean inputs with cornering speeds that feel like a glitch in the physics engine.',
    price: 9500,
    stats: { speed: 85, acceleration: 83, handling: 86, braking: 80, nitro: 82 },
    palette: ['#22c55e', '#052e16', '#e2e8f0', '#facc15', '#0ea5e9', '#f43f5e'],
    defaultPaint: '#22c55e',
    accent: '#4ade80',
    requirement: { races: 3 },
  },
  {
    id: 'frostbite-ev',
    name: 'Frostbite EV',
    brand: 'VOLTA',
    className: 'electric',
    tagline: 'Silent. Violent. Efficient.',
    description:
      'Dual-motor electric hyper-sedan. Instant torque from zero RPM, razor-sharp throttle response and a battery-fed nitro system that hits like a wave.',
    price: 12500,
    stats: { speed: 87, acceleration: 92, handling: 80, braking: 76, nitro: 90 },
    palette: ['#38bdf8', '#e0f2fe', '#0f172a', '#8b5cf6', '#f8fafc', '#06b6d4'],
    defaultPaint: '#38bdf8',
    accent: '#7dd3fc',
    requirement: { races: 5 },
  },
  {
    id: 'goliath-v8',
    name: 'Goliath V8',
    brand: 'KESTREL',
    className: 'muscle',
    tagline: 'A landslide with license plates.',
    description:
      'A 7.0-litre supercharged brick. Enormous power, enormous presence, and a chassis that demands respect. The highway bends around it.',
    price: 22000,
    stats: { speed: 82, acceleration: 84, handling: 61, braking: 69, nitro: 74 },
    palette: ['#ef4444', '#111827', '#f5f5f4', '#f97316', '#1d4ed8', '#eab308'],
    defaultPaint: '#ef4444',
    accent: '#f87171',
    requirement: { nearMisses: 25 },
  },
  {
    id: 'neon-phantom',
    name: 'Neon Phantom',
    brand: 'AKIRA',
    className: 'hyper',
    tagline: 'Machine-built for the midnight grid.',
    description:
      'A hybrid hypercar from a boutique Tokyo workshop. Active aero, torque vectoring and a launch control that rearranges your organs.',
    price: 18000,
    stats: { speed: 93, acceleration: 89, handling: 90, braking: 86, nitro: 94 },
    palette: ['#f0abfc', '#2e1065', '#0891b2', '#e2e8f0', '#f43f5e', '#a3e635'],
    defaultPaint: '#f0abfc',
    accent: '#e879f9',
    requirement: { races: 8, nearMisses: 40 },
  },
  {
    id: 'hyperion-x',
    name: 'Hyperion X',
    brand: 'HYPERION',
    className: 'hyper',
    tagline: 'The final boss of the highway.',
    description:
      'A limited-run, 1,600 hp hypercar. Everything is carbon, everything is active, and the top speed is politely described as "sufficient."',
    price: 32000,
    stats: { speed: 99, acceleration: 97, handling: 95, braking: 93, nitro: 99 },
    palette: ['#f8fafc', '#d7ff3f', '#0f172a', '#ef4444', '#3b82f6', '#f59e0b'],
    defaultPaint: '#f8fafc',
    accent: '#d7ff3f',
    requirement: { races: 12, trophies: 10 },
  },
];

export const CARS_BY_ID: Record<string, CarDefinition> = Object.fromEntries(
  CARS.map((car) => [car.id, car]),
);

export const DEFAULT_CUSTOMIZATION: CarCustomization = {
  paint: '#d7ff3f',
  rim: '#c4d0d9',
  spoiler: 'sport',
  wheels: 'sport',
  decal: 'none',
  underglow: null,
};

export const RIM_COLORS = ['#c4d0d9', '#1f2937', '#d4af37', '#d7ff3f', '#f43f5e', '#f8fafc'];
export const UNDERGLOW_COLORS = ['#d7ff3f', '#38bdf8', '#f43f5e', '#a78bfa', '#f59e0b', '#22c55e'];

export function getDefaultCustomization(car: CarDefinition): CarCustomization {
  return { ...DEFAULT_CUSTOMIZATION, paint: car.defaultPaint };
}

export function carStatsTotal(car: CarDefinition): number {
  const s = car.stats;
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

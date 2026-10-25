export type Difficulty = 'relaxed' | 'standard' | 'hard' | 'insane';
export type GraphicsPreset = 'low' | 'medium' | 'high' | 'custom';
export type Quality = 'low' | 'medium' | 'high';
export type SpeedUnit = 'kmh' | 'mph';
export type ControlScheme = 'keyboard' | 'touch' | 'gamepad';
export type SpoilerStyle = 'none' | 'lip' | 'sport' | 'gt';
export type WheelStyle = 'sport' | 'forged' | 'stealth';
export type DecalStyle = 'none' | 'stripe' | 'racing' | 'flames';

export type ControlAction =
  | 'steerLeft'
  | 'steerRight'
  | 'accelerate'
  | 'brake'
  | 'nitro'
  | 'pause';

export interface Settings {
  graphics: {
    preset: GraphicsPreset;
    shadows: boolean;
    shadowQuality: Quality;
    antialias: boolean;
    renderScale: number;
    effects: Quality;
    showFps: boolean;
    performanceMode: boolean;
  };
  audio: {
    master: number;
    engine: number;
    sfx: number;
    music: number;
    ambience: number;
    muted: boolean;
  };
  controls: {
    sensitivity: number;
    invertCamera: boolean;
    scheme: ControlScheme;
    keybindings: Record<ControlAction, string>;
  };
  gameplay: {
    difficulty: Difficulty;
    speedUnit: SpeedUnit;
    cameraDistance: number;
    fov: number;
    showMinimap: boolean;
    showHud: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    uiScale: number;
  };
}

export interface CarStats {
  speed: number;
  acceleration: number;
  handling: number;
  braking: number;
  nitro: number;
}

export type CarClass = 'sport' | 'muscle' | 'super' | 'hyper' | 'offroad' | 'electric';

export interface CarRequirement {
  races?: number;
  nearMisses?: number;
  trophies?: number;
}

export interface CarDefinition {
  id: string;
  name: string;
  brand: string;
  className: CarClass;
  tagline: string;
  description: string;
  price: number;
  stats: CarStats;
  palette: string[];
  defaultPaint: string;
  requirement?: CarRequirement;
  accent: string;
}

export interface CarCustomization {
  paint: string;
  rim: string;
  spoiler: SpoilerStyle;
  wheels: WheelStyle;
  decal: DecalStyle;
  underglow: string | null;
}

export type EnvironmentType =
  | 'mountain'
  | 'city'
  | 'desert'
  | 'coastal'
  | 'snow'
  | 'forest'
  | 'neon';

export interface DestinationEnvironment {
  ground: string;
  road: string;
  shoulder: string;
  lane: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sky: string;
  sun: string;
  ambient: string;
  props: string;
  accent: string;
  weather: 'none' | 'snow' | 'dust' | 'rain' | 'fireflies';
  timeOfDay: 'dawn' | 'day' | 'sunset' | 'night';
}

export interface DestinationDefinition {
  id: string;
  name: string;
  region: string;
  tagline: string;
  description: string;
  difficulty: Difficulty;
  distanceTarget: number;
  coinCost: number;
  requirement?: {
    races?: number;
    trophies?: number;
  };
  environment: EnvironmentType;
  ambience: string;
  music: 'sunrise' | 'night' | 'desert' | 'coast' | 'frost' | 'forest' | 'neon';
  theme: DestinationEnvironment;
  previewColor: string;
}

export interface Statistics {
  totalDistanceM: number;
  bestScore: number;
  highestSpeed: number;
  totalPlaytimeMs: number;
  coinsEarned: number;
  racesCompleted: number;
  crashes: number;
  nearMisses: number;
  driftDistanceM: number;
  nitroUses: number;
  checkpoints: number;
  crashFreeStreakBest: number;
  runs: number;
  destinationRaces: Record<string, number>;
  customizationChanges: number;
}

export interface RunResult {
  id: string;
  date: string;
  destinationId: string;
  carId: string;
  difficulty: Difficulty;
  score: number;
  distanceM: number;
  topSpeedKph: number;
  coins: number;
  nearMisses: number;
  driftDistanceM: number;
  nitroUses: number;
  checkpoints: number;
  crashes: number;
  crashFreeStreakM: number;
  durationMs: number;
  completed: boolean;
  reason: 'finish' | 'crash' | 'fuel' | 'quit';
}

export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type TrophyMetric =
  | 'distance'
  | 'coins'
  | 'nearMisses'
  | 'topSpeed'
  | 'driftDistance'
  | 'nitroUses'
  | 'crashFree'
  | 'races'
  | 'score'
  | 'carsOwned'
  | 'customizations'
  | 'checkpoints'
  | 'trophies'
  | 'destinationRaces';

export interface TrophyDefinition {
  id: string;
  name: string;
  description: string;
  tier: TrophyTier;
  metric: TrophyMetric;
  target: number;
  reward: number;
  destinationId?: string;
}

export interface DailyMissionProgress {
  id: string;
  templateId: string;
  title: string;
  description: string;
  metric: TrophyMetric;
  target: number;
  reward: number;
  progress: number;
  claimed: boolean;
}

export interface DailyMissionState {
  date: string;
  missions: DailyMissionProgress[];
}

export interface LongTermMission {
  id: string;
  name: string;
  description: string;
  metric: TrophyMetric;
  target: number;
  reward: number;
}

export interface ScoreRecord {
  id: string;
  score: number;
  distanceM: number;
  topSpeedKph: number;
  coins: number;
  date: string;
  destinationId: string;
  carId: string;
  difficulty: Difficulty;
}

export interface HudTraffic {
  x: number;
  z: number;
  color: string;
}

export interface HudFrame {
  mode: EngineMode;
  countdown: number;
  speedKph: number;
  rpm: number;
  gear: number;
  nitro: number;
  fuel: number;
  health: number;
  score: number;
  distanceM: number;
  targetM: number;
  coins: number;
  nearMisses: number;
  combo: number;
  multiplier: number;
  checkpointProgress: number;
  topSpeedKph: number;
  driftDistanceM: number;
  nitroUses: number;
  crashes: number;
  crashFreeStreakM: number;
  fps: number;
  traffic: HudTraffic[];
  drifting: boolean;
  boosting: boolean;
  bestScore: number;
}

export type EngineMode =
  | 'loading'
  | 'ready'
  | 'countdown'
  | 'running'
  | 'paused'
  | 'finishing'
  | 'finished';

export type GameEvent =
  | { type: 'coin'; amount: number; total: number }
  | { type: 'nearMiss'; combo: number; points: number }
  | { type: 'checkpoint'; index: number; bonus: number; fuel: number }
  | { type: 'collision'; severity: number; health: number }
  | { type: 'nitro'; active: boolean }
  | { type: 'gear'; gear: number }
  | { type: 'drift'; active: boolean }
  | { type: 'lowFuel' }
  | { type: 'autopause' }
  | { type: 'finish'; result: RunResult }
  | { type: 'gameover'; result: RunResult }
  | { type: 'error'; message: string };

export type AudioCue =
  | 'ui'
  | 'confirm'
  | 'back'
  | 'coin'
  | 'nearMiss'
  | 'checkpoint'
  | 'crash'
  | 'shift'
  | 'nitro'
  | 'purchase'
  | 'trophy'
  | 'countdown'
  | 'go'
  | 'finish'
  | 'error';

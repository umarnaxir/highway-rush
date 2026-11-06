'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_CUSTOMIZATION,
  CARS,
  CARS_BY_ID,
  MAX_UPGRADE_LEVEL,
  getDefaultCustomization,
  getUpgradeCost,
  getUpgrades,
  meetsCarRequirement,
} from '@/lib/data/cars';
import {
  DESTINATIONS,
  DESTINATIONS_BY_ID,
  meetsDestinationRequirement,
} from '@/lib/data/destinations';
import { generateDailyMissions, getTodayKey, LONG_TERM_MISSIONS } from '@/lib/data/missions';
import { TROPHIES, trophyProgress } from '@/lib/data/trophies';
import type {
  CarCustomization,
  ControlAction,
  DailyMissionState,
  Difficulty,
  LongTermMission,
  RunResult,
  Settings,
  Statistics,
  TrophyDefinition,
  UpgradeKey,
} from '@/lib/types';

export const DEFAULT_SETTINGS: Settings = {
  graphics: {
    preset: 'high',
    shadows: true,
    shadowQuality: 'medium',
    antialias: true,
    renderScale: 1,
    effects: 'high',
    showFps: false,
    performanceMode: false,
  },
  audio: {
    master: 0.8,
    engine: 0.75,
    sfx: 0.8,
    music: 0.35,
    ambience: 0.4,
    muted: false,
  },
  controls: {
    sensitivity: 1,
    invertCamera: false,
    scheme: 'keyboard',
    method: 'auto',
    tilt: {
      sensitivity: 1,
      deadZone: 0.08,
      smoothing: 0.18,
      maxSteer: 30,
      reverse: false,
    },
    keybindings: {
      steerLeft: 'ArrowLeft',
      steerRight: 'ArrowRight',
      accelerate: 'ArrowUp',
      brake: 'ArrowDown',
      nitro: 'Space',
      pause: 'Escape',
      horn: 'KeyH',
      switchCamera: 'KeyC',
    },
  },
  gameplay: {
    difficulty: 'standard',
    speedUnit: 'kmh',
    cameraDistance: 1,
    fov: 62,
    showMinimap: true,
    showHud: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    uiScale: 1,
  },
};

const EMPTY_STATS: Statistics = {
  totalDistanceM: 0,
  bestScore: 0,
  highestSpeed: 0,
  totalPlaytimeMs: 0,
  coinsEarned: 0,
  racesCompleted: 0,
  crashes: 0,
  nearMisses: 0,
  driftDistanceM: 0,
  nitroUses: 0,
  checkpoints: 0,
  crashFreeStreakBest: 0,
  runs: 0,
  destinationRaces: {},
  customizationChanges: 0,
};

export interface LiveRunStats {
  destinationId: string;
  completed: boolean;
  score: number;
  distanceM: number;
  coins: number;
  nearMisses: number;
  driftDistanceM: number;
  nitroUses: number;
  checkpoints: number;
  topSpeedKph: number;
  crashFreeStreakM: number;
}

export interface RunRewards {
  previousBest: number;
  newBest: boolean;
  unlockedTrophies: TrophyDefinition[];
  completedMissions: string[];
  destinationRecord: boolean;
}

export interface PurchaseResult {
  ok: boolean;
  message: string;
}

interface GameStore {
  hydrated: boolean;
  coins: number;
  ownedCars: string[];
  selectedCar: string;
  unlockedDestinations: string[];
  selectedDestination: string;
  customizations: Record<string, CarCustomization>;
  stats: Statistics;
  unlockedTrophies: Record<string, string>;
  claimedLongTermMissions: string[];
  daily: DailyMissionState;
  runs: RunResult[];
  settings: Settings;
  tutorialSeen: boolean;
  setHydrated: (value: boolean) => void;
  ensureDailyMissions: () => void;
  addCoins: (amount: number) => void;
  purchaseCar: (carId: string) => PurchaseResult;
  selectCar: (carId: string) => void;
  purchaseDestination: (destinationId: string) => PurchaseResult;
  selectDestination: (destinationId: string) => void;
  updateCustomization: (carId: string, patch: Partial<CarCustomization>) => void;
  purchaseUpgrade: (carId: string, key: UpgradeKey) => PurchaseResult;
  recordCustomization: () => void;
  addRunResult: (result: RunResult) => RunRewards;
  evaluateLiveTrophies: (live: LiveRunStats) => TrophyDefinition[];
  claimDailyMission: (missionId: string) => PurchaseResult;
  claimLongTermMission: (missionId: string) => PurchaseResult;
  updateSetting: <S extends keyof Settings, K extends keyof Settings[S]>(
    section: S,
    key: K,
    value: Settings[S][K],
  ) => void;
  updateSettings: (settings: Settings) => void;
  setKeyBinding: (action: ControlAction, code: string) => void;
  restoreDefaultSettings: () => void;
  resetProgress: () => void;
  setTutorialSeen: (value: boolean) => void;
}

function trophyCount(unlocked: Record<string, string>): number {
  return Object.keys(unlocked).length;
}

function evaluateRewards(
  state: Pick<GameStore, 'stats' | 'ownedCars' | 'unlockedTrophies'>,
): TrophyDefinition[] {
  const stats = state.stats;
  const baseUnlocked = { ...state.unlockedTrophies };
  const newlyUnlocked: TrophyDefinition[] = [];
  let count = trophyCount(baseUnlocked);
  const extras = {
    carsOwned: state.ownedCars.length,
    customizations: stats.customizationChanges,
    trophyCount: count,
  };

  for (const trophy of TROPHIES) {
    if (baseUnlocked[trophy.id]) continue;
    extras.trophyCount = count;
    const progress = trophyProgress(trophy, stats, extras);
    if (progress >= trophy.target) {
      baseUnlocked[trophy.id] = new Date().toISOString();
      newlyUnlocked.push(trophy);
      count += 1;
    }
  }
  return newlyUnlocked;
}

function normalizeSettings(settings: Partial<Settings> | undefined): Settings {
  const next: Settings = {
    graphics: { ...DEFAULT_SETTINGS.graphics, ...settings?.graphics },
    audio: { ...DEFAULT_SETTINGS.audio, ...settings?.audio },
    controls: {
      ...DEFAULT_SETTINGS.controls,
      ...settings?.controls,
      tilt: {
        ...DEFAULT_SETTINGS.controls.tilt,
        ...settings?.controls?.tilt,
      },
      keybindings: {
        ...DEFAULT_SETTINGS.controls.keybindings,
        ...settings?.controls?.keybindings,
      },
    },
    gameplay: { ...DEFAULT_SETTINGS.gameplay, ...settings?.gameplay },
    accessibility: { ...DEFAULT_SETTINGS.accessibility, ...settings?.accessibility },
  };
  next.graphics.renderScale = Math.min(1, Math.max(0.5, next.graphics.renderScale));
  next.controls.sensitivity = Math.min(2, Math.max(0.4, next.controls.sensitivity));
  const methods = ['auto', 'tilt', 'buttons', 'drag', 'keyboard', 'gamepad'];
  if (!methods.includes(next.controls.method)) next.controls.method = 'auto';
  next.controls.tilt.sensitivity = Math.min(2, Math.max(0.4, next.controls.tilt.sensitivity));
  next.controls.tilt.deadZone = Math.min(0.3, Math.max(0, next.controls.tilt.deadZone));
  next.controls.tilt.smoothing = Math.min(0.85, Math.max(0.02, next.controls.tilt.smoothing));
  next.controls.tilt.maxSteer = Math.min(55, Math.max(12, next.controls.tilt.maxSteer));
  next.gameplay.cameraDistance = Math.min(1.6, Math.max(0.6, next.gameplay.cameraDistance));
  next.gameplay.fov = Math.min(85, Math.max(55, next.gameplay.fov));
  next.accessibility.uiScale = Math.min(1.2, Math.max(0.85, next.accessibility.uiScale));
  for (const key of ['master', 'engine', 'sfx', 'music', 'ambience'] as const) {
    next.audio[key] = Math.min(1, Math.max(0, next.audio[key]));
  }
  return next;
}

function getExtrasFromState(state: GameStore) {
  return {
    carsOwned: state.ownedCars.length,
    customizations: state.stats.customizationChanges,
    trophyCount: trophyCount(state.unlockedTrophies),
  };
}

function deriveLongTermProgress(store: GameStore): Record<string, number> {
  const extras = getExtrasFromState(store);
  const map: Record<string, number> = {};
  for (const mission of LONG_TERM_MISSIONS) {
    map[mission.id] = Math.min(
      mission.target,
      trophyProgress(
        {
          id: mission.id,
          name: mission.name,
          description: mission.description,
          tier: 'bronze',
          metric: mission.metric,
          target: mission.target,
          reward: mission.reward,
        },
        store.stats,
        extras,
      ),
    );
  }
  return map;
}

export function getLongTermProgress(
  stats: Statistics,
  extras: { carsOwned: number; customizations: number; trophyCount: number },
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const mission of LONG_TERM_MISSIONS) {
    map[mission.id] = Math.min(
      mission.target,
      trophyProgress(
        {
          id: mission.id,
          name: mission.name,
          description: mission.description,
          tier: 'bronze',
          metric: mission.metric,
          target: mission.target,
          reward: mission.reward,
        },
        stats,
        extras,
      ),
    );
  }
  return map;
}

function getTrophyExtrasFor(stats: Statistics, ownedCars: number, unlocked: Record<string, string>) {
  return {
    carsOwned: ownedCars,
    customizations: stats.customizationChanges,
    trophyCount: trophyCount(unlocked),
  };
}

const STORAGE_KEY = 'highway-rush-save-v2';

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      coins: 850,
      ownedCars: ['veloce-gt'],
      selectedCar: 'veloce-gt',
      unlockedDestinations: ['mountain-highway', 'city-night'],
      selectedDestination: 'mountain-highway',
      customizations: { 'veloce-gt': getDefaultCustomization(CARS[0]) },
      stats: { ...EMPTY_STATS, destinationRaces: {} },
      unlockedTrophies: {},
      claimedLongTermMissions: [],
      daily: { date: '', missions: [] },
      runs: [],
      settings: DEFAULT_SETTINGS,
      tutorialSeen: false,

      setHydrated: (value) => set({ hydrated: value }),

      ensureDailyMissions: () => {
        const today = getTodayKey();
        const current = get().daily;
        if (current.date === today && current.missions.length > 0) return;
        set({ daily: { date: today, missions: generateDailyMissions(today) } });
      },

      addCoins: (amount) => {
        if (!Number.isFinite(amount)) return;
        set((state) => ({ coins: Math.max(0, Math.round(state.coins + amount)) }));
      },

      purchaseCar: (carId) => {
        const state = get();
        const car = CARS_BY_ID[carId];
        if (!car) return { ok: false, message: 'Unknown car.' };
        if (state.ownedCars.includes(carId)) return { ok: false, message: 'You already own this car.' };
        const req = meetsCarRequirement(
          car,
          state.stats,
          trophyCount(state.unlockedTrophies),
        );
        if (!req.met) {
          return { ok: false, message: `Requirement not met: ${req.missing.join(', ')}.` };
        }
        if (state.coins < car.price) {
          return { ok: false, message: `You need ${(car.price - state.coins).toLocaleString()} more coins.` };
        }
        const unlocked = evaluateRewards({
          stats: state.stats,
          ownedCars: [...state.ownedCars, carId],
          unlockedTrophies: state.unlockedTrophies,
        });
        set({
          coins: state.coins - car.price,
          ownedCars: [...state.ownedCars, carId],
          selectedCar: carId,
          customizations: {
            ...state.customizations,
            [carId]: state.customizations[carId] ?? getDefaultCustomization(car),
          },
          unlockedTrophies: unlocked.reduce(
            (acc, trophy) => {
              acc[trophy.id] = new Date().toISOString();
              return acc;
            },
            { ...state.unlockedTrophies },
          ),
        });
        const rewards = unlocked.reduce((sum, t) => sum + t.reward, 0);
        if (rewards > 0) set((s) => ({ coins: s.coins + rewards }));
        return { ok: true, message: `${car.name} added to your garage.` };
      },

      selectCar: (carId) => {
        if (!get().ownedCars.includes(carId)) return;
        set({ selectedCar: carId });
      },

      purchaseDestination: (destinationId) => {
        const state = get();
        const destination = DESTINATIONS_BY_ID[destinationId];
        if (!destination) return { ok: false, message: 'Unknown destination.' };
        if (state.unlockedDestinations.includes(destinationId)) {
          return { ok: false, message: 'This destination is already unlocked.' };
        }
        const req = meetsDestinationRequirement(
          destination,
          state.stats,
          trophyCount(state.unlockedTrophies),
        );
        if (!req.met) {
          return { ok: false, message: `Requirement not met: ${req.missing.join(', ')}.` };
        }
        if (state.coins < destination.coinCost) {
          return {
            ok: false,
            message: `You need ${(destination.coinCost - state.coins).toLocaleString()} more coins.`,
          };
        }
        set({
          coins: state.coins - destination.coinCost,
          unlockedDestinations: [...state.unlockedDestinations, destinationId],
          selectedDestination: destinationId,
        });
        return { ok: true, message: `${destination.name} unlocked.` };
      },

      selectDestination: (destinationId) => {
        if (!get().unlockedDestinations.includes(destinationId)) return;
        set({ selectedDestination: destinationId });
      },

      updateCustomization: (carId, patch) => {
        set((state) => {
          const car = CARS_BY_ID[carId];
          const base =
            state.customizations[carId] ?? (car ? getDefaultCustomization(car) : DEFAULT_CUSTOMIZATION);
          return {
            customizations: {
              ...state.customizations,
              [carId]: { ...base, ...patch },
            },
          };
        });
      },

      purchaseUpgrade: (carId, key) => {
        const state = get();
        const car = CARS_BY_ID[carId];
        if (!car) return { ok: false, message: 'Unknown car.' };
        if (!state.ownedCars.includes(carId)) {
          return { ok: false, message: 'Purchase this car before fitting upgrades.' };
        }
        const base = state.customizations[carId] ?? getDefaultCustomization(car);
        const upgrades = getUpgrades(base);
        const level = upgrades[key];
        if (level >= MAX_UPGRADE_LEVEL) {
          return { ok: false, message: 'This upgrade is already at maximum stage.' };
        }
        const cost = getUpgradeCost(car, key, level);
        if (cost === null) return { ok: false, message: 'This upgrade is unavailable.' };
        if (state.coins < cost) {
          return {
            ok: false,
            message: `You need ${(cost - state.coins).toLocaleString()} more coins.`,
          };
        }
        set({
          coins: state.coins - cost,
          customizations: {
            ...state.customizations,
            [carId]: {
              ...base,
              upgrades: { ...upgrades, [key]: level + 1 },
            },
          },
          stats: {
            ...state.stats,
            customizationChanges: state.stats.customizationChanges + 1,
          },
        });
        return {
          ok: true,
          message: `${car.name} upgrade fitted · stage ${level + 1} of ${MAX_UPGRADE_LEVEL}.`,
        };
      },

      recordCustomization: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            customizationChanges: state.stats.customizationChanges + 1,
          },
        }));
      },

      addRunResult: (result) => {
        const state = get();
        const previousBest = state.stats.bestScore;
        const previousDestinationBest = Math.max(
          0,
          ...state.runs
            .filter((run) => run.destinationId === result.destinationId)
            .map((run) => run.score),
        );
        const newBest = result.score > previousBest;
        const destinationRecord = result.score > previousDestinationBest;
        const updatedStats: Statistics = {
          ...state.stats,
          totalDistanceM: state.stats.totalDistanceM + result.distanceM,
          bestScore: Math.max(state.stats.bestScore, result.score),
          highestSpeed: Math.max(state.stats.highestSpeed, result.topSpeedKph),
          totalPlaytimeMs: state.stats.totalPlaytimeMs + result.durationMs,
          coinsEarned: state.stats.coinsEarned + result.coins,
          racesCompleted: state.stats.racesCompleted + (result.completed ? 1 : 0),
          crashes: state.stats.crashes + result.crashes,
          nearMisses: state.stats.nearMisses + result.nearMisses,
          driftDistanceM: state.stats.driftDistanceM + result.driftDistanceM,
          nitroUses: state.stats.nitroUses + result.nitroUses,
          checkpoints: state.stats.checkpoints + result.checkpoints,
          crashFreeStreakBest: Math.max(
            state.stats.crashFreeStreakBest,
            result.crashFreeStreakM,
          ),
          runs: state.stats.runs + 1,
          destinationRaces: {
            ...state.stats.destinationRaces,
            [result.destinationId]:
              (state.stats.destinationRaces[result.destinationId] ?? 0) + (result.completed ? 1 : 0),
          },
        };

        // Daily missions -----------------------------------------------------------------
        const today = getTodayKey();
        const dailyBase =
          state.daily.date === today && state.daily.missions.length > 0
            ? state.daily
            : { date: today, missions: generateDailyMissions(today) };
        const completedMissions: string[] = [];
        const daily = {
          ...dailyBase,
          missions: dailyBase.missions.map((mission) => {
            let progress = mission.progress;
            switch (mission.metric) {
              case 'coins':
                progress += result.coins;
                break;
              case 'nearMisses':
                progress += result.nearMisses;
                break;
              case 'distance':
                progress += result.distanceM;
                break;
              case 'driftDistance':
                progress += result.driftDistanceM;
                break;
              case 'nitroUses':
                progress += result.nitroUses;
                break;
              case 'checkpoints':
                progress += result.checkpoints;
                break;
              case 'races':
                progress += 1;
                break;
              case 'topSpeed':
                progress = Math.max(progress, result.topSpeedKph);
                break;
              default:
                break;
            }
            if (progress >= mission.target && mission.progress < mission.target && !mission.claimed) {
              completedMissions.push(mission.title);
            }
            return { ...mission, progress: Math.min(mission.target, progress) };
          }),
        };

        const unlocked = evaluateRewards({
          stats: updatedStats,
          ownedCars: state.ownedCars,
          unlockedTrophies: state.unlockedTrophies,
        });
        const trophyMap = unlocked.reduce(
          (acc, trophy) => {
            acc[trophy.id] = new Date().toISOString();
            return acc;
          },
          { ...state.unlockedTrophies },
        );
        const rewardCoins = unlocked.reduce((sum, trophy) => sum + trophy.reward, 0);

        set({
          stats: updatedStats,
          coins: state.coins + result.coins + rewardCoins,
          runs: [result, ...state.runs].slice(0, 50),
          daily,
          unlockedTrophies: trophyMap,
        });

        return {
          previousBest,
          newBest,
          unlockedTrophies: unlocked,
          completedMissions,
          destinationRecord,
        };
      },

      evaluateLiveTrophies: (live) => {
        const state = get();
        const merged: Statistics = {
          ...state.stats,
          totalDistanceM: state.stats.totalDistanceM + live.distanceM,
          coinsEarned: state.stats.coinsEarned + live.coins,
          nearMisses: state.stats.nearMisses + live.nearMisses,
          highestSpeed: Math.max(state.stats.highestSpeed, live.topSpeedKph),
          driftDistanceM: state.stats.driftDistanceM + live.driftDistanceM,
          nitroUses: state.stats.nitroUses + live.nitroUses,
          checkpoints: state.stats.checkpoints + live.checkpoints,
          crashFreeStreakBest: Math.max(state.stats.crashFreeStreakBest, live.crashFreeStreakM),
          bestScore: Math.max(state.stats.bestScore, live.score),
          racesCompleted: state.stats.racesCompleted + (live.completed ? 1 : 0),
          runs: state.stats.runs + (live.completed ? 1 : 0),
          destinationRaces: {
            ...state.stats.destinationRaces,
            [live.destinationId]:
              (state.stats.destinationRaces[live.destinationId] ?? 0) +
              (live.completed ? 1 : 0),
          },
        };
        const unlocked = evaluateRewards({
          stats: merged,
          ownedCars: state.ownedCars,
          unlockedTrophies: state.unlockedTrophies,
        });
        if (unlocked.length === 0) return [];
        const trophyMap = unlocked.reduce(
          (acc, trophy) => {
            acc[trophy.id] = new Date().toISOString();
            return acc;
          },
          { ...state.unlockedTrophies },
        );
        const rewardCoins = unlocked.reduce((sum, trophy) => sum + trophy.reward, 0);
        set({
          unlockedTrophies: trophyMap,
          coins: state.coins + rewardCoins,
        });
        return unlocked;
      },

      claimDailyMission: (missionId) => {
        const state = get();
        const mission = state.daily.missions.find((item) => item.id === missionId);
        if (!mission) return { ok: false, message: 'Mission not found.' };
        if (mission.claimed) return { ok: false, message: 'Reward already claimed.' };
        if (mission.progress < mission.target) return { ok: false, message: 'Mission not complete yet.' };
        const updated = {
          ...state.daily,
          missions: state.daily.missions.map((item) =>
            item.id === missionId ? { ...item, claimed: true } : item,
          ),
        };
        set({ daily: updated, coins: state.coins + mission.reward });
        return { ok: true, message: `Claimed ${mission.reward} coins.` };
      },

      claimLongTermMission: (missionId) => {
        const state = get();
        const mission = LONG_TERM_MISSIONS.find((item) => item.id === missionId);
        if (!mission) return { ok: false, message: 'Mission not found.' };
        if (state.claimedLongTermMissions.includes(missionId)) {
          return { ok: false, message: 'Reward already claimed.' };
        }
        const progress = deriveLongTermProgress(state)[missionId] ?? 0;
        if (progress < mission.target) return { ok: false, message: 'Objective not complete yet.' };
        set({
          claimedLongTermMissions: [...state.claimedLongTermMissions, missionId],
          coins: state.coins + mission.reward,
        });
        return { ok: true, message: `Claimed ${mission.reward} coins.` };
      },

      updateSetting: (section, key, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: {
              ...state.settings[section],
              [key]: value,
            },
          },
        }));
      },

      updateSettings: (settings) => {
        set({ settings: normalizeSettings(settings) });
      },

      setKeyBinding: (action, code) => {
        set((state) => {
          const bindings = { ...state.settings.controls.keybindings };
          const existing = (Object.keys(bindings) as ControlAction[]).find(
            (key) => bindings[key] === code && key !== action,
          );
          const old = bindings[action];
          bindings[action] = code;
          if (existing) bindings[existing] = old;
          return {
            settings: {
              ...state.settings,
              controls: { ...state.settings.controls, keybindings: bindings },
            },
          };
        });
      },

      restoreDefaultSettings: () => set({ settings: DEFAULT_SETTINGS }),

      resetProgress: () => {
        const settings = get().settings;
        set({
          coins: 850,
          ownedCars: ['veloce-gt'],
          selectedCar: 'veloce-gt',
          unlockedDestinations: ['mountain-highway', 'city-night'],
          selectedDestination: 'mountain-highway',
          customizations: { 'veloce-gt': getDefaultCustomization(CARS[0]) },
          stats: { ...EMPTY_STATS, destinationRaces: {} },
          unlockedTrophies: {},
          claimedLongTermMissions: [],
          daily: { date: getTodayKey(), missions: generateDailyMissions() },
          runs: [],
          settings,
          tutorialSeen: false,
        });
      },

      setTutorialSeen: (value) => set({ tutorialSeen: value }),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Version 3 adds optional garage upgrades and fresh control settings.
      // Both are additive, so legacy V1/V2 payloads can be carried forward and
      // normalized by `merge` without discarding a player's progress.
      migrate: (persisted) => persisted as GameStore,
      partialize: (state) => ({
        coins: state.coins,
        ownedCars: state.ownedCars,
        selectedCar: state.selectedCar,
        unlockedDestinations: state.unlockedDestinations,
        selectedDestination: state.selectedDestination,
        customizations: state.customizations,
        stats: state.stats,
        unlockedTrophies: state.unlockedTrophies,
        claimedLongTermMissions: state.claimedLongTermMissions,
        daily: state.daily,
        runs: state.runs,
        settings: state.settings,
        tutorialSeen: state.tutorialSeen,
      }),
      merge: (persisted, current) => {
        const data = persisted as Partial<GameStore> | undefined;
        if (!data) return current;
        return {
          ...current,
          ...data,
          settings: normalizeSettings(data.settings),
          stats: { ...EMPTY_STATS, ...data.stats },
          daily: data.daily ?? current.daily,
          customizations: data.customizations ?? current.customizations,
          runs: data.runs ?? [],
          unlockedTrophies: data.unlockedTrophies ?? {},
          claimedLongTermMissions: data.claimedLongTermMissions ?? [],
          hydrated: true,
        };
      },
    },
  ),
);

export function useHydrated(): boolean {
  return useGameStore((state) => state.hydrated);
}

export function getTrophyExtras(
  stats: Statistics,
  ownedCars: string[],
  unlocked: Record<string, string>,
) {
  return getTrophyExtrasFor(stats, ownedCars.length, unlocked);
}

export function getDifficultyMultiplier(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'relaxed':
      return 0.8;
    case 'hard':
      return 1.2;
    case 'insane':
      return 1.45;
    default:
      return 1;
  }
}

export function getUnlockedTrophyCount(): number {
  return trophyCount(useGameStore.getState().unlockedTrophies);
}

export const SELECTABLE_CAR_IDS = CARS.map((car) => car.id);
export const SELECTABLE_DESTINATION_IDS = DESTINATIONS.map((destination) => destination.id);

export type { LongTermMission };

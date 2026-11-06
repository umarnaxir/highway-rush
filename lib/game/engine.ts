import * as THREE from 'three';
import type {
  CameraView,
  CarCustomization,
  CarDefinition,
  DestinationDefinition,
  EngineMode,
  GameEvent,
  HudFrame,
  HudTraffic,
  Quality,
  RunResult,
  Settings,
} from '@/lib/types';
import type { AudioManager } from '@/lib/audio/AudioManager';
import { effectiveCarStats } from '@/lib/data/cars';
import { createCarModel, type CarModel, type IndicatorState } from './carModel';
import { buildEnvironment, type EnvironmentHandle, ROAD_CONSTANTS } from './environment';
import { disposeObject3D, makeCanvasTexture } from './dispose';
import { InputController } from './input';

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  destination: DestinationDefinition;
  car: CarDefinition;
  customization: CarCustomization;
  settings: Settings;
  audio: AudioManager;
  bestScore: number;
  onHud: (hud: HudFrame) => void;
  onEvent: (event: GameEvent) => void;
  onModeChange: (mode: EngineMode) => void;
  onFinish: (result: RunResult) => void;
  onReady?: () => void;
}

interface TrafficUnit {
  model: CarModel;
  lane: number;
  targetX: number;
  speedMps: number;
  passed: boolean;
  collided: boolean;
  changeTimer: number;
  spin: number;
  active: boolean;
  color: string;
  wobble: number;
  laneChangeState: 'idle' | 'signaling' | 'changing';
  signalingTimer: number;
  intendedLane: number;
  indicatorState: IndicatorState;
}

interface CoinUnit {
  group: THREE.Group;
  active: boolean;
  spin: number;
}

interface Gate {
  group: THREE.Group;
  label: string;
}

const LANES = [-6.225, -2.075, 2.075, 6.225];
const TRAFFIC_COLORS = ['#f04444', '#eef0ec', '#202a38', '#f59e0b', '#8a66d9', '#38bdf8', '#4caa70', '#fb7185'];
const SPAWN_FAR = -250;
const DESPAWN_BEHIND = 42;
const CHECKPOINT_SPACING = 700;

const DIFFICULTY = {
  relaxed: { density: 0.72, trafficSpeed: 0.82, damage: 0.75 },
  standard: { density: 1, trafficSpeed: 1, damage: 1 },
  hard: { density: 1.22, trafficSpeed: 1.13, damage: 1.18 },
  insane: { density: 1.45, trafficSpeed: 1.26, damage: 1.35 },
} as const;

function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

function makeRunId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `run-${Date.now()}-${Math.floor(Math.random() * 99999)}`;
}

function qualityTrafficCount(quality: Quality): number {
  if (quality === 'low') return 7;
  if (quality === 'medium') return 10;
  return 13;
}

function makeGate(label: string, accent: string): Gate {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: '#181e28',
    roughness: 0.35,
    metalness: 0.75,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 2.2,
    roughness: 0.25,
  });
  const width = ROAD_CONSTANTS.width + 2.4;
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.36, 7.2, 0.36), metal);
    post.position.set((side * width) / 2, 3.6, 0);
    post.castShadow = true;
    group.add(post);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 6.2, 0.08), glow);
    strip.position.set((side * width) / 2 + side * 0.2, 3.6, 0.18);
    group.add(strip);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.2), metal);
    foot.position.set((side * width) / 2, 0.15, 0);
    group.add(foot);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, 0.45), metal);
  beam.position.set(0, 7.1, 0);
  group.add(beam);
  const glowBar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.96, 0.07, 0.1), glow);
  glowBar.position.set(0, 6.86, 0.22);
  group.add(glowBar);

  const texture = makeCanvasTexture(512, 96, (ctx) => {
    ctx.fillStyle = '#080d14';
    ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, 500, 84);
    ctx.font = '800 47px "Arial Narrow", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(label, 256, 52);
  });
  if (texture) {
    const signMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 2.15), signMaterial);
    sign.position.set(0, 5.55, 0.05);
    group.add(sign);
  }
  return { group, label };
}

export class HighwayRushEngine {
  private canvas: HTMLCanvasElement;
  private options: EngineOptions;
  private audio: AudioManager;
  private settings: Settings;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world = new THREE.Group();
  private environment: EnvironmentHandle;
  private player: CarModel;
  private traffic: TrafficUnit[] = [];
  private coins: CoinUnit[] = [];
  private playerGroup: THREE.Group;
  private nitroParticles: THREE.Points | null = null;
  private flameCones: THREE.Mesh[] = [];
  private flameMaterials: THREE.MeshBasicMaterial[] = [];
  private exhaustLights: THREE.PointLight[] = [];
  private sparkVelocities: Float32Array = new Float32Array(0);
  private sparkAges: Float32Array = new Float32Array(0);
  private speedLines: THREE.LineSegments | null = null;
  private backfireTimer = 0;
  private checkpointGate: Gate;
  private finishGate: Gate;
  private input: InputController;

  private mode: EngineMode = 'loading';
  private disposed = false;
  private endless = false;
  private difficulty: { density: number; trafficSpeed: number; damage: number };
  private damageMultiplier = 1;

  private speed = 0;
  private lateralVelocity = 0;
  private playerX = LANES[1];
  private targetX = LANES[1];
  private steerVisual = 0;
  private wheelSpin = 0;
  private distanceM = 0;
  private score = 0;
  private topSpeedKph = 0;
  private runCoins = 0;
  private runNearMisses = 0;
  private runDriftM = 0;
  private runNitroUses = 0;
  private runCheckpoints = 0;
  private crashes = 0;
  private crashFreeCurrent = 0;
  private crashFreeBest = 0;
  private elapsed = 0;
  private nitro = 100;
  private fuel = 100;
  private health = 100;
  private boosting = false;
  private drifting = false;
  private gear = 1;
  private rpm = 0.15;
  private combo = 0;
  private comboTimer = 0;
  private multiplier = 1;
  private invulnerable = 0;
  private wallCooldown = 0;
  private shake = 0;
  private nextCheckpoint = CHECKPOINT_SPACING;
  private lowFuelWarned = false;
  private coinSpawnTimer = 2;
  private trafficSpawnTimer = 1;
  private lastFuelWarning = 0;
  private lastFrame = 0;
  private hudTimer = 0;
  private fpsAccum = 0;
  private fpsFrames = 0;
  private fps = 60;
  private countdown = 0;
  private lastCountdownCeil = 4;
  private resizeObserver: ResizeObserver | null = null;
  private detachInput: (() => void) | null = null;
  private previousNitroPressed = false;
  private wasDrifting = false;
  private wasBoosting = false;
  private nitroCueCooldown = 0;
  private finishingTimer = 0;
  private finishTimer: number | null = null;
  private finishReason: RunResult['reason'] | null = null;
  private readyOrbit = 0;
  private lastGamepad = false;
  private blinkTimer = 0;
  private cameraMode: CameraView = 'exterior';
  private wasHonking = false;
  private previousSwitchCamPressed = false;

  constructor(options: EngineOptions) {
    this.options = options;
    this.canvas = options.canvas;
    this.audio = options.audio;
    this.settings = options.settings;
    this.difficulty =
      DIFFICULTY[options.settings.gameplay.difficulty as keyof typeof DIFFICULTY] ?? DIFFICULTY.standard;
    this.damageMultiplier = this.difficulty.damage;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.settings.gameplay.fov,
      this.aspect(),
      0.1,
      600,
    );
    this.camera.position.set(7, 3.8, -8.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.settings.graphics.antialias && !this.settings.graphics.performanceMode,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = options.destination.theme.timeOfDay === 'night' ? 1.25 : 1.08;
    this.renderer.shadowMap.enabled = this.settings.graphics.shadows && !this.settings.graphics.performanceMode;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setSize(this.width(), this.height(), false);
    this.applyPixelRatio();

    this.scene.add(this.world);
    this.environment = buildEnvironment(
      this.scene,
      options.destination,
      this.quality(),
    );
    this.environment.setShadows(
      this.settings.graphics.shadows && !this.settings.graphics.performanceMode,
      this.settings.graphics.shadowQuality,
    );

    this.player = createCarModel({
      paint: options.customization.paint,
      customization: options.customization,
      carClass: options.car.className,
      bodyStyle: options.car.bodyStyle,
      accent: options.car.accent,
      quality: this.quality(),
      isPlayer: true,
      headlights: options.destination.theme.timeOfDay === 'night' || options.destination.environment === 'forest',
    });
    this.playerGroup = this.player.group;
    this.playerGroup.position.set(this.playerX, 0, 0);
    this.player.setCockpitVisibility(this.cameraMode === 'cockpit');
    this.world.add(this.playerGroup);

    this.createTraffic();
    this.createCoins();
    this.createExhaustFX();
    this.createSpeedLines();

    this.checkpointGate = makeGate('CHECKPOINT', options.destination.theme.accent);
    this.finishGate = makeGate('FINISH', '#d7ff3f');
    this.checkpointGate.group.visible = false;
    this.finishGate.group.visible = false;
    this.world.add(this.checkpointGate.group);
    this.world.add(this.finishGate.group);

    this.input = new InputController(this.settings.controls.keybindings, () => {
      if (this.mode === 'running') this.pause();
    });
    this.detachInput = this.input.attach();
    this.input.setEnabled(false);

    this.attachEvents();
    this.mode = 'ready';
    this.emitHud(true);
    this.lastFrame = performance.now();
    this.renderer.setAnimationLoop(this.tick);
    this.options.onReady?.();
  }

  private width(): number {
    return this.canvas.clientWidth || window.innerWidth || 1;
  }

  private height(): number {
    return this.canvas.clientHeight || window.innerHeight || 1;
  }

  private aspect(): number {
    if (typeof window === 'undefined') return 1;
    return (this.canvas.clientWidth || window.innerWidth) / (this.canvas.clientHeight || window.innerHeight);
  }

  private quality(): Quality {
    if (this.settings.graphics.performanceMode) return 'low';
    return this.settings.graphics.effects;
  }

  private applyPixelRatio(): void {
    const base = Math.min(window.devicePixelRatio || 1, 2);
    const scale = this.settings.graphics.performanceMode ? 0.75 : 1;
    const renderScale = this.settings.graphics.renderScale;
    const dpr = Math.max(0.6, Math.min(2, base * scale * renderScale));
    this.renderer.setPixelRatio(dpr);
  }

  private attachEvents(): void {
    const onVisibility = () => {
      if (document.hidden) {
        if (this.mode === 'running') {
          this.pause();
          this.options.onEvent({ type: 'autopause' });
        }
        this.audio.setPaused(true);
      } else if (this.mode !== 'paused') {
        this.audio.setPaused(false);
      }
      this.lastFrame = performance.now();
    };
    const onResize = () => this.resize();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(onResize);
      this.resizeObserver.observe(this.canvas);
    }
    this.detachInput = (() => {
      const previous = this.detachInput;
      return () => {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        previous?.();
      };
    })();
  }

  private resize(): void {
    if (this.disposed) return;
    const width = this.width();
    const height = this.height();
    this.camera.aspect = width / height;
    this.camera.fov = this.currentFov();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.applyPixelRatio();
  }

  private currentFov(): number {
    const isPortrait = typeof window !== 'undefined' && window.innerWidth < window.innerHeight;
    const portraitBoost = isPortrait ? (this.cameraMode === 'cockpit' ? 6 : 10) : 0;
    const baseFov = (this.cameraMode === 'cockpit' ? this.settings.gameplay.fov + 4 : this.settings.gameplay.fov) + portraitBoost;
    const speedT = Math.min(1, this.speed / 80);
    const target = baseFov + speedT * 6 + (this.boosting ? 11 : 0);
    const motionScale = this.settings.accessibility.reducedMotion ? 0.35 : 1;
    return baseFov + (target - baseFov) * motionScale;
  }

  private createTraffic(): void {
    const baseCount = qualityTrafficCount(this.quality());
    const count = Math.round(baseCount * this.difficulty.density);
    for (let i = 0; i < count; i += 1) {
      const color = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
      const customization: CarCustomization = {
        paint: color,
        rim: i % 3 === 0 ? '#1f2937' : '#c4d0d9',
        spoiler: i % 4 === 0 ? 'sport' : 'none',
        wheels: 'sport',
        decal: 'none',
        underglow: null,
      };
      const model = createCarModel({
        paint: color,
        customization,
        carClass: (['sport', 'muscle', 'sport', 'offroad', 'super'] as const)[i % 5],
        accent: color,
        quality: this.quality() === 'high' ? 'medium' : 'low',
      });
      const lane = i % LANES.length;
      const z = -55 - i * 34;
      model.group.position.set(LANES[lane], 0, z);
      model.group.visible = false;
      this.world.add(model.group);
      this.traffic.push({
        model,
        lane,
        targetX: LANES[lane],
        speedMps: 22 + Math.random() * 16,
        passed: false,
        collided: false,
        changeTimer: 3 + Math.random() * 5,
        spin: Math.random() * 10,
        active: false,
        color,
        wobble: Math.random() * 10,
        laneChangeState: 'idle',
        signalingTimer: 0,
        intendedLane: lane,
        indicatorState: 'none',
      });
    }
  }

  private createCoins(): void {
    const geometry = new THREE.TorusGeometry(0.42, 0.13, 8, 18);
    const material = new THREE.MeshStandardMaterial({
      color: '#ffd43b',
      emissive: '#ffb300',
      emissiveIntensity: 1.5,
      metalness: 0.85,
      roughness: 0.22,
    });
    const innerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 16);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: '#ffe06a',
      emissive: '#ffca28',
      emissiveIntensity: 0.8,
      metalness: 0.7,
      roughness: 0.3,
    });
    for (let i = 0; i < 30; i += 1) {
      const group = new THREE.Group();
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      const inner = new THREE.Mesh(innerGeometry, innerMaterial);
      inner.rotation.x = Math.PI / 2;
      group.add(inner);
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1.5),
        new THREE.MeshBasicMaterial({
          color: '#ffd54a',
          transparent: true,
          opacity: 0.14,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(halo);
      group.position.set(0, -10, 0);
      group.visible = false;
      this.world.add(group);
      this.coins.push({ group, active: false, spin: Math.random() * 6 });
    }
  }

  private createExhaustFX(): void {
    const exPositions = this.player.exhaustPositions || [
      { x: -0.42, y: 0.45, z: 2.3 },
      { x: 0.42, y: 0.45, z: 2.3 },
    ];

    const flameGeo = new THREE.ConeGeometry(0.12, 1.4, 8);
    flameGeo.rotateX(-Math.PI / 2);
    flameGeo.translate(0, 0, 0.7);

    this.flameCones = [];
    this.flameMaterials = [];
    this.exhaustLights = [];

    exPositions.forEach((pos) => {
      const mat = new THREE.MeshBasicMaterial({
        color: '#00f2fe',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const cone = new THREE.Mesh(flameGeo, mat);
      cone.position.set(pos.x, pos.y, pos.z);
      cone.visible = false;
      this.playerGroup.add(cone);
      this.flameCones.push(cone);
      this.flameMaterials.push(mat);

      const light = new THREE.PointLight('#00f2fe', 0, 5, 2);
      light.position.set(pos.x, pos.y, pos.z + 0.3);
      this.playerGroup.add(light);
      this.exhaustLights.push(light);
    });

    const count = this.quality() === 'low' ? 32 : 72;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const ages = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      ages[i] = 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sparkVelocities = velocities;
    this.sparkAges = ages;

    const material = new THREE.PointsMaterial({
      color: '#ffd43b',
      size: 0.22,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.nitroParticles = new THREE.Points(geometry, material);
    this.nitroParticles.visible = true;
    this.world.add(this.nitroParticles);
  }

  private createSpeedLines(): void {
    const count = this.quality() === 'low' ? 35 : 90;
    const positions = new Float32Array(count * 6);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.2 + Math.random() * 8.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.65 + 2.8;
      const z = -Math.random() * 120;
      const len = 4 + Math.random() * 10;
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z + len;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.speedLines = new THREE.LineSegments(geometry, material);
    this.speedLines.visible = false;
    this.world.add(this.speedLines);
  }

  start(endless = false): void {
    if (this.disposed || this.mode === 'running' || this.mode === 'countdown') return;
    this.endless = endless;
    this.resetRun();
    this.mode = 'countdown';
    this.countdown = 3;
    this.lastCountdownCeil = 4;
    this.input.setEnabled(true);
    this.options.onModeChange(this.mode);
    this.audio.playCue('countdown');
    this.audio.setRaceActive(true);
    void this.audio.unlock().then((ok) => {
      if (!ok || this.disposed) return;
      if (this.mode === 'countdown' || this.mode === 'running') this.startRaceAudio();
    });
    this.emitHud(true);
  }

  private startRaceAudio(): void {
    this.audio.startEngine(this.options.car.engineProfile);
    this.audio.playAmbience(this.options.destination.environment);
    this.audio.playMusic(this.options.destination.music);
    this.audio.setPaused(false);
  }

  private resetRun(): void {
    this.speed = 0;
    this.lateralVelocity = 0;
    this.playerX = LANES[1];
    this.targetX = LANES[1];
    this.steerVisual = 0;
    this.wheelSpin = 0;
    this.distanceM = 0;
    this.score = 0;
    this.topSpeedKph = 0;
    this.runCoins = 0;
    this.runNearMisses = 0;
    this.runDriftM = 0;
    this.runNitroUses = 0;
    this.runCheckpoints = 0;
    this.crashes = 0;
    this.crashFreeCurrent = 0;
    this.crashFreeBest = 0;
    this.elapsed = 0;
    this.nitro = 100;
    this.fuel = 100;
    this.health = 100;
    this.boosting = false;
    this.drifting = false;
    this.wasDrifting = false;
    this.wasBoosting = false;
    this.gear = 1;
    this.rpm = 0.15;
    this.combo = 0;
    this.comboTimer = 0;
    this.multiplier = 1;
    this.invulnerable = 0;
    this.wallCooldown = 0;
    this.shake = 0;
    this.nextCheckpoint = CHECKPOINT_SPACING;
    this.lowFuelWarned = false;
    this.coinSpawnTimer = 1.6;
    this.trafficSpawnTimer = 0.8;
    this.finishingTimer = 0;
    this.finishReason = null;
    this.playerGroup.position.set(this.playerX, 0, 0);
    this.playerGroup.rotation.set(0, 0, 0);
    this.player.setBrake(false);
    this.player.setCockpitVisibility(this.cameraMode === 'cockpit');
    this.playerGroup.visible = true;

    this.traffic.forEach((unit, index) => {
      const lane = (index + 1) % LANES.length;
      this.resetTrafficUnit(unit, lane, -75 - index * 30 - Math.random() * 25);
    });
    this.coins.forEach((coin) => {
      coin.active = false;
      coin.group.visible = false;
      coin.group.position.y = -10;
    });
    this.checkpointGate.group.visible = false;
    this.finishGate.group.visible = false;
    this.flameCones.forEach((cone) => {
      cone.visible = false;
    });
    this.exhaustLights.forEach((light) => {
      light.intensity = 0;
    });
    if (this.speedLines) this.speedLines.visible = false;
    if (this.nitroParticles) {
      const attr = this.nitroParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = attr.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) positions[i + 1] = -100;
      attr.needsUpdate = true;
    }
    this.camera.position.set(0, 5.2, 12.5);
    this.input.clearTransient();
  }

  private resetTrafficUnit(unit: TrafficUnit, lane: number, z: number): void {
    unit.lane = lane;
    unit.targetX = LANES[lane];
    unit.speedMps = (18 + Math.random() * 22) * this.difficulty.trafficSpeed;
    unit.passed = false;
    unit.collided = false;
    unit.changeTimer = 3 + Math.random() * 5;
    unit.active = true;
    unit.laneChangeState = 'idle';
    unit.signalingTimer = 0;
    unit.intendedLane = lane;
    unit.indicatorState = 'none';
    unit.model.setIndicatorState('none');
    unit.model.group.visible = true;
    unit.model.group.position.set(LANES[lane], 0, z);
    unit.model.group.rotation.set(0, 0, 0);
    unit.model.setBrake(false);
  }

  private spawnTraffic(unit?: TrafficUnit): void {
    const target = unit ?? this.traffic.find((car) => !car.active);
    if (!target) return;
    let lane = Math.floor(Math.random() * LANES.length);
    if (Math.abs(LANES[lane] - this.playerX) < 0.6) {
      lane = (lane + 1 + Math.floor(Math.random() * 3)) % LANES.length;
    }
    const z = SPAWN_FAR - Math.random() * 55;
    // Avoid stacking cars in the same lane.
    const blocked = this.traffic.some(
      (car) => car !== target && car.active && car.lane === lane && Math.abs(car.model.group.position.z - z) < 26,
    );
    if (blocked) {
      target.active = false;
      target.model.group.visible = false;
      return;
    }
    this.resetTrafficUnit(target, lane, z);
  }

  private spawnCoins(): void {
    const lane = Math.floor(Math.random() * LANES.length);
    const inactive = this.coins.filter((coin) => !coin.active).slice(0, 3);
    if (inactive.length === 0) return;
    inactive.forEach((coin, index) => {
      coin.active = true;
      coin.group.visible = true;
      coin.group.position.set(LANES[lane], 0.95, -175 - index * 9);
      coin.spin = Math.random() * 6;
    });
  }

  private tick = (time: number): void => {
    if (this.disposed) return;
    const rawDt = (time - this.lastFrame) / 1000;
    this.lastFrame = time;
    const dt = Math.min(0.05, Math.max(0, rawDt));

    if (this.mode === 'countdown') {
      this.countdown -= dt;
      const ceil = Math.max(0, Math.ceil(this.countdown));
      if (ceil !== this.lastCountdownCeil) {
        this.lastCountdownCeil = ceil;
        if (ceil > 0) this.audio.playCue('countdown');
        else {
          this.mode = 'running';
          this.options.onModeChange(this.mode);
          this.audio.playCue('go');
        }
      }
      this.idleVehicle(dt, true);
      this.updateCamera(dt, true);
    } else if (this.mode === 'running') {
      this.updateGame(dt);
      this.updateCamera(dt, false);
    } else if (this.mode === 'ready') {
      this.readyOrbit += dt;
      this.idleVehicle(dt, false);
      this.updateReadyCamera(dt);
    } else {
      this.updateCamera(dt, this.mode === 'paused');
    }

    const currentThrottle = this.input.getState().throttle;
    this.updateExhaustFX(dt, currentThrottle);
    this.updateSpeedLines(dt, this.speed * 3.6);
    this.fpsAccum += rawDt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
    this.hudTimer += dt;
    if (this.hudTimer >= 0.07) {
      this.hudTimer = 0;
      this.emitHud();
    }

    try {
      this.renderer.render(this.scene, this.camera);
    } catch {
      this.options.onEvent({ type: 'error', message: 'The 3D renderer stopped unexpectedly.' });
    }
  };

  private idleVehicle(dt: number, rev: boolean): void {
    this.steerVisual = damp(this.steerVisual, 0, 4, dt);
    this.playerGroup.rotation.z = damp(this.playerGroup.rotation.z, 0, 4, dt);
    this.playerGroup.rotation.y = damp(this.playerGroup.rotation.y, 0, 4, dt);
    this.playerGroup.position.x = damp(this.playerGroup.position.x, this.playerX, 5, dt);
    this.playerGroup.position.y = Math.sin(performance.now() * 0.002) * 0.008 + 0.01;
    this.rpm = damp(this.rpm, rev ? 0.28 : 0.12, 3, dt);
    if (rev) this.audio.updateEngine({
      rpm: this.rpm,
      throttle: 0.2,
      speedKph: 0,
      drifting: false,
      boosting: false,
      paused: false,
    });
  }

  private updateReadyCamera(dt: number): void {
    const angle = this.readyOrbit * 0.18 + 0.6;
    const distance = 9.4 * this.settings.gameplay.cameraDistance;
    const targetX = Math.sin(angle) * distance;
    const targetZ = Math.cos(angle) * distance - 2;
    if (this.settings.accessibility.reducedMotion) {
      this.camera.position.x = damp(this.camera.position.x, 6.4, 2, dt);
      this.camera.position.z = damp(this.camera.position.z, -8.5, 2, dt);
    } else {
      this.camera.position.x = damp(this.camera.position.x, targetX, 1.6, dt);
      this.camera.position.z = damp(this.camera.position.z, targetZ, 1.6, dt);
    }
    this.camera.position.y = damp(this.camera.position.y, 3.8, 2, dt);
    this.camera.lookAt(this.playerX * 0.2, 0.9, 0);
  }

  private updateCamera(dt: number, paused: boolean): void {
    if (this.cameraMode === 'cockpit') {
      const speedT = Math.min(1, this.speed / 85);
      const accelPitch = (this.speed > 5 ? 0.012 : 0) + (this.boosting ? 0.02 : 0);
      const headSway = this.steerVisual * -0.04;
      const targetX = this.playerX - 0.28 + headSway;
      const targetY = 1.34 - accelPitch;
      const targetZ = 0.14;

      const lambda = paused ? 6 : 14;
      this.camera.position.x = damp(this.camera.position.x, targetX, lambda, dt);
      this.camera.position.y = damp(this.camera.position.y, targetY, lambda, dt);
      this.camera.position.z = damp(this.camera.position.z, targetZ, lambda, dt);

      const shakeAmount =
        this.settings.accessibility.reducedMotion || paused || this.mode !== 'running'
          ? 0
          : this.shake * 0.45 + (this.boosting ? 0.014 : 0) + speedT * 0.007;
      if (shakeAmount > 0.001) {
        const t = performance.now() * 0.02;
        this.camera.position.x += Math.sin(t * 1.7) * shakeAmount;
        this.camera.position.y += Math.sin(t * 2.3 + 1.7) * shakeAmount * 0.6;
      }
      this.shake = Math.max(0, this.shake - dt * 2.4);

      // Focus straight down the highway on the road lanes and traffic
      const lookDist = 26;
      const lookTargetX = this.playerX - 0.28 + this.steerVisual * 1.3;
      const lookTargetY = 0.88 + accelPitch * 0.3;
      const lookTargetZ = -lookDist;
      this.camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);
      this.camera.rotation.z += -this.steerVisual * 0.035;

      const nextFov = this.currentFov();
      if (Math.abs(this.camera.fov - nextFov) > 0.01) {
        this.camera.fov = damp(this.camera.fov, nextFov, 4, dt);
        this.camera.updateProjectionMatrix();
      }

      this.player.setSteeringWheelRotation(-this.steerVisual * 1.8);
      this.player.updateIndicators(this.elapsed);
      this.player.updateTelemetry?.(Math.round(this.speed * 3.6), this.rpm, this.gear);
      return;
    }

    const isPortrait = typeof window !== 'undefined' && window.innerWidth < window.innerHeight;
    const speedT = Math.min(1, this.speed / 85);
    const cameraDistance = (9.2 + (isPortrait ? 2.0 : 0)) * this.settings.gameplay.cameraDistance + speedT * 1.3;
    const height = (4.55 + (isPortrait ? 1.2 : 0)) + speedT * 0.55 + (this.boosting ? 0.1 : 0);
    const targetX = this.playerX * 0.62 + this.steerVisual * -0.65;
    const targetY = height;
    const targetZ = cameraDistance;
    const lambda = paused ? 3 : 4.2;
    this.camera.position.x = damp(this.camera.position.x, targetX, lambda, dt);
    this.camera.position.y = damp(this.camera.position.y, targetY, lambda, dt);
    this.camera.position.z = damp(this.camera.position.z, targetZ, lambda, dt);

    const shakeAmount =
      this.settings.accessibility.reducedMotion || paused || this.mode !== 'running'
        ? 0
        : this.shake + (this.boosting ? 0.025 : 0) + speedT * 0.012;
    if (shakeAmount > 0.001) {
      const t = performance.now() * 0.02;
      this.camera.position.x += Math.sin(t * 1.7) * shakeAmount;
      this.camera.position.y += Math.sin(t * 2.3 + 1.7) * shakeAmount * 0.7;
      this.camera.position.z += Math.cos(t * 1.9) * shakeAmount * 0.4;
    }
    this.shake = Math.max(0, this.shake - dt * 2.4);

    const lookAhead = Math.min(14, 8 + speedT * 9);
    this.camera.lookAt(
      this.playerX * 0.4 + this.steerVisual * 0.45,
      0.85,
      -lookAhead,
    );
    const nextFov = this.currentFov();
    if (Math.abs(this.camera.fov - nextFov) > 0.01) {
      this.camera.fov = damp(this.camera.fov, nextFov, 4, dt);
      this.camera.updateProjectionMatrix();
    }

    this.player.setSteeringWheelRotation(-this.steerVisual * 1.8);
    this.player.updateIndicators(this.elapsed);
  }

  private updateGame(dt: number): void {
    const input = this.input.getState();
    this.lastGamepad = input.gamepad;
    this.elapsed += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.wallCooldown = Math.max(0, this.wallCooldown - dt);
    this.nitroCueCooldown = Math.max(0, this.nitroCueCooldown - dt);
    this.blinkTimer += dt;

    if (input.switchCamera && !this.previousSwitchCamPressed) {
      this.toggleCamera();
    }
    this.previousSwitchCamPressed = input.switchCamera;

    if (input.horn && !this.wasHonking) {
      this.audio.startHorn();
      this.wasHonking = true;
    } else if (!input.horn && this.wasHonking) {
      this.audio.stopHorn();
      this.wasHonking = false;
    }

    const stats = effectiveCarStats(this.options.car, this.options.customization);
    const maxSpeedMps = (210 + stats.speed * 1.18) / 3.6;
    const nitroMax = maxSpeedMps * 1.13;
    const accel = 5.6 + stats.acceleration * 0.115;
    const braking = 14 + stats.braking * 0.25;
    const handling = 8.5 + stats.handling * 0.085;

    const wantsNitro = input.nitro && this.nitro > 0.5 && this.fuel > 1;
    if (wantsNitro && !this.previousNitroPressed) {
      this.runNitroUses += 1;
      this.audio.playCue('nitro');
      this.shake = Math.max(this.shake, 0.08);
      this.options.onEvent({ type: 'nitro', active: true });
    }
    if (!wantsNitro && this.previousNitroPressed) {
      this.options.onEvent({ type: 'nitro', active: false });
    }
    this.previousNitroPressed = wantsNitro;
    this.wasBoosting = this.boosting;
    this.boosting = wantsNitro;

    if (this.boosting) {
      this.nitro = Math.max(0, this.nitro - dt * 22);
      this.speed += accel * 1.35 * dt;
    } else {
      this.nitro = Math.min(100, this.nitro + dt * (2.8 + stats.nitro * 0.025));
    }

    if (input.throttle > 0.05 && this.fuel > 0) {
      const speedRatio = this.speed / maxSpeedMps;
      this.speed += accel * input.throttle * (1 - Math.min(0.72, speedRatio * 0.62)) * dt;
    } else {
      this.speed -= (2.4 + this.speed * 0.04) * dt;
    }

    if (input.brake > 0.05) {
      this.speed -= braking * input.brake * dt;
      this.player.setBrake(true);
    } else {
      this.player.setBrake(false);
    }

    // Road drag and hard caps.
    this.speed -= this.speed * this.speed * 0.0008 * dt;
    if (this.speed > (this.boosting ? nitroMax : maxSpeedMps)) {
      this.speed = damp(this.speed, this.boosting ? nitroMax : maxSpeedMps, 3, dt);
    }
    this.speed = Math.max(0, this.speed);
    const speedKph = this.speed * 3.6;
    this.topSpeedKph = Math.max(this.topSpeedKph, speedKph);

    // Fuel system.
    this.fuel = Math.max(0, this.fuel - dt * (0.24 + this.speed * 0.0021));
    if (this.fuel < 22 && !this.lowFuelWarned) {
      this.lowFuelWarned = true;
      this.options.onEvent({ type: 'lowFuel' });
      this.audio.playCue('error');
    }
    if (this.fuel <= 0) {
      this.finishRun('fuel');
      return;
    }
    if (this.fuel > 30) this.lowFuelWarned = false;

    // Nitro and run counters.
    const distanceDelta = this.speed * dt;
    this.distanceM += distanceDelta;
    this.crashFreeCurrent += distanceDelta;
    this.crashFreeBest = Math.max(this.crashFreeBest, this.crashFreeCurrent);
    this.score += distanceDelta * 2 + speedKph * dt * 0.75;

    // Steering / lateral motion.
    const sensitivity = this.settings.controls.sensitivity;
    const grip = input.brake > 0.3 ? 3.1 : 6.2 + stats.handling * 0.025;
    const targetLateral = input.steer * handling * sensitivity;
    this.lateralVelocity = damp(this.lateralVelocity, targetLateral, grip, dt);
    this.playerX += this.lateralVelocity * dt;
    if (this.playerX > ROAD_CONSTANTS.width / 2 - 1.15) {
      this.playerX = ROAD_CONSTANTS.width / 2 - 1.15;
      this.lateralVelocity *= -0.25;
      this.scrapeWall();
    } else if (this.playerX < -ROAD_CONSTANTS.width / 2 + 1.15) {
      this.playerX = -ROAD_CONSTANTS.width / 2 + 1.15;
      this.lateralVelocity *= -0.25;
      this.scrapeWall();
    }
    this.targetX = this.playerX;
    this.steerVisual = damp(this.steerVisual, input.steer, 6, dt);

    this.drifting =
      this.speed > 22 &&
      Math.abs(input.steer) > 0.3 &&
      (Math.abs(this.lateralVelocity) > 3 || input.brake > 0.2);
    if (this.drifting) {
      const drift = this.speed * dt * Math.min(1, Math.abs(input.steer) * 1.25) * 0.55;
      this.runDriftM += drift;
      this.score += drift * 4;
    }

    // Visuals.
    this.playerGroup.position.x = damp(this.playerGroup.position.x, this.playerX, 14, dt);
    this.playerGroup.rotation.z = damp(
      this.playerGroup.rotation.z,
      -this.steerVisual * 0.055 - this.lateralVelocity * 0.006,
      7,
      dt,
    );
    const driftYaw = this.drifting ? this.steerVisual * 0.22 : 0;
    this.playerGroup.rotation.y = damp(this.playerGroup.rotation.y, driftYaw, 5, dt);
    this.playerGroup.position.y = Math.sin(performance.now() * 0.008) * 0.006 * Math.min(1, this.speed / 30);
    this.wheelSpin -= this.speed * dt * 2.4;
    this.player.setWheelSpin(this.wheelSpin);
    this.player.bodyMaterial.emissive.set(this.boosting ? this.options.destination.theme.accent : '#000000');
    this.player.bodyMaterial.emissiveIntensity = this.boosting ? 0.12 : 0;

    // Gearbox + audio.
    const ratio = Math.min(0.999, this.speed / maxSpeedMps);
    const nextGear = Math.min(6, 1 + Math.floor(ratio * 6));
    if (nextGear !== this.gear) {
      this.gear = nextGear;
      this.backfireTimer = 0.22;
      this.audio.playCue('shift');
      this.options.onEvent({ type: 'gear', gear: this.gear });
    }
    const gearLow = [0, 0, 0.16, 0.33, 0.5, 0.67, 0.84][this.gear];
    const rpmTarget = Math.min(1, gearLow + ((ratio * 6) % 1) * 0.16 + (this.boosting ? 0.08 : 0));
    this.rpm = damp(this.rpm, Math.max(0.1, rpmTarget), 8, dt);
    this.audio.updateEngine({
      rpm: this.rpm,
      throttle: input.throttle,
      speedKph,
      drifting: this.drifting,
      boosting: this.boosting,
      paused: false,
    });
    if (this.drifting !== this.wasDrifting) {
      this.options.onEvent({ type: 'drift', active: this.drifting });
      this.wasDrifting = this.drifting;
    }

    // Combo decay.
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0 && this.combo > 0) {
      this.combo = Math.max(0, this.combo - dt * 1.6);
      if (this.combo < 0.5) this.combo = 0;
    }
    this.multiplier = 1 + Math.min(3, this.combo * 0.12);

    this.environment.update(dt, distanceDelta, speedKph);
    this.updateTraffic(dt, distanceDelta);
    this.updateCoins(dt, distanceDelta);
    this.updateCheckpoints();

    // Checkpoint and finish gates.
    this.checkpointGate.group.position.set(0, 0, -(this.nextCheckpoint - this.distanceM));
    this.checkpointGate.group.visible =
      this.mode === 'running' && this.checkpointGate.group.position.z > -440;
    if (!this.endless) {
      this.finishGate.group.position.set(0, 0, -(this.options.destination.distanceTarget - this.distanceM));
      this.finishGate.group.visible =
        this.mode === 'running' && this.finishGate.group.position.z > -440;
    } else {
      this.finishGate.group.visible = false;
    }

    if (!this.endless && this.distanceM >= this.options.destination.distanceTarget) {
      this.finishRun('finish');
      return;
    }

    this.player.bodyMaterial.emissiveIntensity = 0.12;
    this.player.accentMaterials.forEach((material) => {
      material.emissiveIntensity = this.boosting ? 1.2 : 0.45;
    });

    if (this.combo > 0) {
      this.comboTimer = Math.min(5, this.comboTimer);
    }
    this.shake = Math.max(this.shake, this.boosting ? 0.025 : 0);
    this.lastFuelWarning = Math.max(0, this.lastFuelWarning - dt);
  }

  private scrapeWall(): void {
    if (this.wallCooldown > 0) return;
    this.wallCooldown = 0.8;
    this.health = Math.max(0, this.health - 5 * this.damageMultiplier);
    this.speed *= 0.9;
    this.shake = Math.max(this.shake, 0.12);
    this.audio.playCue('crash');
    this.options.onEvent({ type: 'collision', severity: 0.3, health: this.health });
    if (this.health <= 0) this.finishRun('crash');
  }

  private updateTraffic(dt: number, distanceDelta: number): void {
    const playerZ = 0;
    for (const unit of this.traffic) {
      if (!unit.active) continue;
      const group = unit.model.group;

      // Update indicator blinking animations for AI car
      unit.model.updateIndicators(this.elapsed);

      // Safe following distance and braking logic for cars ahead in the same lane
      const carAhead = this.traffic.find(
        (other) =>
          other !== unit &&
          other.active &&
          other.lane === unit.lane &&
          other.model.group.position.z < group.position.z &&
          group.position.z - other.model.group.position.z < 22,
      );
      let isBraking = false;
      if (carAhead) {
        unit.speedMps = damp(unit.speedMps, Math.min(unit.speedMps, carAhead.speedMps * 0.94), 2.2, dt);
        isBraking = true;
      }

      // React to player horn (yield to open lane or accelerate)
      if (this.wasHonking && group.position.z < -2 && group.position.z > -42) {
        const distFromPlayerLane = Math.abs(group.position.x - this.playerX);
        if (distFromPlayerLane < 2.4) {
          if (unit.laneChangeState === 'idle') {
            const canGoLeft = unit.lane > 0;
            const canGoRight = unit.lane < LANES.length - 1;
            const tryLanes = canGoRight && canGoLeft
              ? (Math.random() > 0.5 ? [unit.lane + 1, unit.lane - 1] : [unit.lane - 1, unit.lane + 1])
              : canGoRight ? [unit.lane + 1] : canGoLeft ? [unit.lane - 1] : [];
            for (const targetLane of tryLanes) {
              const blocked = this.traffic.some(
                (other) =>
                  other !== unit &&
                  other.active &&
                  other.lane === targetLane &&
                  Math.abs(other.model.group.position.z - group.position.z) < 14,
              );
              if (!blocked) {
                unit.intendedLane = targetLane;
                unit.laneChangeState = 'signaling';
                unit.signalingTimer = 0.45;
                unit.indicatorState = targetLane > unit.lane ? 'right' : 'left';
                unit.model.setIndicatorState(unit.indicatorState);
                break;
              }
            }
            if (unit.laneChangeState === 'idle') {
              unit.speedMps = Math.min(unit.speedMps + 12 * dt, 42);
            }
          }
        }
      }

      // Natural Lane Change State Machine
      if (unit.laneChangeState === 'idle') {
        unit.changeTimer -= dt;
        if (unit.changeTimer <= 0) {
          unit.changeTimer = 3.6 + Math.random() * 5.0;
          if (Math.random() < 0.4) {
            const canGoLeft = unit.lane > 0;
            const canGoRight = unit.lane < LANES.length - 1;
            const dir = canGoLeft && canGoRight ? (Math.random() > 0.5 ? 1 : -1) : canGoRight ? 1 : -1;
            const nextLane = unit.lane + dir;

            const trafficBlocked = this.traffic.some(
              (other) =>
                other !== unit &&
                other.active &&
                other.lane === nextLane &&
                Math.abs(other.model.group.position.z - group.position.z) < 16,
            );

            // Never cut off player if closing in fast
            const playerLaneTarget = Math.abs(LANES[nextLane] - this.playerX) < 2.0;
            const playerBehind = group.position.z > -35 && group.position.z < 8;
            const playerClosingFast = this.speed > unit.speedMps + 10;
            const playerBlocked = playerLaneTarget && playerBehind && playerClosingFast;

            if (!trafficBlocked && !playerBlocked) {
              unit.intendedLane = nextLane;
              unit.laneChangeState = 'signaling';
              unit.signalingTimer = 1.2 + Math.random() * 0.4;
              unit.indicatorState = nextLane > unit.lane ? 'right' : 'left';
              unit.model.setIndicatorState(unit.indicatorState);
            }
          }
        }
      } else if (unit.laneChangeState === 'signaling') {
        unit.signalingTimer -= dt;
        const trafficBlocked = this.traffic.some(
          (other) =>
            other !== unit &&
            other.active &&
            other.lane === unit.intendedLane &&
            Math.abs(other.model.group.position.z - group.position.z) < 13,
        );
        const playerLaneTarget = Math.abs(LANES[unit.intendedLane] - this.playerX) < 2.0;
        const playerBehind = group.position.z > -30 && group.position.z < 6;
        const playerClosingFast = this.speed > unit.speedMps + 12;
        const playerBlocked = playerLaneTarget && playerBehind && playerClosingFast;

        if (trafficBlocked || playerBlocked) {
          unit.laneChangeState = 'idle';
          unit.indicatorState = 'none';
          unit.model.setIndicatorState('none');
          unit.changeTimer = 2.5 + Math.random() * 2.5;
        } else if (unit.signalingTimer <= 0) {
          unit.laneChangeState = 'changing';
          unit.lane = unit.intendedLane;
          unit.targetX = LANES[unit.intendedLane];
        }
      } else if (unit.laneChangeState === 'changing') {
        const dxLane = LANES[unit.lane] - group.position.x;
        group.rotation.z = damp(group.rotation.z, -dxLane * 0.06, 6, dt);

        if (Math.abs(dxLane) < 0.1) {
          unit.laneChangeState = 'idle';
          unit.indicatorState = 'none';
          unit.model.setIndicatorState('none');
          group.rotation.z = 0;
          unit.changeTimer = 4.0 + Math.random() * 5.0;
        }
      }

      unit.targetX = damp(unit.targetX, LANES[unit.lane], 2.8, dt);
      group.position.x = damp(group.position.x, unit.targetX + Math.sin((unit.wobble += dt) * 0.7) * 0.04, 3.8, dt);
      const relativeSpeed = this.speed - unit.speedMps;
      group.position.z += relativeSpeed * dt;

      unit.spin -= unit.speedMps * dt * 2.3;
      unit.model.setWheelSpin(unit.spin);
      unit.model.setBrake(isBraking || relativeSpeed < -2);

      const dx = Math.abs(group.position.x - this.playerX);
      const dz = Math.abs(group.position.z - playerZ);

      if (!unit.collided && this.invulnerable <= 0 && dx < 1.72 && dz < 3.75) {
        this.handleTrafficCollision(unit);
        continue;
      }

      if (!unit.passed && group.position.z > 0.9) {
        unit.passed = true;
        if (!unit.collided) {
          if (dx < 4.25 && dx > 1.5 && speedKphFromMps(this.speed) > 95) {
            this.registerNearMiss(unit);
          } else {
            this.score += 40;
          }
        }
      }

      if (group.position.z > DESPAWN_BEHIND) {
        unit.active = false;
        unit.model.group.visible = false;
        this.recycleTraffic();
      }
    }

    // Replace recycled traffic gradually.
    if (this.traffic.some((car) => !car.active)) {
      this.trafficSpawnTimer -= dt;
      if (this.trafficSpawnTimer <= 0) {
        this.trafficSpawnTimer = 0.7 + Math.random() * 0.8;
        this.spawnTraffic();
      }
    }
  }

  private recycleTraffic(): void {
    const inactive = this.traffic.find((car) => !car.active);
    if (inactive) this.spawnTraffic(inactive);
  }

  private registerNearMiss(unit: TrafficUnit): void {
    this.combo = Math.min(24, this.combo + 1);
    this.comboTimer = 5;
    this.multiplier = 1 + Math.min(3, this.combo * 0.12);
    this.runNearMisses += 1;
    const points = Math.round(150 * this.multiplier);
    this.score += points;
    this.nitro = Math.min(100, this.nitro + 5);
    this.shake = Math.max(this.shake, 0.045);
    this.audio.playCue('nearMiss');
    this.options.onEvent({ type: 'nearMiss', combo: this.combo, points });
    this.checkpointGate.group.userData.lastNearMiss = unit.color;
  }

  private handleTrafficCollision(unit: TrafficUnit): void {
    unit.collided = true;
    this.crashes += 1;
    this.crashFreeCurrent = 0;
    this.invulnerable = 1.7;
    this.combo = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.health = Math.max(0, this.health - 34 * this.damageMultiplier);
    this.speed *= 0.5;
    this.nitro = Math.max(0, this.nitro - 18);
    this.shake = 0.36;
    const direction = unit.model.group.position.x > this.playerX ? -1 : 1;
    this.lateralVelocity = direction * 4.5;
    this.playerX += direction * 0.5;
    unit.model.group.position.z = 22;
    this.audio.playCue('crash');
    this.options.onEvent({ type: 'collision', severity: 1, health: this.health });
    if (this.health <= 0) {
      this.finishRun('crash');
    }
  }

  private updateCoins(dt: number, distanceDelta: number): void {
    this.coinSpawnTimer -= dt;
    if (this.coinSpawnTimer <= 0) {
      this.coinSpawnTimer = 1.5 + Math.random() * 1.4;
      this.spawnCoins();
    }
    for (const coin of this.coins) {
      if (!coin.active) continue;
      coin.group.position.z += distanceDelta;
      coin.spin += dt * 4;
      coin.group.rotation.y = coin.spin;
      coin.group.position.y = 0.95 + Math.sin(coin.spin * 0.8) * 0.08;
      if (Math.abs(coin.group.position.z) < 2.1 && Math.abs(coin.group.position.x - this.playerX) < 1.5) {
        coin.active = false;
        coin.group.visible = false;
        this.runCoins += 1;
        this.score += 35 * this.multiplier;
        this.nitro = Math.min(100, this.nitro + 4);
        this.audio.playCue('coin');
        this.options.onEvent({ type: 'coin', amount: 1, total: this.runCoins });
      } else if (coin.group.position.z > 16) {
        coin.active = false;
        coin.group.visible = false;
      }
    }
  }

  private updateCheckpoints(): void {
    if (this.distanceM < this.nextCheckpoint) return;
    this.runCheckpoints += 1;
    const bonus = 600 + this.runCheckpoints * 150;
    this.score += bonus;
    this.fuel = Math.min(100, this.fuel + 32);
    this.nitro = Math.min(100, this.nitro + 22);
    this.nextCheckpoint += CHECKPOINT_SPACING;
    this.audio.playCue('checkpoint');
    this.options.onEvent({
      type: 'checkpoint',
      index: this.runCheckpoints,
      bonus,
      fuel: Math.round(this.fuel),
    });
    this.checkpointGate.group.position.z = -(this.nextCheckpoint - this.distanceM);
  }

  private updateExhaustFX(dt: number, throttle: number): void {
    this.backfireTimer = Math.max(0, this.backfireTimer - dt);
    const isNitro = this.boosting && this.mode === 'running';
    const isAccelerating = throttle > 0.75 && this.rpm > 0.55 && this.mode === 'running';
    const isBackfiring = this.backfireTimer > 0 && this.mode === 'running';

    const hasFlame = isNitro || isAccelerating || isBackfiring;
    const now = performance.now();

    for (let i = 0; i < this.flameCones.length; i += 1) {
      const cone = this.flameCones[i];
      const mat = this.flameMaterials[i];
      const light = this.exhaustLights[i];

      if (!hasFlame) {
        cone.visible = false;
        if (light) light.intensity = 0;
        continue;
      }

      cone.visible = true;
      const jitter = Math.sin(now * 0.05 + i * 2.3) * 0.15;

      if (isNitro) {
        // High intensity blue/cyan flame jet
        mat.color.set('#00f2fe');
        cone.scale.set(1.1 + jitter, 1.1 + jitter, 1.8 + jitter * 1.5);
        mat.opacity = 0.95;
        if (light) {
          light.color.set('#00f2fe');
          light.intensity = 2.4 + jitter;
        }
      } else if (isBackfiring) {
        // Explosive burst of orange flame
        mat.color.set('#ff5722');
        cone.scale.set(1.4, 1.4, 1.3);
        mat.opacity = 0.9;
        if (light) {
          light.color.set('#ff7043');
          light.intensity = 2.8;
        }
      } else {
        // Aggressive acceleration flame lick
        mat.color.set('#ff9800');
        const lick = Math.sin(now * 0.04 + i) > 0.35 ? 0.6 + jitter * 0.8 : 0;
        cone.scale.set(0.8, 0.8, lick);
        mat.opacity = lick > 0 ? 0.75 : 0;
        if (light) {
          light.color.set('#ff9800');
          light.intensity = lick * 1.2;
        }
      }
    }

    // Spark / ember particle updates
    if (this.nitroParticles) {
      const attr = this.nitroParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = attr.array as Float32Array;
      const count = positions.length / 3;
      const exPositions = this.player.exhaustPositions || [
        { x: -0.42, y: 0.45, z: 2.3 },
        { x: 0.42, y: 0.45, z: 2.3 },
      ];

      for (let i = 0; i < count; i += 1) {
        this.sparkAges[i] += dt * (isNitro ? 3.5 : 2.5);
        if (this.sparkAges[i] >= 1) {
          if (hasFlame) {
            this.sparkAges[i] = 0;
            const ex = exPositions[i % exPositions.length];
            positions[i * 3] = this.playerX + ex.x + (Math.random() - 0.5) * 0.12;
            positions[i * 3 + 1] = ex.y + (Math.random() - 0.5) * 0.08;
            positions[i * 3 + 2] = ex.z + 0.1;
            this.sparkVelocities[i * 3] = (Math.random() - 0.5) * 1.8;
            this.sparkVelocities[i * 3 + 1] = (Math.random() - 0.2) * 1.2;
            this.sparkVelocities[i * 3 + 2] = 12 + Math.random() * (isNitro ? 26 : 12);
          } else {
            positions[i * 3 + 1] = -100;
          }
        } else {
          positions[i * 3] += this.sparkVelocities[i * 3] * dt;
          positions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * dt;
          positions[i * 3 + 2] += (this.sparkVelocities[i * 3 + 2] + this.speed) * dt;
        }
      }
      attr.needsUpdate = true;
    }
  }

  private updateSpeedLines(dt: number, speedKph: number): void {
    if (!this.speedLines) return;
    const isFast = speedKph > 115 || this.boosting;
    const visible = isFast && this.mode === 'running';
    this.speedLines.visible = visible;
    if (!visible) return;

    const mat = this.speedLines.material as THREE.LineBasicMaterial;
    const targetOpacity = Math.min(0.85, (speedKph - 110) / 110 + (this.boosting ? 0.35 : 0));
    mat.opacity = damp(mat.opacity, targetOpacity, 6, dt);
    mat.color.set(this.boosting ? '#00f2fe' : '#38bdf8');

    const attr = this.speedLines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = attr.array as Float32Array;
    const lineSpeed = (this.speed + (this.boosting ? 35 : 15)) * 2.2;
    const lineCount = positions.length / 6;

    for (let i = 0; i < lineCount; i += 1) {
      positions[i * 6 + 2] += lineSpeed * dt;
      positions[i * 6 + 5] += lineSpeed * dt;
      if (positions[i * 6 + 2] > 20) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3.2 + Math.random() * 8.5;
        const x = this.playerX * 0.5 + Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.65 + 2.8;
        const z = -120 - Math.random() * 40;
        const len = 5 + Math.random() * (this.boosting ? 18 : 10);
        positions[i * 6] = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;
        positions[i * 6 + 3] = x;
        positions[i * 6 + 4] = y;
        positions[i * 6 + 5] = z + len;
      }
    }
    attr.needsUpdate = true;
  }

  private finishRun(reason: RunResult['reason']): void {
    if (this.mode === 'finished' || this.mode === 'finishing') return;
    this.mode = 'finishing';
    this.finishReason = reason;
    this.finishingTimer = reason === 'finish' ? 0.9 : 0.5;
    this.input.setEnabled(false);
    this.audio.stopEngine();
    this.audio.stopAmbience();
    this.audio.stopMusic();
    if (reason === 'finish') {
      this.score += 5000;
      this.audio.playCue('finish');
    } else {
      this.audio.playCue(reason === 'fuel' ? 'error' : 'crash');
    }
    this.options.onModeChange('finishing');
    this.emitHud(true);
    if (this.finishTimer !== null) window.clearTimeout(this.finishTimer);
    this.finishTimer = window.setTimeout(() => {
      this.finishTimer = null;
      if (this.disposed) return;
      this.completeRun(reason);
    }, this.finishingTimer * 1000);
  }

  private completeRun(reason: RunResult['reason']): void {
    if (this.mode === 'finished') return;
    this.mode = 'finished';
    const result: RunResult = {
      id: makeRunId(),
      date: new Date().toISOString(),
      destinationId: this.options.destination.id,
      carId: this.options.car.id,
      difficulty: this.settings.gameplay.difficulty,
      score: Math.round(this.score),
      distanceM: Math.round(this.distanceM * 10) / 10,
      topSpeedKph: Math.round(this.topSpeedKph),
      coins: this.runCoins,
      nearMisses: this.runNearMisses,
      driftDistanceM: Math.round(this.runDriftM),
      nitroUses: this.runNitroUses,
      checkpoints: this.runCheckpoints,
      crashes: this.crashes,
      crashFreeStreakM: Math.round(this.crashFreeBest),
      durationMs: Math.round(this.elapsed * 1000),
      completed: reason === 'finish',
      reason,
    };
    this.audio.setRaceActive(false);
    if (reason === 'finish') this.audio.playCue('finish');
    this.options.onModeChange('finished');
    this.options.onFinish(result);
    this.emitHud(true);
  }

  pause(): void {
    if (this.mode !== 'running') return;
    this.mode = 'paused';
    this.input.clearTransient();
    this.input.setEnabled(false);
    this.audio.setPaused(true);
    this.options.onModeChange(this.mode);
    this.emitHud(true);
  }

  resume(): void {
    if (this.mode !== 'paused') return;
    this.mode = 'running';
    this.lastFrame = performance.now();
    this.input.setEnabled(true);
    this.audio.setPaused(false);
    this.options.onModeChange(this.mode);
    this.emitHud(true);
  }

  restart(endless = false): void {
    if (this.disposed) return;
    if (this.mode === 'paused' || this.mode === 'finished' || this.mode === 'finishing') {
      this.mode = 'ready';
    }
    this.start(endless);
  }

  /**
   * Ends the current run and emits a `RunResult` with reason `quit`.
   * Used by the pause menu so an abandoned run still reaches statistics and
   * can be reviewed on the results screen instead of silently disappearing.
   */
  quit(): void {
    if (this.disposed || this.mode === 'finished' || this.mode === 'loading') return;
    if (this.mode === 'ready') {
      this.mode = 'finished';
      this.options.onModeChange(this.mode);
      return;
    }
    if (this.finishTimer !== null) {
      window.clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }
    this.input.setEnabled(false);
    this.audio.stopEngine();
    this.audio.stopAmbience();
    this.audio.stopMusic();
    this.audio.playCue('back');
    this.completeRun('quit');
  }

  setVirtualControl(
    action: 'steerLeft' | 'steerRight' | 'accelerate' | 'brake' | 'nitro' | 'horn' | 'switchCamera',
    active: boolean,
  ): void {
    if (this.mode !== 'running' && this.mode !== 'countdown') {
      if (!active) this.input.setVirtual(action, false);
      return;
    }
    this.input.setVirtual(action, active);
  }

  toggleCamera(): CameraView {
    this.cameraMode = this.cameraMode === 'exterior' ? 'cockpit' : 'exterior';
    this.player.setCockpitVisibility(this.cameraMode === 'cockpit');
    this.emitHud(true);
    return this.cameraMode;
  }

  getCameraMode(): CameraView {
    return this.cameraMode;
  }

  /**
   * Continuous steering channel used by tilt and touch-drag. Values are
   * clamped by the input controller and combine with keyboard/gamepad input.
   */
  setAnalogSteer(value: number): void {
    if (this.mode !== 'running' && this.mode !== 'countdown') {
      this.input.setAnalogSteer(0);
      return;
    }
    this.input.setAnalogSteer(value);
  }

  /** Current smoothed steering value for HUD/preview feedback. */
  getSteeringFeedback(): number {
    return this.steerVisual;
  }

  setSettings(settings: Settings): void {
    const previous = this.settings;
    this.settings = settings;
    this.difficulty =
      DIFFICULTY[settings.gameplay.difficulty as keyof typeof DIFFICULTY] ?? DIFFICULTY.standard;
    this.damageMultiplier = settings.gameplay.difficulty === 'relaxed' ? 0.75 : this.difficulty.damage;
    this.input.setBindings(settings.controls.keybindings);
    this.audio.setVolumes(settings.audio);
    if (previous.graphics.renderScale !== settings.graphics.renderScale ||
      previous.graphics.performanceMode !== settings.graphics.performanceMode) {
      this.applyPixelRatio();
    }
    this.renderer.shadowMap.enabled =
      settings.graphics.shadows && !settings.graphics.performanceMode;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.environment.setShadows(this.renderer.shadowMap.enabled, settings.graphics.shadowQuality);
    this.environment.setEffects(settings.graphics.performanceMode ? 'low' : settings.graphics.effects);
    this.camera.fov = this.currentFov();
    this.camera.updateProjectionMatrix();
    this.resize();
  }

  private emitHud(force = false): void {
    const target = this.endless ? 0 : this.options.destination.distanceTarget;
    const traffic: HudTraffic[] = [];
    for (const unit of this.traffic) {
      if (!unit.active) continue;
      const z = unit.model.group.position.z;
      if (z < -100 || z > 24) continue;
      traffic.push({
        x: unit.model.group.position.x,
        z,
        color: unit.color,
      });
    }
    const hud: HudFrame = {
      mode: this.mode,
      countdown: Math.max(0, Math.ceil(this.countdown)),
      speedKph: Math.round(this.speed * 3.6),
      rpm: this.rpm,
      gear: this.gear,
      nitro: this.nitro,
      fuel: this.fuel,
      health: this.health,
      score: Math.round(this.score),
      distanceM: this.distanceM,
      targetM: target,
      coins: this.runCoins,
      nearMisses: this.runNearMisses,
      combo: Math.floor(this.combo),
      multiplier: this.multiplier,
      checkpointProgress: Math.min(1, (this.distanceM % CHECKPOINT_SPACING) / CHECKPOINT_SPACING),
      topSpeedKph: Math.round(this.topSpeedKph),
      driftDistanceM: Math.round(this.runDriftM),
      nitroUses: this.runNitroUses,
      crashes: this.crashes,
      crashFreeStreakM: Math.round(this.crashFreeBest),
      fps: this.fps,
      traffic,
      drifting: this.drifting,
      boosting: this.boosting,
      cameraView: this.cameraMode,
      bestScore: this.options.bestScore,
    };
    if (force) {
      // keep final HUD immediate
    }
    this.options.onHud(hud);
  }

  getMode(): EngineMode {
    return this.mode;
  }

  getAudioSourceMode(): 'touch' | 'keyboard' | 'gamepad' {
    return this.lastGamepad ? 'gamepad' : this.settings.controls.scheme;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.wasHonking) {
      this.audio.stopHorn();
      this.wasHonking = false;
    }
    if (this.finishTimer !== null) {
      window.clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }
    this.renderer.setAnimationLoop(null);
    this.input.setEnabled(false);
    this.input.dispose();
    this.detachInput?.();
    this.detachInput = null;
    this.audio.stopEngine();
    this.audio.stopAmbience();
    this.audio.stopMusic();
    this.audio.setRaceActive(false);
    this.environment.dispose();
    this.scene.remove(this.world);
    disposeObject3D(this.world);
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

function speedKphFromMps(speed: number): number {
  return speed * 3.6;
}

import * as THREE from 'three';
import type { DestinationDefinition, Quality } from '@/lib/types';
import { disposeObject3D, makeCanvasTexture } from './dispose';

export interface EnvironmentHandle {
  sun: THREE.DirectionalLight;
  update: (deltaSeconds: number, distanceDelta: number, speedKph: number) => void;
  setShadows: (enabled: boolean, quality: Quality) => void;
  setEffects: (quality: Quality) => void;
  dispose: () => void;
}

interface SceneryEntry {
  object: THREE.Object3D;
  wrap: number;
}

const ROAD_WIDTH = 16.6;
const ROAD_LENGTH = 560;
const ROAD_START_Z = 60;
const ROAD_END_Z = ROAD_START_Z - ROAD_LENGTH;
const LANE_DIVIDERS = [-4.15, 0, 4.15];

type RandomFn = () => number;

function mulberry32(seed: number): RandomFn {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mat(color: string, roughness = 0.8, metalness = 0.05): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function createWindowTexture(tint: string, base: string, seed: number): THREE.CanvasTexture | null {
  return makeCanvasTexture(128, 256, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 256);
    const random = mulberry32(seed);
    for (let y = 10; y < 246; y += 18) {
      for (let x = 8; x < 120; x += 16) {
        const lit = random() > 0.38;
        ctx.fillStyle = lit ? tint : '#0b1220';
        ctx.globalAlpha = lit ? 0.45 + random() * 0.55 : 0.8;
        ctx.fillRect(x, y, 9, 10);
        ctx.globalAlpha = 1;
      }
    }
  });
}

function createPine(height: number, snowy: boolean, random: RandomFn): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09 * height * 0.25, 0.14 * height * 0.25, height * 0.5, 7),
    mat('#4c3525'),
  );
  trunk.position.y = height * 0.25;
  trunk.castShadow = true;
  group.add(trunk);
  const green = snowy ? ['#395f4a', '#315443', '#3e6a52'] : ['#2e5a3a', '#356744', '#284f34'];
  for (let i = 0; i < 3; i += 1) {
    const radius = height * (0.26 - i * 0.055);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height * 0.42, 7),
      mat(green[Math.floor(random() * green.length)]),
    );
    cone.position.y = height * (0.42 + i * 0.19);
    cone.castShadow = true;
    group.add(cone);
    if (snowy && i < 2) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.72, height * 0.13, 7), mat('#e9f2f7'));
      cap.position.y = height * (0.52 + i * 0.19);
      group.add(cap);
    }
  }
  return group;
}

function createBroadleaf(height: number, random: RandomFn): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * height * 0.27, 0.2 * height * 0.27, height * 0.62, 7),
    mat('#443224'),
  );
  trunk.position.y = height * 0.31;
  trunk.castShadow = true;
  group.add(trunk);
  const colors = ['#2d5b34', '#366b3d', '#274f2d', '#417347'];
  for (let i = 0; i < 3; i += 1) {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(height * (0.24 + random() * 0.08), 1),
      mat(colors[Math.floor(random() * colors.length)]),
    );
    crown.position.set(
      (random() - 0.5) * height * 0.24,
      height * (0.68 + random() * 0.14),
      (random() - 0.5) * height * 0.24,
    );
    crown.scale.y = 0.8;
    crown.castShadow = true;
    group.add(crown);
  }
  return group;
}

function createPalm(height: number, random: RandomFn): THREE.Group {
  const group = new THREE.Group();
  const trunkMaterial = mat('#76543a');
  for (let i = 0; i < 5; i += 1) {
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, height * 0.22, 7), trunkMaterial);
    segment.position.set(Math.sin(i * 0.25) * 0.2, height * (0.1 + i * 0.19), 0);
    segment.rotation.z = -0.08 * i;
    segment.castShadow = true;
    group.add(segment);
  }
  const leafMaterial = mat('#2f7a4f', 0.9);
  for (let i = 0; i < 7; i += 1) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(height * 0.055, height * 0.62, 4), leafMaterial);
    frond.position.set(0, height * 1.02, 0);
    frond.rotation.order = 'YXZ';
    frond.rotation.y = (i / 7) * Math.PI * 2;
    frond.rotation.z = 1.08 + random() * 0.16;
    frond.scale.z = 0.18;
    frond.castShadow = true;
    group.add(frond);
  }
  return group;
}

function createCactus(height: number, random: RandomFn): THREE.Group {
  const group = new THREE.Group();
  const green = mat('#4d7b45', 0.95);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.09, height * 0.13, height, 9), green);
  body.position.y = height / 2;
  body.castShadow = true;
  group.add(body);
  for (let i = 0; i < 2 + Math.floor(random() * 2); i += 1) {
    const armHeight = height * (0.35 + random() * 0.35);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.06, height * 0.07, height * 0.32, 8), green);
    const side = random() > 0.5 ? 1 : -1;
    arm.position.set(side * height * 0.14, armHeight, 0);
    arm.rotation.z = side * 0.7;
    group.add(arm);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(height * 0.06, 8, 6), green);
    tip.position.set(side * height * 0.23, armHeight + height * 0.14, 0);
    group.add(tip);
  }
  return group;
}

function createRock(scale: number, color: string): THREE.Group {
  const group = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), mat(color, 0.95));
  rock.scale.set(1.1, 0.72 + Math.random() * 0.5, 0.9);
  rock.position.y = scale * 0.4;
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  group.add(rock);
  return group;
}

function createBuilding(
  height: number,
  width: number,
  depth: number,
  windowMaterial: THREE.MeshStandardMaterial,
  accent: string,
  neon: boolean,
  random: RandomFn,
): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: neon ? '#100a22' : '#1a2230',
      roughness: 0.7,
      metalness: 0.3,
      map: windowMaterial.map,
      emissiveMap: windowMaterial.emissiveMap,
      emissive: windowMaterial.emissive,
      emissiveIntensity: neon ? 1.3 : 0.72,
    }),
  );
  body.position.y = height / 2;
  body.castShadow = false;
  group.add(body);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.96, 0.35, depth * 0.96),
    mat('#0d121b', 0.8),
  );
  roof.position.y = height + 0.1;
  group.add(roof);
  if (neon) {
    const neonMat = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 3,
      roughness: 0.3,
    });
    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.12, height * 0.92, 0.12), neonMat);
      strip.position.set(side * width * 0.48, height * 0.5, depth * 0.48);
      group.add(strip);
    }
    const topStrip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.1, depth * 0.82), neonMat);
    topStrip.position.y = height * (0.55 + random() * 0.3);
    group.add(topStrip);
  }
  return group;
}

function createLamp(accent: string, night: boolean): THREE.Group {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 5.5, 8), mat('#3a4350', 0.4, 0.7));
  pole.position.y = 2.75;
  pole.castShadow = true;
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.07), mat('#3a4350', 0.4, 0.7));
  arm.position.set(0.7, 5.45, 0);
  group.add(arm);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshStandardMaterial({
      color: night ? accent : '#fff3c4',
      emissive: night ? accent : '#ffe9a8',
      emissiveIntensity: night ? 4 : 1.2,
    }),
  );
  bulb.position.set(1.42, 5.36, 0);
  group.add(bulb);
  if (night) {
    const light = new THREE.PointLight(accent, 12, 18, 1.6);
    light.position.copy(bulb.position);
    group.add(light);
  }
  return group;
}

function propFor(
  type: DestinationDefinition['theme']['props'],
  random: RandomFn,
  quality: Quality,
): THREE.Group {
  const scale = quality === 'low' ? 0.9 : 1;
  switch (type) {
    case 'pine':
      return createPine((5.5 + random() * 5) * scale, false, random);
    case 'snowpine':
      return createPine((5 + random() * 4) * scale, true, random);
    case 'broadleaf':
      return createBroadleaf((5 + random() * 5) * scale, random);
    case 'palm':
      return createPalm((5 + random() * 4) * scale, random);
    case 'cactus':
      return createCactus((2.6 + random() * 2.5) * scale, random);
    case 'skyline':
    case 'neon': {
      const height = (10 + random() * 34) * scale;
      const width = 5 + random() * 7;
      const depth = 5 + random() * 8;
      const dark = type === 'neon';
      const texture = createWindowTexture(
        dark ? (random() > 0.5 ? '#f0abfc' : '#22d3ee') : random() > 0.5 ? '#ffd27a' : '#9ad7ff',
        dark ? '#0a0512' : '#121a26',
        Math.floor(random() * 99999),
      );
      const windowMaterial = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: texture,
        emissiveMap: texture,
        emissive: new THREE.Color(dark ? '#a855f7' : '#7aa7d8'),
        emissiveIntensity: dark ? 1.8 : 0.8,
      });
      return createBuilding(
        height,
        width,
        depth,
        windowMaterial,
        dark ? (random() > 0.5 ? '#f0abfc' : '#22d3ee') : '#ffd27a',
        dark,
        random,
      );
    }
    default:
      return createRock(1 + random() * 2, '#7a756b');
  }
}

function setShadowSettings(sun: THREE.DirectionalLight, enabled: boolean, quality: Quality) {
  sun.castShadow = enabled;
  if (!enabled) return;
  const size = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512;
  sun.shadow.mapSize.set(size, size);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 150;
  sun.shadow.camera.left = -34;
  sun.shadow.camera.right = 34;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -30;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.025;
  sun.shadow.map?.dispose();
  sun.shadow.map = null;
}

export function buildEnvironment(
  scene: THREE.Scene,
  destination: DestinationDefinition,
  quality: Quality,
  options: { preview?: boolean } = {},
): EnvironmentHandle {
  const preview = options.preview ?? false;
  const theme = destination.theme;
  const random = mulberry32(destination.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 987));
  const root = new THREE.Group();
  scene.add(root);
  const scenery: SceneryEntry[] = [];
  const animated: Array<(dt: number, distanceDelta: number, speedKph: number) => void> = [];
  const night = theme.timeOfDay === 'night';
  const sunset = theme.timeOfDay === 'sunset';
  const counts = {
    low: preview ? 8 : 18,
    medium: preview ? 12 : 30,
    high: preview ? 16 : 44,
  };

  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.Fog(theme.fog, preview ? theme.fogNear * 0.4 : theme.fogNear, preview ? theme.fogFar * 0.55 : theme.fogFar);

  // Lighting ---------------------------------------------------------------------
  const hemisphere = new THREE.HemisphereLight(
    theme.ambient,
    theme.ground,
    night ? 0.6 : sunset ? 1.45 : 1.9,
  );
  root.add(hemisphere);

  const sun = new THREE.DirectionalLight(theme.sun, night ? 0.7 : sunset ? 2.35 : 2.6);
  sun.position.set(night ? 14 : -22, night ? 20 : 34, 8);
  sun.target.position.set(0, 0, -20);
  root.add(sun);
  root.add(sun.target);
  setShadowSettings(sun, quality !== 'low', quality);

  const rimLight = new THREE.DirectionalLight(
    night ? '#7c3aed' : theme.accent,
    night ? 1.1 : 0.45,
  );
  rimLight.position.set(20, 8, 20);
  root.add(rimLight);

  // Sky details ------------------------------------------------------------------
  if (night) {
    const starCount = quality === 'low' ? 300 : 900;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPositions[i * 3] = (random() - 0.5) * 520;
      starPositions[i * 3 + 1] = 30 + random() * 160;
      starPositions[i * 3 + 2] = -80 - random() * 420;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: '#dbeafe', size: 0.7, transparent: true, opacity: 0.8, depthWrite: false }),
    );
    root.add(stars);
  }

  if (sunset || theme.timeOfDay === 'dawn') {
    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(18, 24, 24),
      new THREE.MeshBasicMaterial({ color: theme.sun, transparent: true, opacity: 0.92, fog: false }),
    );
    sunDisc.position.set(-120, 38, -280);
    root.add(sunDisc);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 80),
      new THREE.MeshBasicMaterial({
        color: theme.sun,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    glow.position.set(-120, 38, -286);
    root.add(glow);
  }

  // Ground and road --------------------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 900),
    mat(theme.ground, 1, 0),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.18, -220);
  ground.receiveShadow = quality !== 'low';
  root.add(ground);

  if (destination.environment === 'coastal') {
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(520, 900, 1, 1),
      new THREE.MeshStandardMaterial({
        color: '#1c6080',
        roughness: 0.22,
        metalness: 0.5,
        transparent: true,
        opacity: 0.96,
      }),
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(120, -0.12, -240);
    root.add(ocean);
    const foamMaterial = new THREE.MeshBasicMaterial({
      color: '#ffd8b8',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    for (let i = 0; i < 5; i += 1) {
      const foam = new THREE.Mesh(new THREE.PlaneGeometry(3 + random() * 10, 80 + random() * 80), foamMaterial);
      foam.rotation.x = -Math.PI / 2;
      foam.position.set(34 + i * 8, -0.05, -120 - i * 40);
      root.add(foam);
    }
  }

  if (destination.environment === 'desert') {
    for (let i = 0; i < 8; i += 1) {
      const dune = new THREE.Mesh(
        new THREE.SphereGeometry(18 + random() * 28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        mat('#c28c57', 1),
      );
      dune.scale.y = 0.18;
      dune.position.set((random() - 0.5) * 220, -2, -100 - random() * 280);
      root.add(dune);
    }
  }

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: theme.road,
    roughness: destination.environment === 'neon' ? 0.24 : destination.environment === 'city' ? 0.32 : 0.82,
    metalness: destination.environment === 'neon' ? 0.55 : destination.environment === 'city' ? 0.35 : 0.05,
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH), roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.06, (ROAD_START_Z + ROAD_END_Z) / 2);
  road.receiveShadow = quality !== 'low';
  root.add(road);

  const shoulderMaterial = mat(theme.shoulder, 0.95);
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(2.2, ROAD_LENGTH), shoulderMaterial);
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(side * (ROAD_WIDTH / 2 + 1.05), -0.07, (ROAD_START_Z + ROAD_END_Z) / 2);
    root.add(shoulder);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, ROAD_LENGTH), mat(theme.lane, 0.7));
    edge.position.set(side * (ROAD_WIDTH / 2 - 0.45), 0.01, (ROAD_START_Z + ROAD_END_Z) / 2);
    root.add(edge);
  }

  if (destination.environment === 'neon') {
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: theme.accent,
      emissive: theme.accent,
      emissiveIntensity: 1.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, ROAD_LENGTH), glowMaterial);
      strip.position.set(side * (ROAD_WIDTH / 2 - 0.62), 0.02, (ROAD_START_Z + ROAD_END_Z) / 2);
      root.add(strip);
    }
    const centerGlowMat = new THREE.MeshBasicMaterial({
      color: '#22d3ee',
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const centerGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.3, ROAD_LENGTH), centerGlowMat);
    centerGlow.rotation.x = -Math.PI / 2;
    centerGlow.position.set(0, -0.045, (ROAD_START_Z + ROAD_END_Z) / 2);
    root.add(centerGlow);
  }

  // Dashed lane markings scroll toward the camera.
  const dashGeometry = new THREE.BoxGeometry(0.13, 0.035, 3.8);
  const dashMaterial = new THREE.MeshStandardMaterial({
    color: theme.lane,
    roughness: 0.7,
    emissive: destination.environment === 'neon' ? theme.lane : '#000000',
    emissiveIntensity: destination.environment === 'neon' ? 0.4 : 0,
  });
  const dashes: THREE.Mesh[] = [];
  const dashSpacing = 13;
  const dashCount = Math.ceil(ROAD_LENGTH / dashSpacing);
  for (const x of LANE_DIVIDERS) {
    for (let i = 0; i < dashCount; i += 1) {
      const dash = new THREE.Mesh(dashGeometry, dashMaterial);
      dash.position.set(x, 0.015, ROAD_START_Z - i * dashSpacing);
      root.add(dash);
      dashes.push(dash);
    }
  }

  // Guard rails + posts.
  const railMaterial = new THREE.MeshStandardMaterial({
    color: destination.environment === 'neon' ? '#38235b' : '#6c7580',
    roughness: 0.45,
    metalness: 0.65,
  });
  const postMaterial = mat(destination.environment === 'neon' ? '#2a1a45' : '#59626c', 0.55, 0.55);
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, ROAD_LENGTH), railMaterial);
    rail.position.set(side * (ROAD_WIDTH / 2 + 1.1), 0.72, (ROAD_START_Z + ROAD_END_Z) / 2);
    root.add(rail);
    const postGeometry = new THREE.BoxGeometry(0.1, 0.95, 0.1);
    for (let i = 0; i < dashCount; i += 1) {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(side * (ROAD_WIDTH / 2 + 1.1), 0.3, ROAD_START_Z - i * dashSpacing);
      root.add(post);
    }
  }

  // Distant terrain silhouettes.
  const addMountainRange = (color: string, snowCaps: boolean) => {
    for (let i = 0; i < (quality === 'low' ? 6 : 12); i += 1) {
      const height = 32 + random() * 55;
      const radius = 30 + random() * 45;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 5), mat(color, 1));
      mountain.position.set((random() - 0.5) * 420, height * 0.43 - 4, -210 - random() * 180);
      mountain.rotation.y = random() * Math.PI;
      root.add(mountain);
      if (snowCaps) {
        const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.32, height * 0.24, 5), mat('#eef6fb', 0.8));
        cap.position.set(mountain.position.x, mountain.position.y + height * 0.39, mountain.position.z);
        root.add(cap);
      }
    }
  };

  if (destination.environment === 'mountain') addMountainRange('#617a68', true);
  if (destination.environment === 'snow') addMountainRange('#b8c9d6', true);
  if (destination.environment === 'desert') addMountainRange('#9d6a48', false);
  if (destination.environment === 'forest') addMountainRange('#3d5a41', false);

  // Scenery pool -----------------------------------------------------------------
  const propCount = counts[quality];
  for (let i = 0; i < propCount; i += 1) {
    const side = destination.environment === 'coastal'
      ? random() > 0.35 ? -1 : 1
      : random() > 0.5 ? 1 : -1;
    const nearOcean = destination.environment === 'coastal' && side === 1;
    const prop = propFor(theme.props, random, quality);
    const baseDistance = 13 + random() * (destination.environment === 'city' || destination.environment === 'neon' ? 28 : 24);
    prop.position.set(side * baseDistance * (nearOcean ? 1.8 : 1), 0, ROAD_START_Z - (i / propCount) * 470 - random() * 10);
    prop.rotation.y = random() * Math.PI * 2;
    if (theme.props === 'palm') prop.scale.setScalar(0.8 + random() * 0.4);
    root.add(prop);
    const entry = { object: prop, wrap: 470 };
    scenery.push(entry);
    if ((destination.environment === 'city' || destination.environment === 'neon') && random() > 0.52) {
      // A few street lamps at the verge.
      const lamp = createLamp(theme.accent, night);
      lamp.position.set(side * (ROAD_WIDTH / 2 + 2.4), 0, prop.position.z + 8);
      lamp.rotation.y = side === 1 ? Math.PI : 0;
      root.add(lamp);
      scenery.push({ object: lamp, wrap: 470 });
    }
  }

  // Scattered rocks and roadside detail.
  if (destination.environment !== 'city' && destination.environment !== 'neon') {
    const detailCount = quality === 'low' ? 8 : 18;
    for (let i = 0; i < detailCount; i += 1) {
      const side = random() > 0.5 ? 1 : -1;
      const rock = createRock(0.6 + random() * 1.5, theme.props === 'cactus' ? '#a6684b' : '#777a76');
      rock.position.set(side * (12 + random() * 18), 0, ROAD_START_Z - random() * 450);
      root.add(rock);
      scenery.push({ object: rock, wrap: 470 });
    }
  }

  // Weather particles ------------------------------------------------------------
  let weather: THREE.Points | THREE.LineSegments | null = null;
  const weatherPositions: Float32Array | null = null;
  let weatherSpeed = 0;
  let weatherType = theme.weather;

  const buildWeather = () => {
    if (weather) {
      root.remove(weather);
      disposeObject3D(weather);
      weather = null;
    }
    if (weatherType === 'none' || quality === 'low' || preview) return;
    const amount = quality === 'high' ? 700 : 350;
    weatherSpeed = weatherType === 'snow' ? 3.5 : weatherType === 'rain' ? 30 : weatherType === 'dust' ? 5 : 0.7;
    if (weatherType === 'rain') {
      const positions = new Float32Array(amount * 6);
      for (let i = 0; i < amount; i += 1) {
        const x = (random() - 0.5) * 90;
        const y = random() * 30;
        const z = ROAD_START_Z - random() * 260;
        positions[i * 6] = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;
        positions[i * 6 + 3] = x - 0.05;
        positions[i * 6 + 4] = y - 0.9;
        positions[i * 6 + 5] = z + 0.2;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const lines = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: '#a8c5db', transparent: true, opacity: 0.32 }),
      );
      weather = lines;
      root.add(lines);
    } else {
      const positions = new Float32Array(amount * 3);
      for (let i = 0; i < amount; i += 1) {
        positions[i * 3] = (random() - 0.5) * 80;
        positions[i * 3 + 1] = random() * 35;
        positions[i * 3 + 2] = ROAD_START_Z - random() * 240;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const color = weatherType === 'snow' ? '#f2f8ff' : weatherType === 'dust' ? '#e8bb82' : '#c8ff8a';
      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color,
          size: weatherType === 'fireflies' ? 0.18 : weatherType === 'dust' ? 0.12 : 0.16,
          transparent: true,
          opacity: weatherType === 'fireflies' ? 0.9 : 0.7,
          depthWrite: false,
          sizeAttenuation: true,
        }),
      );
      weather = points;
      root.add(points);
    }
  };

  buildWeather();

  // Update loop ------------------------------------------------------------------
  const update = (dt: number, distanceDelta: number, speedKph: number) => {
    if (preview) return;
    for (const dash of dashes) {
      dash.position.z += distanceDelta;
      if (dash.position.z > ROAD_START_Z) dash.position.z -= ROAD_LENGTH;
    }
    for (const entry of scenery) {
      entry.object.position.z += distanceDelta;
      if (entry.object.position.z > ROAD_START_Z + 12) {
        entry.object.position.z -= entry.wrap;
      }
    }
    if (weather) {
      const attr = weather.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = attr.array as Float32Array;
      const isLine = weatherType === 'rain';
      const stride = isLine ? 6 : 3;
      for (let i = 0; i < positions.length; i += stride) {
        if (isLine) {
          positions[i + 1] -= weatherSpeed * dt * 2.4;
          positions[i + 4] = positions[i + 1] - 0.9;
          positions[i + 2] += distanceDelta * 0.3;
          positions[i + 5] = positions[i + 2] + 0.2;
          if (positions[i + 1] < 0) {
            positions[i + 1] = 25 + Math.random() * 6;
            positions[i + 4] = positions[i + 1] - 0.9;
          }
        } else {
          if (weatherType === 'snow') {
            positions[i + 1] -= weatherSpeed * dt;
            positions[i] += Math.sin(performance.now() * 0.0007 + i) * dt * 0.8;
          } else if (weatherType === 'dust') {
            positions[i + 1] -= 0.25 * dt;
            positions[i] += Math.sin(performance.now() * 0.001 + i) * dt * 2;
          } else {
            positions[i + 1] += Math.sin(performance.now() * 0.001 + i) * dt * 0.18;
            positions[i] += Math.cos(performance.now() * 0.0008 + i) * dt * 0.12;
          }
          positions[i + 2] += distanceDelta * (weatherType === 'fireflies' ? 0.25 : 0.8);
          if (positions[i + 1] < 0) positions[i + 1] = weatherType === 'snow' ? 32 : 5 + Math.random() * 24;
          if (positions[i + 1] > 38) positions[i + 1] = 0;
          if (positions[i + 2] > ROAD_START_Z) {
            positions[i + 2] -= 250;
            positions[i] = (Math.random() - 0.5) * 80;
          }
        }
      }
      attr.needsUpdate = true;
    }
    animated.forEach((fn) => fn(dt, distanceDelta, speedKph));
  };

  const setEffects = (nextQuality: Quality) => {
    if (nextQuality === 'low' && weather) {
      weather.visible = false;
    } else if (weather) {
      weather.visible = true;
    }
    if (weather && quality !== nextQuality) {
      weatherType = theme.weather;
    }
  };

  const dispose = () => {
    scene.remove(root);
    disposeObject3D(root);
    if (scene.background instanceof THREE.Texture) scene.background.dispose();
    scene.fog = null;
  };

  return {
    sun,
    update,
    setShadows: (enabled, q) => setShadowSettings(sun, enabled, q),
    setEffects,
    dispose,
  };
}

export const ROAD_CONSTANTS = {
  width: ROAD_WIDTH,
  length: ROAD_LENGTH,
  startZ: ROAD_START_Z,
  endZ: ROAD_END_Z,
};

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type {
  CarBodyStyle,
  CarClass,
  CarCustomization,
  Quality,
  SpoilerStyle,
  WheelStyle,
} from '@/lib/types';
import { disposeObject3D } from './dispose';

export interface CarVisualOptions {
  paint: string;
  customization: CarCustomization;
  carClass: CarClass;
  /** Optional per-vehicle silhouette; falls back to the class dimensions. */
  bodyStyle?: CarBodyStyle;
  accent: string;
  quality: Quality;
  isPlayer?: boolean;
  headlights?: boolean;
}

export interface CarModel {
  group: THREE.Group;
  wheels: THREE.Object3D[];
  brakeMaterials: THREE.MeshStandardMaterial[];
  bodyMaterial: THREE.MeshPhysicalMaterial;
  accentMaterials: THREE.MeshStandardMaterial[];
  paint: THREE.Color;
  setPaint: (color: string) => void;
  setBrake: (active: boolean) => void;
  setWheelSpin: (radians: number) => void;
  dispose: () => void;
}

interface BodyDimensions {
  width: number;
  length: number;
  height: number;
  wheel: number;
  wheelWidth: number;
  cabinHeight: number;
  cabinLength: number;
  roofRails?: boolean;
}

const BODY_DIMENSIONS: Record<CarClass, BodyDimensions> = {
  sport: { width: 1.88, length: 4.3, height: 0.56, wheel: 0.36, wheelWidth: 0.25, cabinHeight: 0.6, cabinLength: 0.43 },
  muscle: { width: 1.98, length: 4.6, height: 0.6, wheel: 0.39, wheelWidth: 0.3, cabinHeight: 0.58, cabinLength: 0.39 },
  super: { width: 1.98, length: 4.5, height: 0.5, wheel: 0.37, wheelWidth: 0.3, cabinHeight: 0.48, cabinLength: 0.37 },
  hyper: { width: 2.02, length: 4.7, height: 0.48, wheel: 0.37, wheelWidth: 0.32, cabinHeight: 0.45, cabinLength: 0.35 },
  offroad: { width: 2.02, length: 4.55, height: 0.66, wheel: 0.44, wheelWidth: 0.3, cabinHeight: 0.72, cabinLength: 0.5 },
  electric: { width: 1.94, length: 4.5, height: 0.52, wheel: 0.37, wheelWidth: 0.26, cabinHeight: 0.58, cabinLength: 0.45 },
};

/**
 * Distinct silhouettes are what keep a procedural garage from looking like one
 * car with fourteen paint swatches. Dimensions are real-world-inspired
 * proportions, not licensed OEM geometry.
 */
const BODY_STYLE_DIMENSIONS: Record<CarBodyStyle, BodyDimensions> = {
  coupe: { width: 1.9, length: 4.54, height: 0.56, wheel: 0.37, wheelWidth: 0.28, cabinHeight: 0.58, cabinLength: 0.39 },
  supercar: { width: 1.99, length: 4.58, height: 0.47, wheel: 0.37, wheelWidth: 0.32, cabinHeight: 0.43, cabinLength: 0.34 },
  sedan: { width: 1.94, length: 4.98, height: 0.6, wheel: 0.37, wheelWidth: 0.27, cabinHeight: 0.65, cabinLength: 0.5 },
  suv: { width: 2.04, length: 4.9, height: 0.73, wheel: 0.44, wheelWidth: 0.31, cabinHeight: 0.82, cabinLength: 0.54, roofRails: true },
  muscle: { width: 2, length: 4.78, height: 0.62, wheel: 0.39, wheelWidth: 0.31, cabinHeight: 0.56, cabinLength: 0.39 },
  hatch: { width: 1.86, length: 4.24, height: 0.59, wheel: 0.35, wheelWidth: 0.25, cabinHeight: 0.63, cabinLength: 0.47 },
};

function standardMaterial(
  color: string,
  options: Partial<THREE.MeshStandardMaterialParameters> = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.2, ...options });
}

function createSpoiler(style: SpoilerStyle, width: number, paint: THREE.Material): THREE.Group | null {
  if (style === 'none') return null;
  const group = new THREE.Group();
  if (style === 'lip') {
    const lip = new THREE.Mesh(new RoundedBoxGeometry(width * 0.8, 0.08, 0.32, 3, 0.02), paint);
    lip.position.set(0, 0.98, 2.05);
    lip.castShadow = true;
    group.add(lip);
    return group;
  }
  if (style === 'sport') {
    const deck = new THREE.Mesh(new RoundedBoxGeometry(width * 0.86, 0.09, 0.48, 3, 0.02), paint);
    deck.position.set(0, 1.01, 2.0);
    deck.rotation.x = -0.09;
    deck.castShadow = true;
    group.add(deck);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.025, 0.08), paint);
    lip.position.set(0, 1.07, 2.2);
    group.add(lip);
    return group;
  }
  const wing = new THREE.Mesh(new RoundedBoxGeometry(width * 0.94, 0.07, 0.46, 3, 0.02), paint);
  wing.position.set(0, 1.38, 2.0);
  wing.rotation.x = -0.08;
  wing.castShadow = true;
  group.add(wing);
  for (const side of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.08), paint);
    strut.position.set(side * width * 0.33, 1.18, 2.0);
    group.add(strut);
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.48), paint);
    endplate.position.set(side * width * 0.47, 1.39, 2.0);
    group.add(endplate);
  }
  return group;
}

function createWheel(
  radius: number,
  width: number,
  rimColor: string,
  style: WheelStyle,
  quality: Quality,
): { group: THREE.Group; spin: THREE.Group } {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  const tireMat = new THREE.MeshStandardMaterial({ color: '#0b0d10', roughness: 0.98, metalness: 0.02 });
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, quality === 'low' ? 12 : 20), tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = quality !== 'low';
  spin.add(tire);

  const rimMat = standardMaterial(rimColor, { metalness: 0.92, roughness: 0.25 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width * 1.03, 18), rimMat);
  rim.rotation.z = Math.PI / 2;
  spin.add(rim);

  const diskMat = new THREE.MeshStandardMaterial({
    color: style === 'stealth' ? '#111318' : '#7e8791',
    roughness: 0.6,
    metalness: 0.5,
  });
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.74, radius * 0.74, width * 0.5, 16), diskMat);
  disk.rotation.z = Math.PI / 2;
  spin.add(disk);

  if (quality !== 'low') {
    const spokes = style === 'forged' ? 10 : style === 'stealth' ? 6 : 5;
    for (let i = 0; i < spokes; i += 1) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(width * 1.06, 0.035, radius * 1.05),
        style === 'stealth' ? diskMat : rimMat,
      );
      spoke.rotation.x = (i / spokes) * Math.PI;
      spoke.position.y = 0;
      spin.add(spoke);
    }
  }

  // Wheel arches / brake calipers give the model a little depth.
  const caliperMat = standardMaterial('#d7ff3f', { emissive: '#d7ff3f', emissiveIntensity: 0.25, metalness: 0.5 });
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, 0.12, 0.2), caliperMat);
  caliper.position.set(0, radius * 0.1, -radius * 0.45);
  spin.add(caliper);

  return { group, spin };
}

export function createCarModel(options: CarVisualOptions): CarModel {
  const { carClass, quality, customization } = options;
  const dims = options.bodyStyle ? BODY_STYLE_DIMENSIONS[options.bodyStyle] : BODY_DIMENSIONS[carClass];
  const group = new THREE.Group();
  const paintable: THREE.Material[] = [];
  const accentMaterials: THREE.MeshStandardMaterial[] = [];
  const brakeMaterials: THREE.MeshStandardMaterial[] = [];
  const wheels: THREE.Object3D[] = [];

  const paint = new THREE.Color(options.paint);
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: paint,
    metalness: 0.55,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.7,
  });
  paintable.push(bodyMaterial);

  const darkMaterial = standardMaterial('#0d1117', { metalness: 0.55, roughness: 0.4 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#1c3240',
    metalness: 0.25,
    roughness: 0.08,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1,
  });
  const trimMaterial = standardMaterial('#151a21', { metalness: 0.7, roughness: 0.3 });
  const lightMaterial = new THREE.MeshStandardMaterial({
    color: '#fffbe0',
    emissive: '#fff6c8',
    emissiveIntensity: 2.6,
    roughness: 0.2,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: options.accent,
    emissive: options.accent,
    emissiveIntensity: 0.45,
    metalness: 0.4,
    roughness: 0.3,
  });
  accentMaterials.push(accentMaterial);

  const lowerHeight = dims.height;
  const width = dims.width;
  const length = dims.length;
  const isOffroad = carClass === 'offroad' || options.bodyStyle === 'suv';
  const isSuper = options.bodyStyle === 'supercar' || carClass === 'hyper';
  const isSedan = options.bodyStyle === 'sedan';

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(width, lowerHeight, length, 5, 0.14),
    bodyMaterial,
  );
  body.position.y = 0.72;
  body.castShadow = quality !== 'low';
  body.receiveShadow = true;
  group.add(body);

  const hood = new THREE.Mesh(
    new RoundedBoxGeometry(width * 0.9, 0.16, length * 0.27, 4, 0.05),
    bodyMaterial,
  );
  hood.position.set(0, 0.94, -length * 0.33);
  hood.castShadow = quality !== 'low';
  group.add(hood);

  const cabinLength = isSuper ? length * 0.35 : length * dims.cabinLength;
  const cabinHeight = isSuper ? dims.cabinHeight : isOffroad ? dims.cabinHeight : dims.cabinHeight;
  const cabin = new THREE.Mesh(
    new RoundedBoxGeometry(width * 0.82, cabinHeight, cabinLength, 4, 0.1),
    glassMaterial,
  );
  cabin.position.set(0, 1.0 + cabinHeight * 0.32, length * 0.05);
  cabin.castShadow = quality !== 'low';
  group.add(cabin);

  const roof = new THREE.Mesh(
    new RoundedBoxGeometry(width * 0.75, 0.11, cabinLength * 0.72, 3, 0.05),
    bodyMaterial,
  );
  roof.position.set(0, 1.0 + cabinHeight * 0.82, length * 0.08);
  roof.castShadow = quality !== 'low';
  group.add(roof);

  // Body-style cues: roof rails on SUVs, a strong shoulder line on saloons,
  // and a short rear deck on supercars. These are still original stylised parts.
  if (dims.roofRails) {
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, cabinLength * 0.75), trimMaterial);
      rail.position.set(side * width * 0.34, 1.02 + cabinHeight * 0.84, length * 0.07);
      group.add(rail);
    }
  }
  if (isSedan) {
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.035, length * 0.68),
        accentMaterial,
      );
      shoulder.position.set(side * (width / 2 + 0.016), 0.8, 0);
      group.add(shoulder);
    }
  }

  // Front splitter and rear diffuser.
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(width * 1.01, 0.08, 0.4), trimMaterial);
  splitter.position.set(0, 0.46, -length / 2 + 0.1);
  group.add(splitter);
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(width * 0.94, 0.11, 0.42), trimMaterial);
  diffuser.position.set(0, 0.47, length / 2 - 0.08);
  group.add(diffuser);

  // Side skirts and mirrors.
  for (const side of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, length * 0.66), trimMaterial);
    skirt.position.set(side * (width / 2 + 0.005), 0.48, 0);
    group.add(skirt);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.26), bodyMaterial);
    mirror.position.set(side * (width / 2 + 0.08), 1.18, -length * 0.1);
    group.add(mirror);
  }

  // Front lamp clusters + rear light bar.
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(width * 0.21, 0.1, 0.07), lightMaterial);
    lamp.position.set(side * width * 0.31, 0.84, -length / 2 - 0.015);
    group.add(lamp);
    const accentStrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.3), accentMaterial);
    accentStrip.position.set(side * width * 0.42, 0.65, -length / 2 + 0.05);
    group.add(accentStrip);
  }

  const brakeMat = new THREE.MeshStandardMaterial({
    color: '#ff2233',
    emissive: '#ff1f35',
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  brakeMaterials.push(brakeMat);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.1, 0.06), brakeMat);
  tail.position.set(0, 0.87, length / 2 + 0.01);
  group.add(tail);
  for (const side of [-1, 1]) {
    const tailPod = new THREE.Mesh(new THREE.BoxGeometry(width * 0.2, 0.16, 0.08), brakeMat);
    tailPod.position.set(side * width * 0.32, 0.93, length / 2 + 0.02);
    group.add(tailPod);
  }

  // Exhaust tips.
  for (const side of [-1, 1]) {
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.18, 10), trimMaterial);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(side * 0.42, 0.45, length / 2 + 0.06);
    group.add(exhaust);
  }

  // Paint decals.
  if (customization.decal !== 'none') {
    const decalMaterial = new THREE.MeshStandardMaterial({
      color: customization.decal === 'flames' ? '#ff7a1a' : '#f8fafc',
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    if (customization.decal === 'stripe') {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, length * 0.94), decalMaterial);
      stripe.position.set(0, 1.005, 0);
      group.add(stripe);
    } else if (customization.decal === 'racing') {
      for (const side of [-1, 1]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, length * 0.94), decalMaterial);
        stripe.position.set(side * 0.22, 1.005, 0);
        group.add(stripe);
      }
    } else {
      for (let i = 0; i < 4; i += 1) {
        const flame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.3, 0.02, 0.26), decalMaterial);
        flame.position.set(-width * 0.34 + i * 0.1, 1.006, -length * 0.18 + i * 0.18);
        flame.rotation.y = 0.2;
        group.add(flame);
      }
    }
  }

  const spoiler = createSpoiler(customization.spoiler, width, bodyMaterial);
  if (spoiler) {
    spoiler.position.z = 0;
    group.add(spoiler);
  }

  // Wheels. The wheel group itself holds steering rotation; the inner spin group rolls.
  const wheelPositions: Array<[number, number]> = [
    [-width / 2 + 0.04, -length * 0.3],
    [width / 2 - 0.04, -length * 0.3],
    [-width / 2 + 0.04, length * 0.3],
    [width / 2 - 0.04, length * 0.3],
  ];
  wheelPositions.forEach(([x, z]) => {
    const wheel = createWheel(dims.wheel, dims.wheelWidth, customization.rim, customization.wheels, quality);
    wheel.group.position.set(x, dims.wheel + (isOffroad ? 0.02 : 0), z);
    group.add(wheel.group);
    wheels.push(wheel.spin);
    wheel.group.userData.isWheel = true;
  });

  if (options.isPlayer) {
    if (customization.underglow) {
      const glowMat = new THREE.MeshBasicMaterial({
        color: customization.underglow,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.35, length * 0.95), glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.06;
      group.add(glow);
    }
    if (options.headlights && quality !== 'low') {
      const headlight = new THREE.SpotLight('#f2f7ff', 32, 58, Math.PI / 6, 0.65, 1.3);
      headlight.position.set(0, 0.95, -length / 2 + 0.2);
      const target = new THREE.Object3D();
      target.position.set(0, 0.1, -28);
      group.add(target);
      headlight.target = target;
      group.add(headlight);
    }
  }

  // Soft contact shadow is cheaper than a real shadow for pooled traffic.
  const shadowMat = new THREE.MeshBasicMaterial({
    color: '#000000',
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.15, length * 1.02), shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.035;
  group.add(contactShadow);

  const paintTargets = group.children.filter(
    (child) => (child as THREE.Mesh).material === bodyMaterial,
  );

  const setPaint = (color: string) => {
    paint.set(color);
    bodyMaterial.color.set(color);
    paintTargets.forEach((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.material === bodyMaterial) mesh.material = bodyMaterial;
    });
  };

  const setBrake = (active: boolean) => {
    brakeMaterials.forEach((material) => {
      material.emissiveIntensity = active ? 3.4 : 0.8;
    });
  };

  const setWheelSpin = (radians: number) => {
    wheels.forEach((wheel) => {
      wheel.rotation.x = radians;
    });
  };

  const dispose = () => {
    disposeObject3D(group);
  };

  return {
    group,
    wheels,
    brakeMaterials,
    bodyMaterial,
    accentMaterials,
    paint,
    setPaint,
    setBrake,
    setWheelSpin,
    dispose,
  };
}

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { CarCustomization, CarDefinition, DestinationDefinition, Quality } from '@/lib/types';
import { createCarModel, type CarModel } from './carModel';
import { buildEnvironment, type EnvironmentHandle } from './environment';
import { disposeObject3D } from './dispose';

type PreviewMode = 'car' | 'destination';

export interface PreviewOptions {
  mode: PreviewMode;
  quality: Quality;
  car: CarDefinition;
  customization: CarCustomization;
  destination?: DestinationDefinition;
  invertCamera?: boolean;
}

/**
 * Lightweight, self-contained Three.js preview renderer used by the garage and
 * destination screens. It owns one animation loop, handles resize/disposal and
 * pauses itself when scrolled out of view or the tab is hidden.
 */
export class PreviewEngine {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private mode: PreviewMode;
  private quality: Quality;
  private car: CarDefinition;
  private customization: CarCustomization;
  private carModel: CarModel | null = null;
  private destination: DestinationDefinition | null = null;
  private environment: EnvironmentHandle | null = null;
  private world = new THREE.Group();
  private invertCamera: boolean;
  private yaw = 0.5;
  private targetYaw = 0.5;
  private targetPitch = 0.25;
  private pitch = 0.25;
  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private lastInteraction = 0;
  private disposed = false;
  private visible = true;
  private lastFrame = 0;
  private elapsed = 0;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private detachPointer: (() => void) | null = null;
  private cleanupVisibility: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, options: PreviewOptions) {
    this.canvas = canvas;
    this.mode = options.mode;
    this.quality = options.quality;
    this.car = options.car;
    this.customization = options.customization;
    this.destination = options.destination ?? null;
    this.invertCamera = options.invertCamera ?? false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: options.quality !== 'low',
      alpha: options.mode === 'car',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.shadowMap.enabled = options.quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    this.renderer.setSize(this.width(), this.height(), false);
    if (options.mode === 'car') this.renderer.setClearColor('#07090c', 0);

    this.camera = new THREE.PerspectiveCamera(42, this.width() / this.height(), 0.1, 700);
    this.camera.position.set(7.2, 3.3, 8.4);

    this.scene.add(this.world);
    if (options.mode === 'car') this.buildStudio();
    else this.buildDestinationPreview();
    this.buildCar();

    this.bindPointer();
    this.bindResize();

    this.lastFrame = performance.now();
    this.renderer.setAnimationLoop(this.tick);
  }

  private width(): number {
    return this.canvas.clientWidth || 640;
  }

  private height(): number {
    return this.canvas.clientHeight || 420;
  }

  private buildStudio(): void {
    this.scene.background = null;
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(9, 64),
      new THREE.MeshStandardMaterial({ color: '#11151b', roughness: 0.32, metalness: 0.55 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.world.add(floor);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(5.5, 5.58, 96),
      new THREE.MeshBasicMaterial({
        color: '#d7ff3f',
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.012;
    this.world.add(ring);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(3.6, 3.63, 96),
      new THREE.MeshBasicMaterial({ color: '#6f7d8b', transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.012;
    this.world.add(innerRing);

    for (let i = 0; i < 24; i += 1) {
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.015, 0.035),
        new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? '#d7ff3f' : '#4b5563' }),
      );
      tick.position.set(Math.cos((i / 24) * Math.PI * 2) * 6.6, 0.02, Math.sin((i / 24) * Math.PI * 2) * 6.6);
      tick.rotation.y = -(i / 24) * Math.PI * 2;
      this.world.add(tick);
    }

    const hemisphere = new THREE.HemisphereLight('#dbeafe', '#0b0f14', 1.5);
    this.world.add(hemisphere);

    const key = new THREE.DirectionalLight('#ffffff', 3.2);
    key.position.set(-5, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(this.quality === 'high' ? 1024 : 512, this.quality === 'high' ? 1024 : 512);
    key.shadow.camera.left = -9;
    key.shadow.camera.right = 9;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    key.shadow.camera.far = 40;
    key.shadow.bias = -0.0008;
    this.world.add(key);

    const lime = new THREE.PointLight('#d7ff3f', 24, 22, 1.7);
    lime.position.set(-5.5, 2.2, -4.5);
    this.world.add(lime);
    const cool = new THREE.PointLight('#4cc9f0', 20, 20, 1.8);
    cool.position.set(5.5, 1.8, -3.2);
    this.world.add(cool);
    const rim = new THREE.PointLight('#ffffff', 15, 18, 1.7);
    rim.position.set(0, 4.2, 6.5);
    this.world.add(rim);

    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 10),
      new THREE.MeshBasicMaterial({ color: '#0a0e13', transparent: true, opacity: 0.55 }),
    );
    backdrop.position.set(0, 4.8, -8);
    this.world.add(backdrop);
  }

  private buildDestinationPreview(): void {
    if (!this.destination) return;
    this.environment = buildEnvironment(this.scene, this.destination, this.quality, { preview: true });
    this.renderer.setClearColor(this.destination.theme.sky, 1);

    const marker = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 48),
      new THREE.MeshBasicMaterial({
        color: this.destination.theme.accent,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0, 0.01, 4);
    this.world.add(marker);
  }

  private buildCar(): void {
    if (this.carModel) {
      this.world.remove(this.carModel.group);
      this.carModel.dispose();
      this.carModel = null;
    }
    this.carModel = createCarModel({
      paint: this.customization.paint,
      customization: this.customization,
      carClass: this.car.className,
      bodyStyle: this.car.bodyStyle,
      accent: this.car.accent,
      quality: this.quality,
      isPlayer: true,
      headlights: this.mode === 'destination' && this.destination?.theme.timeOfDay === 'night',
    });
    const group = this.carModel.group;
    if (this.mode === 'car') {
      group.position.y = 0;
      group.rotation.y = 0;
    } else {
      group.position.set(-2.075, 0, 2.5);
      group.rotation.y = Math.PI;
      this.carModel.setBrake(false);
    }
    this.world.add(group);
  }

  private bindPointer(): void {
    let pointerId: number | null = null;
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      pointerId = event.pointerId;
      this.dragging = true;
      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;
      this.lastInteraction = performance.now();
      this.canvas.setPointerCapture(event.pointerId);
      this.canvas.style.cursor = 'grabbing';
    };
    const onMove = (event: PointerEvent) => {
      if (!this.dragging || pointerId !== event.pointerId) return;
      const dx = event.clientX - this.lastPointerX;
      const dy = event.clientY - this.lastPointerY;
      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;
      this.lastInteraction = performance.now();
      if (this.mode === 'car') {
        this.targetYaw += dx * 0.009 * (this.invertCamera ? -1 : 1);
        this.targetPitch = THREE.MathUtils.clamp(
          this.targetPitch + dy * 0.004 * (this.invertCamera ? -1 : 1),
          0.06,
          0.55,
        );
      } else {
        this.targetYaw = THREE.MathUtils.clamp(this.targetYaw + dx * 0.003, -0.6, 0.6);
        this.targetPitch = THREE.MathUtils.clamp(this.targetPitch + dy * 0.002, 0.12, 0.5);
      }
    };
    const onUp = (event: PointerEvent) => {
      if (pointerId !== null && this.canvas.hasPointerCapture(pointerId)) {
        this.canvas.releasePointerCapture(pointerId);
      }
      pointerId = null;
      this.dragging = false;
      this.canvas.style.cursor = 'grab';
    };
    this.canvas.style.cursor = 'grab';
    this.canvas.addEventListener('pointerdown', onDown);
    this.canvas.addEventListener('pointermove', onMove);
    this.canvas.addEventListener('pointerup', onUp);
    this.canvas.addEventListener('pointercancel', onUp);
    this.canvas.addEventListener('pointerleave', onUp);
    this.detachPointer = () => {
      this.canvas.removeEventListener('pointerdown', onDown);
      this.canvas.removeEventListener('pointermove', onMove);
      this.canvas.removeEventListener('pointerup', onUp);
      this.canvas.removeEventListener('pointercancel', onUp);
      this.canvas.removeEventListener('pointerleave', onUp);
    };
  }

  private bindResize(): void {
    const onResize = () => {
      if (this.disposed) return;
      const width = this.width();
      const height = this.height();
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    };
    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(onResize);
      this.resizeObserver.observe(this.canvas);
    }
    const onVisibility = () => {
      if (document.hidden) this.renderer.setAnimationLoop(null);
      else {
        this.lastFrame = performance.now();
        this.renderer.setAnimationLoop(this.tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          this.visible = entry?.isIntersecting ?? true;
          if (this.visible) {
            this.lastFrame = performance.now();
            if (!document.hidden) this.renderer.setAnimationLoop(this.tick);
          } else {
            this.renderer.setAnimationLoop(null);
          }
        },
        { threshold: 0.05 },
      );
      this.intersectionObserver.observe(this.canvas);
    }
    this.cleanupVisibility = () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      this.resizeObserver?.disconnect();
      this.intersectionObserver?.disconnect();
    };
  }

  private tick = (time: number): void => {
    if (this.disposed || !this.visible) return;
    const dt = Math.min(0.05, Math.max(0, (time - this.lastFrame) / 1000));
    this.lastFrame = time;
    this.elapsed += dt;

    if (this.mode === 'car') {
      if (!this.dragging && performance.now() - this.lastInteraction > 3200) {
        this.targetYaw += dt * 0.22;
      }
      this.yaw = THREE.MathUtils.damp(this.yaw, this.targetYaw, 6, dt);
      this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 6, dt);
      if (this.carModel) {
        this.carModel.group.rotation.y = this.yaw;
        this.carModel.setWheelSpin(this.elapsed * 0.3);
      }
      const radius = 8.7;
      const height = 2.4 + this.pitch * 4.8;
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        Math.sin(this.yaw * 0.3) * radius * 0.25,
        3,
        dt,
      );
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, height, 4, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, radius * 0.72, 3, dt);
      this.camera.lookAt(0, 0.75, 0);
    } else {
      this.yaw = THREE.MathUtils.damp(this.yaw, this.targetYaw, 4, dt);
      this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 4, dt);
      const angle = 0.15 + this.yaw + Math.sin(this.elapsed * 0.08) * 0.04;
      const radius = 15;
      this.camera.position.x = Math.sin(angle) * radius;
      this.camera.position.y = 3.4 + this.pitch * 5;
      this.camera.position.z = Math.cos(angle) * radius - 4;
      this.camera.lookAt(0, 0.9, -18);
      if (this.environment) this.environment.update(dt, 0, 0);
      if (this.carModel) this.carModel.setWheelSpin(0);
    }

    this.renderer.render(this.scene, this.camera);
  };

  updateCar(car: CarDefinition, customization: CarCustomization): void {
    const paintOnly =
      this.car.id === car.id &&
      this.customization.rim === customization.rim &&
      this.customization.spoiler === customization.spoiler &&
      this.customization.wheels === customization.wheels &&
      this.customization.decal === customization.decal &&
      this.customization.underglow === customization.underglow;
    this.car = car;
    this.customization = customization;
    if (paintOnly && this.carModel) {
      this.carModel.setPaint(customization.paint);
    } else {
      this.buildCar();
    }
  }

  setPaint(color: string): void {
    this.customization = { ...this.customization, paint: color };
    this.carModel?.setPaint(color);
  }

  setInvertCamera(invert: boolean): void {
    this.invertCamera = invert;
  }

  resetView(): void {
    this.targetYaw = 0.5;
    this.targetPitch = 0.25;
    this.lastInteraction = performance.now();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.detachPointer?.();
    this.cleanupVisibility?.();
    this.carModel?.dispose();
    this.environment?.dispose();
    this.scene.remove(this.world);
    disposeObject3D(this.world);
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

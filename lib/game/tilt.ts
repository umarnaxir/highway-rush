import type { Settings } from '@/lib/types';

export type TiltStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'active'
  | 'denied'
  | 'unsupported'
  | 'error';

export interface TiltReadout {
  /** Calibrated, smoothed steering axis in -1..1. */
  steer: number;
  /** Raw signed device angle in degrees after calibration. */
  angle: number;
  status: TiltStatus;
  screenAngle: number;
}

type PermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported';

interface OrientationPermissionConstructor {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}

let permissionState: PermissionState = 'unknown';

function orientationConstructor(): OrientationPermissionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.DeviceOrientationEvent as unknown as OrientationPermissionConstructor | null;
}

export function tiltSupported(): boolean {
  return Boolean(orientationConstructor());
}

export function tiltNeedsPermission(): boolean {
  const ctor = orientationConstructor();
  return typeof ctor?.requestPermission === 'function';
}

export function currentTiltPermission(): PermissionState {
  return permissionState;
}

/**
 * Must be called from a user gesture on iOS. Safe to call elsewhere: plain
 * browsers return granted immediately once the sensor exists.
 */
export async function requestTiltAccess(): Promise<TiltStatus> {
  if (!tiltSupported()) {
    permissionState = 'unsupported';
    return 'unsupported';
  }
  if (!tiltNeedsPermission()) {
    permissionState = 'granted';
    return 'granted' as TiltStatus;
  }
  try {
    const result = await orientationConstructor()!.requestPermission!();
    permissionState = result === 'granted' ? 'granted' : 'denied';
    return permissionState === 'granted' ? ('granted' as TiltStatus) : 'denied';
  } catch {
    permissionState = 'denied';
    return 'error';
  }
}

function screenAngle(): number {
  if (typeof window === 'undefined') return 0;
  const angle = window.screen?.orientation?.angle;
  if (typeof angle === 'number') return angle;
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === 'number' ? legacy : 0;
}

/**
 * DeviceOrientation-based steering with explicit calibration, dead zone,
 * low-pass smoothing and reverse. It is intentionally independent of the race
 * engine so the settings page can test it before a run starts.
 */
export class TiltController {
  private readonly options: Settings['controls']['tilt'];
  private status: TiltStatus = 'idle';
  private raw = 0;
  private offset = 0;
  private filtered = 0;
  private angle = 0;
  private attached = false;
  private hasReading = false;
  private onUpdate: ((readout: TiltReadout) => void) | null = null;

  constructor(tilt: Settings['controls']['tilt'], onUpdate?: (readout: TiltReadout) => void) {
    this.options = { ...tilt };
    this.onUpdate = onUpdate ?? null;
  }

  getStatus(): TiltStatus {
    return this.status;
  }

  getReadout(): TiltReadout {
    return {
      steer: this.filtered,
      angle: this.angle,
      status: this.status,
      screenAngle: screenAngle(),
    };
  }

  async start(): Promise<TiltStatus> {
    if (!tiltSupported()) {
      this.setStatus('unsupported');
      return this.status;
    }
    if (permissionState === 'denied') {
      this.setStatus('denied');
      return this.status;
    }
    if (permissionState === 'unknown' && tiltNeedsPermission()) {
      // A caller with a gesture should await requestTiltAccess() first.
      this.setStatus('idle');
      return this.status;
    }
    this.attach();
    this.setStatus('active');
    return this.status;
  }

  /** Capture the current attitude as straight-ahead. */
  calibrate(): void {
    this.offset = this.raw;
    this.filtered = 0;
    // If the sensor has not delivered a sample yet, hasReading stays false so
    // the first real sample becomes the neutral point. Otherwise this is an
    // explicit mid-race recalibration.
    this.emit();
  }

  stop(): void {
    if (typeof window === 'undefined') return;
    if (this.attached) {
      window.removeEventListener('deviceorientation', this.handleOrientation);
      this.attached = false;
    }
    this.filtered = 0;
    this.hasReading = false;
    this.status = 'idle';
    this.emit();
  }

  setEnabled(enabled: boolean): void {
    if (!enabled) {
      this.filtered = 0;
      this.emit();
    }
  }

  private attach(): void {
    if (typeof window === 'undefined' || this.attached) return;
    window.addEventListener('deviceorientation', this.handleOrientation, { passive: true });
    this.attached = true;
  }

  private setStatus(status: TiltStatus): void {
    this.status = status;
    this.emit();
  }

  private handleOrientation = (event: DeviceOrientationEvent): void => {
    const beta = typeof event.beta === 'number' ? event.beta : 0;
    const gamma = typeof event.gamma === 'number' ? event.gamma : 0;
    const angle = screenAngle();
    // Portrait: roll is gamma. Landscape: the phone's long axis is horizontal,
    // so the same physical roll maps to beta.
    const landscape = Math.abs(angle) === 90;
    this.raw = landscape ? beta : gamma;
    if (!this.hasReading) {
      this.offset = this.raw;
      this.hasReading = true;
    }
    this.angle = this.raw - this.offset;

    const range = Math.max(6, this.options.maxSteer);
    let target = ((this.raw - this.offset) / range) * this.options.sensitivity;
    target = Math.max(-1, Math.min(1, target));
    const dead = Math.max(0, Math.min(0.3, this.options.deadZone));
    if (Math.abs(target) < dead) target = 0;
    else target = (target - Math.sign(target) * dead) / (1 - dead);
    if (this.options.reverse) target *= -1;

    // Smoothing is exposed as a 0.02..0.85 low-pass weight. Lower values are
    // crisper; higher values are calmer and better for rough hands.
    const alpha = Math.max(0.15, 1 - this.options.smoothing);
    this.filtered += (target - this.filtered) * alpha;
    this.emit();
  };

  private emit(): void {
    this.onUpdate?.(this.getReadout());
  }
}

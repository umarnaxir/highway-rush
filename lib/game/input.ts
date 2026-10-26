import type { ControlAction } from '@/lib/types';

export interface InputState {
  steer: number;
  throttle: number;
  brake: number;
  nitro: boolean;
  gamepad: boolean;
}

const GAME_KEYS: ControlAction[] = ['steerLeft', 'steerRight', 'accelerate', 'brake', 'nitro', 'pause'];

export class InputController {
  private bindings: Record<ControlAction, string>;
  private down = new Set<string>();
  private virtual: Record<ControlAction, boolean> = {
    steerLeft: false,
    steerRight: false,
    accelerate: false,
    brake: false,
    nitro: false,
    pause: false,
  };
  private gamepadNitro = false;
  private lastGamepadPause = false;
  /** Continuous steering from tilt or touch-drag, in the range -1..1. */
  private analogSteer = 0;
  private disposed = false;
  private enabled = false;
  private onPause: () => void;

  constructor(bindings: Record<ControlAction, string>, onPause: () => void) {
    this.bindings = { ...bindings };
    this.onPause = onPause;
  }

  attach(): () => void {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!this.enabled) return;
      if (this.isTypingTarget(event.target)) return;
      const action = this.actionForCode(event.code);
      if (!action) return;
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      if (action === 'pause') {
        this.onPause();
        return;
      }
      this.down.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (this.isTypingTarget(event.target)) return;
      const action = this.actionForCode(event.code);
      if (!action) return;
      if (action !== 'pause') event.preventDefault();
      this.down.delete(event.code);
    };
    const onBlur = () => this.clearTransient();
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onBlur);
    };
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) return false;
    const tag = element.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
  }

  private actionForCode(code: string): ControlAction | null {
    for (const action of GAME_KEYS) {
      if (this.bindings[action] === code) return action;
    }
    return null;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clearTransient();
  }

  setBindings(bindings: Record<ControlAction, string>): void {
    this.bindings = { ...bindings };
  }

  setVirtual(action: ControlAction, active: boolean): void {
    if (action === 'pause') {
      if (active) this.onPause();
      return;
    }
    this.virtual[action] = active;
  }

  /** Feed a continuous steering axis from a tilt sensor or pointer drag. */
  setAnalogSteer(value: number): void {
    this.analogSteer = Math.min(1, Math.max(-1, Number.isFinite(value) ? value : 0));
  }

  clearTransient(): void {
    this.down.clear();
    this.virtual.steerLeft = false;
    this.virtual.steerRight = false;
    this.virtual.accelerate = false;
    this.virtual.brake = false;
    this.virtual.nitro = false;
    this.gamepadNitro = false;
    this.analogSteer = 0;
  }

  private namedDown(action: ControlAction): boolean {
    return this.down.has(this.bindings[action]) || this.virtual[action];
  }

  getState(): InputState {
    if (this.disposed) {
      return { steer: 0, throttle: 0, brake: 0, nitro: false, gamepad: false };
    }
    let steerAxis = 0;
    let gameThrottle = 0;
    let gameBrake = 0;
    let gamepad = false;
    let pausePressed = false;

    if (typeof navigator !== 'undefined' && 'getGamepads' in navigator) {
      try {
        const pads = navigator.getGamepads();
        const pad = pads.find((candidate) => candidate && candidate.connected);
        if (pad) {
          gamepad = true;
          const axis = pad.axes[0] ?? 0;
          if (Math.abs(axis) > 0.16) steerAxis = axis;
          gameThrottle = Math.max(pad.buttons[7]?.value ?? 0, pad.buttons[0]?.value ?? 0);
          gameBrake = Math.max(pad.buttons[6]?.value ?? 0, pad.buttons[1]?.value ?? 0);
          const nitroPressed = Boolean(
            pad.buttons[5]?.pressed || pad.buttons[2]?.pressed || pad.buttons[3]?.pressed,
          );
          if (nitroPressed) this.gamepadNitro = true;
          if (!nitroPressed) this.gamepadNitro = false;
          pausePressed = Boolean(pad.buttons[9]?.pressed);
        }
      } catch {
        // Gamepad access can throw in restricted contexts.
      }
    }

    if (pausePressed && !this.lastGamepadPause) this.onPause();
    this.lastGamepadPause = pausePressed;

    const left = this.namedDown('steerLeft');
    const right = this.namedDown('steerRight');
    let steer = (right ? 1 : 0) - (left ? 1 : 0);
    if (Math.abs(steerAxis) > Math.abs(steer)) steer = steerAxis;
    if (Math.abs(this.analogSteer) > Math.abs(steer)) steer = this.analogSteer;
    const throttle = Math.max(
      this.namedDown('accelerate') ? 1 : 0,
      gamepad ? gameThrottle : 0,
    );
    const brake = Math.max(this.namedDown('brake') ? 1 : 0, gamepad ? gameBrake : 0);
    return {
      steer,
      throttle,
      brake,
      nitro: this.namedDown('nitro') || this.gamepadNitro,
      gamepad,
    };
  }

  dispose(): void {
    this.disposed = true;
    this.clearTransient();
  }
}

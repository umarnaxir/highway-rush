'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  Accessibility,
  AudioLines,
  Gauge,
  Gamepad2,
  Keyboard,
  MoveHorizontal,
  Palette,
  RotateCcw,
  Settings2,
  Smartphone,
  SlidersHorizontal,
  Trash2,
  Volume2,
  Wrench,
  Zap,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Badge, Divider, Panel, PanelLabel, SectionKicker } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Segmented, Slider, Toggle } from '@/components/ui/Controls';
import {
  DEFAULT_SETTINGS,
  useGameStore,
} from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import {
  requestTiltAccess,
  TiltController,
  tiltNeedsPermission,
  tiltSupported,
  type TiltReadout,
} from '@/lib/game/tilt';
import { useUiStore } from '@/lib/store/useUiStore';
import type {
  ControlAction,
  Difficulty,
  GraphicsPreset,
  Quality,
  Settings,
  SpeedUnit,
} from '@/lib/types';
import { media } from '@/lib/ui/theme';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 24px;
  align-items: start;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const Side = styled.div`
  position: sticky;
  top: calc(var(--nav-total-height) + 20px);
  display: flex;
  flex-direction: column;
  gap: 4px;

  ${media.desktop} {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
  }
`;

const SideLink = styled.a`
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all 0.15s ease;

  svg {
    color: ${({ theme }) => theme.colors.textDim};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.line};
    background: rgba(255, 255, 255, 0.025);
  }

  ${media.desktop} {
    min-height: 34px;
    padding: 0 10px;
    border-color: var(--line);
  }
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

const Section = styled(Panel)`
  padding: clamp(20px, 3vw, 30px);
  scroll-margin-top: calc(var(--nav-total-height) + 18px);
`;

const SectionTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 24px;
    text-transform: uppercase;
    font-style: italic;
    line-height: 1;
  }
  p {
    margin-top: 8px;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.65;
    max-width: 560px;
  }
  svg {
    color: ${({ theme }) => theme.colors.lime};
  }
`;

const KeyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);

  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const KeyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);

  span {
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
`;

const KeyButton = styled.button<{ $recording: boolean }>`
  min-width: 78px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 3px;
  border: 1px solid ${({ $recording, theme }) => ($recording ? theme.colors.lime : theme.colors.lineStrong)};
  background: ${({ $recording }) => ($recording ? 'rgba(215,255,63,.14)' : 'rgba(0,0,0,.28)')};
  color: ${({ $recording, theme }) => ($recording ? theme.colors.lime : theme.colors.text)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.lime};
  }
`;

const TestRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
`;

const Note = styled.div`
  margin-top: 14px;
  padding: 12px 14px;
  border-left: 2px solid var(--line-strong);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-dim);
  font-size: 10px;
  line-height: 1.65;
`;

const About = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.7;
`;

const DangerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  flex-wrap: wrap;

  &:last-child {
    border-bottom: 0;
  }

  strong {
    display: block;
    color: var(--text);
    font-size: 11px;
    letter-spacing: 0.04em;
  }
  p {
    margin-top: 4px;
    color: var(--text-muted);
    font-size: 10px;
    line-height: 1.5;
    max-width: 520px;
  }
`;

const TiltPanel = styled.div`
  margin: 4px 0 8px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background:
    radial-gradient(420px circle at 100% 0%, rgba(215, 255, 63, 0.06), transparent 60%),
    rgba(0, 0, 0, 0.16);
`;

const TiltHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;

  strong {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  svg {
    color: var(--lime);
  }
`;

const TiltReadout = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(215, 255, 63, 0.26)' : 'var(--line)')};
  border-radius: 4px;
  background: ${({ $active }) => ($active ? 'rgba(215, 255, 63, 0.05)' : 'rgba(255, 255, 255, 0.02)')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;

  span:first-child {
    min-width: 78px;
  }

  i {
    position: relative;
    flex: 1;
    height: 5px;
    min-width: 80px;
    border-radius: 999px;
    background: rgba(245, 246, 247, 0.12);
  }

  i::after {
    content: '';
    position: absolute;
    top: 50%;
    left: calc(50% + var(--readout-steer, 0%));
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 12px currentColor;
    transform: translate(-50%, -50%);
  }
`;

const keyLabels: Record<ControlAction, string> = {
  steerLeft: 'Steer left',
  steerRight: 'Steer right',
  accelerate: 'Accelerate',
  brake: 'Brake',
  nitro: 'Nitro',
  pause: 'Pause',
};

function displayKey(code: string): string {
  const map: Record<string, string> = {
    ArrowLeft: '← Left',
    ArrowRight: '→ Right',
    ArrowUp: '↑ Up',
    ArrowDown: '↓ Down',
    Space: 'Space',
    Escape: 'Esc',
    ShiftLeft: 'L Shift',
    ShiftRight: 'R Shift',
    ControlLeft: 'L Ctrl',
    ControlRight: 'R Ctrl',
  };
  return map[code] ?? code.replace('Key', '').replace('Digit', '');
}

function presetSettings(preset: GraphicsPreset): Settings['graphics'] {
  switch (preset) {
    case 'low':
      return {
        ...DEFAULT_SETTINGS.graphics,
        preset: 'low',
        shadows: false,
        shadowQuality: 'low',
        antialias: false,
        renderScale: 0.75,
        effects: 'low',
        performanceMode: true,
      };
    case 'medium':
      return {
        ...DEFAULT_SETTINGS.graphics,
        preset: 'medium',
        shadows: true,
        shadowQuality: 'low',
        antialias: false,
        renderScale: 0.9,
        effects: 'medium',
        performanceMode: false,
      };
    case 'high':
      return { ...DEFAULT_SETTINGS.graphics, preset: 'high' };
    default:
      return DEFAULT_SETTINGS.graphics;
  }
}

export default function SettingsPage() {
  const settings = useGameStore((state) => state.settings);
  const updateSetting = useGameStore((state) => state.updateSetting);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const setKeyBinding = useGameStore((state) => state.setKeyBinding);
  const restoreDefaults = useGameStore((state) => state.restoreDefaultSettings);
  const resetProgress = useGameStore((state) => state.resetProgress);
  const pushToast = useUiStore((state) => state.pushToast);

  const [recording, setRecording] = useState<ControlAction | null>(null);
  const [confirmDefaults, setConfirmDefaults] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [tiltReadout, setTiltReadout] = useState<TiltReadout | null>(null);
  const [tiltTesting, setTiltTesting] = useState(false);
  const [sensorSupported, setSensorSupported] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const tiltControllerRef = useRef<TiltController | null>(null);

  // Device APIs are client-only. Start from the server-safe state and detect
  // after hydration so the status copy cannot mismatch the SSR HTML.
  useEffect(() => {
    setSensorSupported(tiltSupported());
    setNeedsPermission(tiltNeedsPermission());
    return () => {
      tiltControllerRef.current?.stop();
      tiltControllerRef.current = null;
    };
  }, []);

  const stopTiltTest = () => {
    tiltControllerRef.current?.stop();
    tiltControllerRef.current = null;
    setTiltTesting(false);
    setTiltReadout(null);
  };

  const startTiltTest = async () => {
    if (tiltTesting) {
      stopTiltTest();
      return;
    }
    if (!tiltSupported()) {
      pushToast({
        kind: 'info',
        title: 'Motion sensor unavailable',
        message: 'This device or browser does not expose DeviceOrientation. Button and keyboard steering still work.',
      });
      return;
    }
    setTiltTesting(true);
    const access = await requestTiltAccess();
    if (access !== 'granted' && access !== 'active') {
      setTiltTesting(false);
      setTiltReadout(null);
      pushToast({
        kind: access === 'denied' ? 'error' : 'info',
        title: access === 'denied' ? 'Motion access denied' : 'Motion access unavailable',
        message:
          access === 'denied'
            ? 'Enable motion access in browser settings, then try again. Touch buttons remain available.'
            : 'This browser could not start the motion sensor. Touch buttons remain available.',
      });
      return;
    }
    const controller = new TiltController(settings.controls.tilt, (readout) => {
      setTiltReadout(readout);
    });
    tiltControllerRef.current = controller;
    const status = await controller.start();
    if (status !== 'active') {
      stopTiltTest();
      pushToast({
        kind: 'error',
        title: 'Tilt sensor did not start',
        message: 'You can still race with on-screen buttons or a keyboard.',
      });
      return;
    }
    controller.calibrate();
    setTiltReadout(controller.getReadout());
  };

  const updateTilt = (patch: Partial<Settings['controls']['tilt']>) => {
    updateSetting('controls', 'tilt', { ...settings.controls.tilt, ...patch });
    const controller = tiltControllerRef.current;
    if (controller) {
      // Rebuild the live test with the new tuning so the readout is truthful.
      stopTiltTest();
    }
  };

  useEffect(() => {
    if (!recording) return;
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.code === 'Escape') {
        setRecording(null);
        return;
      }
      setKeyBinding(recording, event.code);
      setRecording(null);
      getAudioManager().playCue('ui');
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recording, setKeyBinding]);

  const setGraphics = (patch: Partial<Settings['graphics']>, preset?: GraphicsPreset) => {
    updateSettings({
      ...settings,
      graphics: { ...settings.graphics, ...patch, preset: preset ?? 'custom' },
    });
  };

  const testAudio = (kind: 'engine' | 'effects' | 'music' | 'ambience') => {
    const audio = getAudioManager();
    void audio.unlock().then(() => audio.testAudio(kind));
  };

  return (
    <PageShell
      kicker="Control room"
      title={
        <>
          Settings, <em>your way.</em>
        </>
      }
      intro="Every option is saved locally and applied immediately. Audio unlocks after your first tap or key press, as required by browser policy."
      actions={
        <Badge $tone="lime">
          <Settings2 size={10} /> Autosaved
        </Badge>
      }
      wide
    >
      <Layout>
        <Side aria-label="Settings sections">
          <SideLink href="#graphics">
            <SlidersHorizontal size={13} /> Graphics
          </SideLink>
          <SideLink href="#audio">
            <AudioLines size={13} /> Audio
          </SideLink>
          <SideLink href="#controls">
            <Keyboard size={13} /> Controls
          </SideLink>
          <SideLink href="#gameplay">
            <Gauge size={13} /> Gameplay
          </SideLink>
          <SideLink href="#accessibility">
            <Accessibility size={13} /> Accessibility
          </SideLink>
          <SideLink href="#about">
            <Palette size={13} /> About
          </SideLink>
        </Side>

        <Sections>
          <Section id="graphics">
            <SectionTop>
              <div>
                <h2>
                  <SlidersHorizontal size={20} /> Graphics
                </h2>
                <p>
                  Rendering quality, shadows and effects. Antialias changes take effect the next
                  time a 3D scene is created; every other option applies live.
                </p>
              </div>
              <Badge>{settings.graphics.preset}</Badge>
            </SectionTop>
            <Segmented
              label="Quality preset"
              description="Fast starting points. Any manual change switches the preset to custom."
              value={settings.graphics.preset}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'custom', label: 'Custom' },
              ]}
              onChange={(value) => {
                if (value === 'custom') {
                  setGraphics({}, 'custom');
                } else {
                  updateSettings({ ...settings, graphics: presetSettings(value) });
                }
              }}
            />
            <Toggle
              label="Shadows"
              description="Dynamic car and scenery shadows. Disabled automatically in performance mode."
              checked={settings.graphics.shadows}
              onChange={(value) => setGraphics({ shadows: value })}
            />
            <Segmented
              label="Shadow quality"
              description="Higher quality uses softer filtering and a larger shadow map."
              value={settings.graphics.shadowQuality}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              onChange={(value) => setGraphics({ shadowQuality: value as Quality })}
            />
            <Slider
              label="Render scale"
              description="Lower values render fewer pixels for a large performance gain."
              value={settings.graphics.renderScale}
              min={0.5}
              max={1}
              step={0.05}
              onChange={(value) => setGraphics({ renderScale: value })}
              format={(value) => `${Math.round(value * 100)}%`}
            />
            <Segmented
              label="Effect quality"
              description="Controls scenery density, weather particles and traffic model detail."
              value={settings.graphics.effects}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              onChange={(value) => setGraphics({ effects: value as Quality })}
            />
            <Toggle
              label="Antialias"
              description="Smooths jagged geometry edges. Requires a new 3D scene to take effect."
              checked={settings.graphics.antialias}
              onChange={(value) => setGraphics({ antialias: value })}
            />
            <Toggle
              label="Performance mode"
              description="Forces low-detail rendering, disables shadows and reduces pixel ratio."
              checked={settings.graphics.performanceMode}
              onChange={(value) => setGraphics({ performanceMode: value })}
            />
            <Toggle
              label="Show FPS"
              description="Display a live frame-rate readout in the racing HUD."
              checked={settings.graphics.showFps}
              onChange={(value) => setGraphics({ showFps: value })}
            />
          </Section>

          <Section id="audio">
            <SectionTop>
              <div>
                <h2>
                  <Volume2 size={20} /> Audio
                </h2>
                <p>
                  All sound is synthesised live with the Web Audio API: engine, gear shifts, tyres,
                  nitro, impacts, traffic ambience and the music score. No external audio files.
                </p>
              </div>
              <Badge $tone={settings.audio.muted ? 'warning' : 'lime'}>
                {settings.audio.muted ? 'Muted' : 'Enabled'}
              </Badge>
            </SectionTop>
            <Toggle
              label="Mute all audio"
              description="Silences every bus without changing the mix."
              checked={settings.audio.muted}
              onChange={(value) => updateSetting('audio', 'muted', value)}
            />
            <Slider
              label="Master volume"
              value={settings.audio.master}
              onChange={(value) => updateSetting('audio', 'master', value)}
              format={(value) => `${Math.round(value * 100)}%`}
            />
            <Slider
              label="Engine"
              value={settings.audio.engine}
              onChange={(value) => updateSetting('audio', 'engine', value)}
              format={(value) => `${Math.round(value * 100)}%`}
            />
            <Slider
              label="Effects"
              value={settings.audio.sfx}
              onChange={(value) => updateSetting('audio', 'sfx', value)}
              format={(value) => `${Math.round(value * 100)}%`}
            />
            <Slider
              label="Music"
              value={settings.audio.music}
              onChange={(value) => updateSetting('audio', 'music', value)}
              format={(value) => `${Math.round(value * 100)}%`}
            />
            <Slider
              label="Ambience"
              value={settings.audio.ambience}
              onChange={(value) => updateSetting('audio', 'ambience', value)}
              format={(value) => `${Math.round(value * 100)}%`}
            />
            <TestRow>
              <Button size="sm" variant="secondary" icon={<Zap size={12} />} onClick={() => testAudio('engine')}>
                Test engine
              </Button>
              <Button size="sm" variant="secondary" icon={<AudioLines size={12} />} onClick={() => testAudio('effects')}>
                Test effects
              </Button>
              <Button size="sm" variant="secondary" icon={<Volume2 size={12} />} onClick={() => testAudio('music')}>
                Test music
              </Button>
              <Button size="sm" variant="secondary" icon={<AudioLines size={12} />} onClick={() => testAudio('ambience')}>
                Test ambience
              </Button>
            </TestRow>
            <Note>
              If you hear nothing, tap the page once to unlock the browser audio context. Muting
              persists across sessions.
            </Note>
          </Section>

          <Section id="controls">
            <SectionTop>
              <div>
                <h2>
                  <Keyboard size={20} /> Controls
                </h2>
                <p>
                  Keyboard, gamepad and touch are always available. Choose a preferred scheme for
                  the HUD hint, tune steering sensitivity, or rebind any keyboard action.
                </p>
              </div>
              <Badge>{settings.controls.method}</Badge>
            </SectionTop>
            <Segmented
              label="Steering method"
              description="Your preference is saved locally and carried into every race. Auto uses touch pads on phones, keyboard on desktop and gamepad when one is connected."
              value={settings.controls.method}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'buttons', label: 'Touch buttons' },
                { value: 'drag', label: 'Touch drag' },
                { value: 'tilt', label: 'Tilt' },
                { value: 'keyboard', label: 'Keyboard' },
                { value: 'gamepad', label: 'Gamepad' },
              ]}
              onChange={(value) => updateSetting('controls', 'method', value)}
            />

            <TiltPanel>
              <TiltHead>
                <strong>
                  <Smartphone size={14} /> Gyroscope steering
                </strong>
                <Button
                  size="sm"
                  variant={tiltTesting ? 'danger' : 'secondary'}
                  icon={tiltTesting ? <RotateCcw size={12} /> : <MoveHorizontal size={12} />}
                  onClick={() => void startTiltTest()}
                >
                  {tiltTesting ? 'Stop test' : 'Test sensor'}
                </Button>
              </TiltHead>
              <TiltReadout
                $active={tiltTesting && tiltReadout?.status === 'active'}
                role="status"
                aria-live="polite"
              >
                <span>
                  {tiltTesting
                    ? tiltReadout?.status === 'active'
                      ? 'Sensor active'
                      : 'Starting…'
                    : sensorSupported
                      ? 'Sensor available'
                      : 'No sensor detected'}
                </span>
                <i
                  style={{
                    ['--readout-steer' as string]: `${((tiltReadout?.steer ?? 0) * 50).toFixed(1)}%`,
                  }}
                  aria-hidden="true"
                />
                <span>
                  {tiltReadout ? `${tiltReadout.angle.toFixed(1)}°` : '—'}
                </span>
              </TiltReadout>
              <Slider
                label="Tilt sensitivity"
                description="Scales how far you need to roll the device for full lock."
                value={settings.controls.tilt.sensitivity}
                min={0.4}
                max={2}
                step={0.05}
                onChange={(value) => updateTilt({ sensitivity: value })}
                format={(value) => `${value.toFixed(2)}×`}
              />
              <Slider
                label="Tilt dead zone"
                description="Small hand movements near centre are ignored. Raise this if the car drifts on a straight."
                value={settings.controls.tilt.deadZone}
                min={0}
                max={0.3}
                step={0.01}
                onChange={(value) => updateTilt({ deadZone: value })}
                format={(value) => `${Math.round(value * 100)}%`}
              />
              <Slider
                label="Tilt smoothing"
                description="Higher values calm jitter but add a little steering delay. Lower values feel sharper."
                value={settings.controls.tilt.smoothing}
                min={0.02}
                max={0.85}
                step={0.01}
                onChange={(value) => updateTilt({ smoothing: value })}
                format={(value) => `${Math.round(value * 100)}%`}
              />
              <Slider
                label="Maximum tilt angle"
                description="Physical roll in degrees that maps to full steering lock."
                value={settings.controls.tilt.maxSteer}
                min={12}
                max={55}
                step={1}
                onChange={(value) => updateTilt({ maxSteer: value })}
                format={(value) => `${Math.round(value)}°`}
              />
              <Toggle
                label="Reverse tilt direction"
                description="Flip the steering axis if the car turns the wrong way when you roll the device."
                checked={settings.controls.tilt.reverse}
                onChange={(value) => updateTilt({ reverse: value })}
              />
              <Note>
                Motion access is requested only when you tap Test sensor or start a race — never on
                page load. On iPhone and iPad, choose Tilt, then allow Motion &amp; Orientation in
                the browser prompt. Rotate the device to landscape before calibrating; tap Centre
                during a race at any time. {needsPermission ? 'This browser requires an explicit permission prompt.' : ''} If the
                sensor is unavailable or denied, the race automatically falls back to touch buttons
                or keyboard.
              </Note>
            </TiltPanel>

            <Slider
              label="Steering sensitivity"
              value={settings.controls.sensitivity}
              min={0.4}
              max={2}
              step={0.05}
              onChange={(value) => updateSetting('controls', 'sensitivity', value)}
              format={(value) => `${value.toFixed(2)}×`}
            />
            <Toggle
              label="Invert camera orbit"
              description="Reverses horizontal drag direction in 3D garage and destination previews."
              checked={settings.controls.invertCamera}
              onChange={(value) => updateSetting('controls', 'invertCamera', value)}
            />
            <KeyGrid>
              {(Object.keys(keyLabels) as ControlAction[]).map((action) => (
                <KeyRow key={action}>
                  <span>{keyLabels[action]}</span>
                  <KeyButton
                    type="button"
                    $recording={recording === action}
                    onClick={() => setRecording(action)}
                  >
                    {recording === action ? 'Press key…' : displayKey(settings.controls.keybindings[action])}
                  </KeyButton>
                </KeyRow>
              ))}
            </KeyGrid>
            <Note>
              Gamepad: left stick / D-pad steer, RT or A accelerate, LT or B brake, RB / X / Y nitro,
              Start pauses. Press a key while recording to bind it; Escape cancels. Duplicate keys
              are swapped automatically.
            </Note>
          </Section>

          <Section id="gameplay">
            <SectionTop>
              <div>
                <h2>
                  <Gauge size={20} /> Gameplay
                </h2>
                <p>
                  Difficulty changes traffic density, closing speed and crash damage. Camera and
                  HUD options apply instantly when you return to the road.
                </p>
              </div>
              <Badge $tone={settings.gameplay.difficulty === 'insane' ? 'danger' : 'lime'}>
                {settings.gameplay.difficulty}
              </Badge>
            </SectionTop>
            <Segmented
              label="Difficulty"
              description="Relaxed reduces damage and traffic. Insane is unforgiving."
              value={settings.gameplay.difficulty}
              options={[
                { value: 'relaxed', label: 'Relaxed' },
                { value: 'standard', label: 'Standard' },
                { value: 'hard', label: 'Hard' },
                { value: 'insane', label: 'Insane' },
              ]}
              onChange={(value) => updateSetting('gameplay', 'difficulty', value as Difficulty)}
            />
            <Segmented
              label="Speed unit"
              description="Changes every speed readout across the game."
              value={settings.gameplay.speedUnit}
              options={[
                { value: 'kmh', label: 'km/h' },
                { value: 'mph', label: 'mph' },
              ]}
              onChange={(value) => updateSetting('gameplay', 'speedUnit', value as SpeedUnit)}
            />
            <Slider
              label="Camera distance"
              description="Pull the chase camera closer for intensity or back for a wider view."
              value={settings.gameplay.cameraDistance}
              min={0.6}
              max={1.6}
              step={0.05}
              onChange={(value) => updateSetting('gameplay', 'cameraDistance', value)}
              format={(value) => `${value.toFixed(2)}×`}
            />
            <Slider
              label="Field of view"
              description="Base camera field of view. The engine adds speed and nitro FOV dynamically."
              value={settings.gameplay.fov}
              min={55}
              max={85}
              step={1}
              onChange={(value) => updateSetting('gameplay', 'fov', value)}
              format={(value) => `${Math.round(value)}°`}
            />
            <Toggle
              label="Show minimap"
              description="Traffic radar in the racing HUD."
              checked={settings.gameplay.showMinimap}
              onChange={(value) => updateSetting('gameplay', 'showMinimap', value)}
            />
            <Toggle
              label="Show HUD"
              description="Hide the racing overlay for clean screenshots. Pause and results remain visible."
              checked={settings.gameplay.showHud}
              onChange={(value) => updateSetting('gameplay', 'showHud', value)}
            />
          </Section>

          <Section id="accessibility">
            <SectionTop>
              <div>
                <h2>
                  <Accessibility size={20} /> Accessibility
                </h2>
                <p>
                  Comfort options for motion, contrast and interface scale. Reduced motion also
                  softens camera FOV changes while driving.
                </p>
              </div>
              <Badge $tone={settings.accessibility.highContrast ? 'lime' : 'neutral'}>
                {settings.accessibility.highContrast ? 'High contrast' : 'Standard'}
              </Badge>
            </SectionTop>
            <Toggle
              label="Reduced motion"
              description="Minimises page animation, HUD transitions and dynamic camera movement."
              checked={settings.accessibility.reducedMotion}
              onChange={(value) => updateSetting('accessibility', 'reducedMotion', value)}
            />
            <Toggle
              label="High contrast"
              description="Stronger borders and brighter secondary text across the entire interface."
              checked={settings.accessibility.highContrast}
              onChange={(value) => updateSetting('accessibility', 'highContrast', value)}
            />
            <Slider
              label="Interface scale"
              description="Scales the whole interface. Useful on high-density displays and TVs."
              value={settings.accessibility.uiScale}
              min={0.85}
              max={1.2}
              step={0.05}
              onChange={(value) => updateSetting('accessibility', 'uiScale', value)}
              format={(value) => `${Math.round(value * 100)}%`}
            />
            <Note>
              The game respects your operating system&apos;s reduced-motion preference as a default and
              keeps touch targets at least 44px tall.
            </Note>
          </Section>

          <Section id="about">
            <SectionTop>
              <div>
                <h2>
                  <Palette size={20} /> About &amp; data
                </h2>
                <p>Version, authorship and local progress controls.</p>
              </div>
              <Badge $tone="lime">v2.0.0</Badge>
            </SectionTop>
            <About>
              <div>
                <PanelLabel>Highway Rush</PanelLabel>
                <p style={{ marginTop: 6 }}>
                  An endless 3D highway racer built with Next.js, React, TypeScript, Three.js,
                  styled-components and Zustand. All visuals, audio and content are generated in
                  code.
                </p>
              </div>
              <div>
                <PanelLabel>Created by</PanelLabel>
                <p style={{ marginTop: 6, color: 'var(--text)', fontWeight: 700, letterSpacing: '.04em' }}>
                  Built by Umar Nazir
                </p>
              </div>
              <div>
                <PanelLabel>Privacy</PanelLabel>
                <p style={{ marginTop: 6 }}>
                  No account, analytics or remote database. Progress, settings, scores and trophies
                  live in your browser&apos;s local storage under <code>highway-rush-save-v2</code>.
                </p>
              </div>
            </About>
            <Divider />
            <DangerRow>
              <div>
                <strong>Restore default settings</strong>
                <p>Resets graphics, audio, controls, gameplay and accessibility. Progress is kept.</p>
              </div>
              <Button variant="secondary" size="sm" icon={<RotateCcw size={12} />} onClick={() => setConfirmDefaults(true)}>
                Restore defaults
              </Button>
            </DangerRow>
            <DangerRow>
              <div>
                <strong>Reset all progress</strong>
                <p>
                  Erases coins, cars, destinations, missions, trophies, statistics and run history.
                  Settings are preserved. This cannot be undone.
                </p>
              </div>
              <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => setConfirmReset(true)}>
                Reset progress
              </Button>
            </DangerRow>
            <Note style={{ marginTop: 16 }}>
              <Gamepad2 size={12} style={{ verticalAlign: -2, marginRight: 5 }} />
              Built for keyboard, gamepad and touch. See <a href="/how-to-play" style={{ color: 'var(--lime)' }}>How to Play</a> for the full control sheet.
            </Note>
          </Section>
        </Sections>
      </Layout>

      <ConfirmDialog
        open={confirmDefaults}
        onClose={() => setConfirmDefaults(false)}
        title="Restore defaults?"
        message="All settings will return to their original values. Your coins, cars, routes, missions and trophies will not be affected."
        confirmLabel="Restore"
        onConfirm={() => {
          restoreDefaults();
          pushToast({ kind: 'success', title: 'Settings restored', message: 'Default configuration applied.' });
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all progress?"
        message="This permanently deletes your coins, owned cars, routes, trophies, missions, statistics and run history on this device. Settings stay intact. There is no undo."
        confirmLabel="Erase progress"
        destructive
        onConfirm={() => {
          resetProgress();
          pushToast({ kind: 'error', title: 'Progress reset', message: 'A fresh save has been created.' });
        }}
      />
    </PageShell>
  );
}

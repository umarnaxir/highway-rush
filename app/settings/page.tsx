'use client';

import { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import {
  ArrowLeft,
  AudioLines,
  Camera,
  Check,
  Gamepad2,
  Gauge,
  Monitor,
  RotateCcw,
  Sliders,
  Volume2,
  Zap,
} from 'lucide-react';
import { DEFAULT_SETTINGS, useGameStore } from '@/lib/store/useGameStore';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { useUiStore } from '@/lib/store/useUiStore';
import type { Difficulty, GraphicsPreset, SpeedUnit } from '@/lib/types';
import { media } from '@/lib/ui/theme';

type Tab = 'graphics' | 'audio' | 'gameplay' | 'controls';

const Stage = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: #030507;
  color: var(--text);
  padding: clamp(16px, 3vw, 32px);
  user-select: none;
`;

const ContentWrap = styled.div`
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TopNav = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const BackPill = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 4px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.82);
  backdrop-filter: blur(10px);
  color: var(--text);
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 13px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--lime);
    color: var(--lime);
    transform: translateX(-3px);
  }
`;

const HeaderTitle = styled.div`
  h1 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(28px, 4vw, 42px);
    font-style: italic;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.02em;
    text-transform: uppercase;

    em {
      color: var(--lime);
      font-style: inherit;
    }
  }

  span {
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
`;

const TabRow = styled.div`
  display: flex;
  gap: 6px;
  background: rgba(10, 14, 18, 0.6);
  padding: 4px;
  border-radius: 5px;
  border: 1px solid var(--line);
  width: fit-content;
  flex-wrap: wrap;
`;

const TabBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 4px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(215,255,63,.14)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 11px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
`;

const SettingsCard = styled.div`
  padding: 24px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(8, 12, 16, 0.88);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .label {
    strong {
      display: block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    span {
      display: block;
      margin-top: 3px;
      font-size: 9px;
      color: var(--text-muted);
    }
  }

  ${media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const PillBtn = styled.button<{ $active: boolean }>`
  padding: 7px 12px;
  border-radius: 3px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'var(--line)')};
  background: ${({ $active }) => ($active ? 'rgba(215,255,63,.14)' : 'rgba(255,255,255,.02)')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-muted)')};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
`;

const ToggleSwitch = styled.button<{ $on: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid ${({ $on }) => ($on ? 'var(--lime)' : 'var(--line)')};
  background: ${({ $on }) => ($on ? 'rgba(215,255,63,.2)' : 'rgba(255,255,255,.05)')};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? '22px' : '3px')};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ $on }) => ($on ? 'var(--lime)' : 'var(--text-dim)')};
    transition: all 0.2s ease;
  }
`;

const SliderWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(240px, 100%);

  input[type='range'] {
    flex: 1;
    accent-color: var(--lime);
  }

  b {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 10px;
    color: var(--lime);
    min-width: 32px;
    text-align: right;
  }
`;

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('graphics');

  const settings = useGameStore((state) => state.settings);
  const updateSetting = useGameStore((state) => state.updateSetting);
  const restoreDefaultSettings = useGameStore((state) => state.restoreDefaultSettings);
  const pushToast = useUiStore((state) => state.pushToast);

  const handlePreset = (preset: GraphicsPreset) => {
    updateSetting('graphics', 'preset', preset);
    if (preset === 'low') {
      updateSetting('graphics', 'shadows', false);
      updateSetting('graphics', 'performanceMode', true);
      updateSetting('graphics', 'effects', 'low');
    } else if (preset === 'medium') {
      updateSetting('graphics', 'shadows', true);
      updateSetting('graphics', 'performanceMode', false);
      updateSetting('graphics', 'effects', 'medium');
    } else {
      updateSetting('graphics', 'shadows', true);
      updateSetting('graphics', 'performanceMode', false);
      updateSetting('graphics', 'effects', 'high');
    }
    getAudioManager().playCue('ui');
  };

  const handleReset = () => {
    restoreDefaultSettings();
    getAudioManager().playCue('confirm');
    pushToast({ kind: 'info', title: 'Settings Reset', message: 'Restored factory defaults.' });
  };

  return (
    <Stage>
      <ContentWrap>
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <HeaderTitle>
            <span>SYSTEM CONFIGURATION</span>
            <h1>
              Game <em>Settings</em>
            </h1>
          </HeaderTitle>

          <PillBtn type="button" $active={false} onClick={handleReset}>
            <RotateCcw size={12} style={{ verticalAlign: -1, marginRight: 4 }} /> Factory Reset
          </PillBtn>
        </TopNav>

        <TabRow>
          <TabBtn type="button" $active={tab === 'graphics'} onClick={() => setTab('graphics')}>
            <Monitor size={12} /> Graphics
          </TabBtn>
          <TabBtn type="button" $active={tab === 'audio'} onClick={() => setTab('audio')}>
            <Volume2 size={12} /> Audio
          </TabBtn>
          <TabBtn type="button" $active={tab === 'gameplay'} onClick={() => setTab('gameplay')}>
            <Gauge size={12} /> Gameplay & Camera
          </TabBtn>
          <TabBtn type="button" $active={tab === 'controls'} onClick={() => setTab('controls')}>
            <Gamepad2 size={12} /> Controls
          </TabBtn>
        </TabRow>

        <SettingsCard>
          {tab === 'graphics' && (
            <>
              <OptionRow>
                <div className="label">
                  <strong>Graphics Fidelity Preset</strong>
                  <span>Auto-balances shaders, shadow maps, and particle limits.</span>
                </div>
                <ButtonGroup>
                  {(['low', 'medium', 'high', 'ultra'] as GraphicsPreset[]).map((p) => (
                    <PillBtn
                      key={p}
                      type="button"
                      $active={settings.graphics.preset === p}
                      onClick={() => handlePreset(p)}
                    >
                      {p}
                    </PillBtn>
                  ))}
                </ButtonGroup>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Ultra Performance Mode</strong>
                  <span>Maximizes FPS on integrated GPUs and mobile chips.</span>
                </div>
                <ToggleSwitch
                  type="button"
                  $on={settings.graphics.performanceMode}
                  onClick={() =>
                    updateSetting('graphics', 'performanceMode', !settings.graphics.performanceMode)
                  }
                />
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Dynamic Shadows</strong>
                  <span>Real-time PCF vehicle and guard rail road projection.</span>
                </div>
                <ToggleSwitch
                  type="button"
                  $on={settings.graphics.shadows}
                  onClick={() => updateSetting('graphics', 'shadows', !settings.graphics.shadows)}
                />
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Show FPS Counter</strong>
                  <span>Live frame-rate and render telemetry in HUD.</span>
                </div>
                <ToggleSwitch
                  type="button"
                  $on={settings.graphics.showFps}
                  onClick={() => updateSetting('graphics', 'showFps', !settings.graphics.showFps)}
                />
              </OptionRow>
            </>
          )}

          {tab === 'audio' && (
            <>
              <OptionRow>
                <div className="label">
                  <strong>Master Audio Volume</strong>
                  <span>Main sound output level.</span>
                </div>
                <SliderWrap>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.audio.master}
                    onChange={(e) => updateSetting('audio', 'master', parseFloat(e.target.value))}
                  />
                  <b>{Math.round(settings.audio.master * 100)}%</b>
                </SliderWrap>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Engine Synthesizer Volume</strong>
                  <span>Exhaust rumble, RPM harmonics, and turbo whistle.</span>
                </div>
                <SliderWrap>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.audio.engine}
                    onChange={(e) => updateSetting('audio', 'engine', parseFloat(e.target.value))}
                  />
                  <b>{Math.round(settings.audio.engine * 100)}%</b>
                </SliderWrap>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>SFX & Nitro Blast</strong>
                  <span>Tire friction, near-miss whoosh, collision impacts.</span>
                </div>
                <SliderWrap>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.audio.sfx}
                    onChange={(e) => updateSetting('audio', 'sfx', parseFloat(e.target.value))}
                  />
                  <b>{Math.round(settings.audio.sfx * 100)}%</b>
                </SliderWrap>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Music Soundtrack</strong>
                  <span>Procedural synthwave and adrenaline racing rhythms.</span>
                </div>
                <SliderWrap>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.audio.music}
                    onChange={(e) => updateSetting('audio', 'music', parseFloat(e.target.value))}
                  />
                  <b>{Math.round(settings.audio.music * 100)}%</b>
                </SliderWrap>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Mute All Audio</strong>
                  <span>Instantly silence master bus.</span>
                </div>
                <ToggleSwitch
                  type="button"
                  $on={settings.audio.muted}
                  onClick={() => updateSetting('audio', 'muted', !settings.audio.muted)}
                />
              </OptionRow>
            </>
          )}

          {tab === 'gameplay' && (
            <>
              <OptionRow>
                <div className="label">
                  <strong>Speed Display Unit</strong>
                  <span>Metric (KM/H) or Imperial (MPH).</span>
                </div>
                <ButtonGroup>
                  <PillBtn
                    type="button"
                    $active={settings.gameplay.speedUnit === 'kmh'}
                    onClick={() => updateSetting('gameplay', 'speedUnit', 'kmh')}
                  >
                    KM/H
                  </PillBtn>
                  <PillBtn
                    type="button"
                    $active={settings.gameplay.speedUnit === 'mph'}
                    onClick={() => updateSetting('gameplay', 'speedUnit', 'mph')}
                  >
                    MPH
                  </PillBtn>
                </ButtonGroup>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Field of View (FOV)</strong>
                  <span>Camera lens angle. Higher values emphasize speed.</span>
                </div>
                <SliderWrap>
                  <input
                    type="range"
                    min={52}
                    max={78}
                    step={1}
                    value={settings.gameplay.fov}
                    onChange={(e) => updateSetting('gameplay', 'fov', parseInt(e.target.value, 10))}
                  />
                  <b>{settings.gameplay.fov}°</b>
                </SliderWrap>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Camera Distance</strong>
                  <span>Cockpit chasing distance behind vehicle.</span>
                </div>
                <SliderWrap>
                  <input
                    type="range"
                    min={0.8}
                    max={1.3}
                    step={0.05}
                    value={settings.gameplay.cameraDistance}
                    onChange={(e) =>
                      updateSetting('gameplay', 'cameraDistance', parseFloat(e.target.value))
                    }
                  />
                  <b>{Math.round(settings.gameplay.cameraDistance * 100)}%</b>
                </SliderWrap>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>HUD Minimap Radar</strong>
                  <span>Display real-time traffic radar cluster.</span>
                </div>
                <ToggleSwitch
                  type="button"
                  $on={settings.gameplay.showMinimap}
                  onClick={() =>
                    updateSetting('gameplay', 'showMinimap', !settings.gameplay.showMinimap)
                  }
                />
              </OptionRow>
            </>
          )}

          {tab === 'controls' && (
            <>
              <OptionRow>
                <div className="label">
                  <strong>Control Scheme</strong>
                  <span>Select preferred steering input method.</span>
                </div>
                <ButtonGroup>
                  {(['auto', 'buttons', 'tilt', 'drag'] as const).map((m) => (
                    <PillBtn
                      key={m}
                      type="button"
                      $active={settings.controls.method === m}
                      onClick={() => updateSetting('controls', 'method', m)}
                    >
                      {m}
                    </PillBtn>
                  ))}
                </ButtonGroup>
              </OptionRow>

              <OptionRow>
                <div className="label">
                  <strong>Steering Sensitivity</strong>
                  <span>Response curve for lane weaving and rapid evasions.</span>
                </div>
                <SliderWrap>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={settings.controls.sensitivity}
                    onChange={(e) =>
                      updateSetting('controls', 'sensitivity', parseFloat(e.target.value))
                    }
                  />
                  <b>{settings.controls.sensitivity.toFixed(1)}x</b>
                </SliderWrap>
              </OptionRow>
            </>
          )}
        </SettingsCard>
      </ContentWrap>
    </Stage>
  );
}

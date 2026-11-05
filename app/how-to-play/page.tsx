'use client';

import { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import {
  ArrowLeft,
  ChevronRight,
  Flag,
  Fuel,
  Gauge,
  Gamepad2,
  Heart,
  Keyboard,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useGameStore } from '@/lib/store/useGameStore';
import { formatKeyCode } from '@/lib/ui/format';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { media } from '@/lib/ui/theme';

const Stage = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: #030507;
  color: var(--text);
  padding: clamp(16px, 3vw, 32px);
  user-select: none;
`;

const ContentWrap = styled.div`
  max-width: 1080px;
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

const RaceLinkBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 4px;
  border: 1px solid var(--lime);
  background: var(--lime);
  color: #07090b;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 13px;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: #e6ff66;
    transform: scale(1.02);
  }
`;

const TerminalPanel = styled.div`
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.88);
  backdrop-filter: blur(12px);
  overflow: hidden;
`;

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.2);

  .title-group {
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      color: var(--lime);
    }

    h2 {
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 16px;
      font-style: italic;
      font-weight: 900;
      text-transform: uppercase;
    }
  }
`;

const ControlTabs = styled.div`
  display: flex;
  gap: 4px;
`;

const ControlTabBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 3px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(215, 255, 63, 0.15)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-dim)')};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text);
  }
`;

const ControlBody = styled.div`
  padding: 16px 20px;
`;

const KeyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const KeyItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.25);

  .label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .badges {
    display: flex;
    gap: 4px;

    kbd {
      min-width: 30px;
      min-height: 26px;
      display: inline-grid;
      place-items: center;
      padding: 0 8px;
      border: 1px solid var(--line-strong);
      border-bottom-color: rgba(215, 255, 63, 0.4);
      border-radius: 3px;
      background: rgba(215, 255, 63, 0.08);
      color: var(--lime);
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 10px;
      font-weight: 800;
    }
  }
`;

const SystemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const SystemCard = styled.div`
  padding: 18px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 14, 18, 0.88);
  display: flex;
  flex-direction: column;
  gap: 10px;

  .head {
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      color: var(--lime);
    }

    h3 {
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 15px;
      font-style: italic;
      font-weight: 900;
      text-transform: uppercase;
    }
  }

  p {
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.6;
  }

  .metric-tag {
    align-self: flex-start;
    padding: 3px 8px;
    border-radius: 3px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.04);
    color: var(--lime);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;

const TipsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const TipCard = styled.div`
  padding: 18px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: rgba(10, 14, 18, 0.6);
  display: flex;
  flex-direction: column;
  gap: 8px;

  .idx {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 24px;
    font-style: italic;
    font-weight: 900;
    color: var(--lime);
    line-height: 1;
  }

  strong {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  p {
    color: var(--text-dim);
    font-size: 11px;
    line-height: 1.6;
  }
`;

export default function HowToPlayPage() {
  const [controlTab, setControlTab] = useState<'keyboard' | 'gamepad' | 'touch'>('keyboard');
  const bindings = useGameStore((state) => state.settings.controls.keybindings);

  const switchTab = (tab: 'keyboard' | 'gamepad' | 'touch') => {
    setControlTab(tab);
    getAudioManager().playCue('ui');
  };

  return (
    <Stage>
      <ContentWrap>
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <HeaderTitle>
            <span>Operations Field Manual</span>
            <h1>
              Flight Deck <em>Controls</em>
            </h1>
          </HeaderTitle>

          <RaceLinkBtn href="/play">
            <Flag size={14} /> Start Driving
          </RaceLinkBtn>
        </TopNav>

        {/* CONTROLS TERMINAL */}
        <TerminalPanel>
          <PanelHead>
            <div className="title-group">
              <Keyboard size={16} />
              <h2>Control Bindings</h2>
            </div>

            <ControlTabs>
              <ControlTabBtn
                $active={controlTab === 'keyboard'}
                onClick={() => switchTab('keyboard')}
              >
                <Keyboard size={12} /> Keyboard
              </ControlTabBtn>
              <ControlTabBtn
                $active={controlTab === 'gamepad'}
                onClick={() => switchTab('gamepad')}
              >
                <Gamepad2 size={12} /> Gamepad
              </ControlTabBtn>
              <ControlTabBtn
                $active={controlTab === 'touch'}
                onClick={() => switchTab('touch')}
              >
                <Smartphone size={12} /> Mobile / Tilt
              </ControlTabBtn>
            </ControlTabs>
          </PanelHead>

          <ControlBody>
            {controlTab === 'keyboard' && (
              <KeyGrid>
                <KeyItem>
                  <span className="label">Steer Left / Right</span>
                  <div className="badges">
                    <kbd>{formatKeyCode(bindings.steerLeft)}</kbd>
                    <kbd>{formatKeyCode(bindings.steerRight)}</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Throttle / Brake</span>
                  <div className="badges">
                    <kbd>{formatKeyCode(bindings.accelerate)}</kbd>
                    <kbd>{formatKeyCode(bindings.brake)}</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Nitro Afterburner</span>
                  <div className="badges">
                    <kbd>{formatKeyCode(bindings.nitro)}</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Pause Simulation</span>
                  <div className="badges">
                    <kbd>{formatKeyCode(bindings.pause)}</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Secondary Steer</span>
                  <div className="badges">
                    <kbd>LEFT</kbd>
                    <kbd>RIGHT</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Secondary Throttle</span>
                  <div className="badges">
                    <kbd>UP</kbd>
                    <kbd>DOWN</kbd>
                  </div>
                </KeyItem>
              </KeyGrid>
            )}

            {controlTab === 'gamepad' && (
              <KeyGrid>
                <KeyItem>
                  <span className="label">Steering Axis</span>
                  <div className="badges">
                    <kbd>LEFT STICK / D-PAD</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Progressive Throttle</span>
                  <div className="badges">
                    <kbd>RIGHT TRIGGER (RT) / A</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Hydraulic Brakes</span>
                  <div className="badges">
                    <kbd>LEFT TRIGGER (LT) / B</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Nitro Injector</span>
                  <div className="badges">
                    <kbd>RIGHT BUMPER (RB) / X</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Pause / Menu</span>
                  <div className="badges">
                    <kbd>START / MENU</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Camera View Orbit</span>
                  <div className="badges">
                    <kbd>RIGHT STICK</kbd>
                  </div>
                </KeyItem>
              </KeyGrid>
            )}

            {controlTab === 'touch' && (
              <KeyGrid>
                <KeyItem>
                  <span className="label">Gyroscope Tilt Steering</span>
                  <div className="badges">
                    <kbd>PHYSICAL DEVICE TILT</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Touch Screen Steering Pad</span>
                  <div className="badges">
                    <kbd>ON-SCREEN ARROWS</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Touch Drag Surface</span>
                  <div className="badges">
                    <kbd>DRAG HORIZONTALLY</kbd>
                  </div>
                </KeyItem>

                <KeyItem>
                  <span className="label">Nitro Quick Tap</span>
                  <div className="badges">
                    <kbd>NITRO BUTTON (RIGHT)</kbd>
                  </div>
                </KeyItem>
              </KeyGrid>
            )}
          </ControlBody>
        </TerminalPanel>

        {/* TACTICAL SYSTEMS */}
        <SystemsGrid>
          <SystemCard>
            <div className="head">
              <Heart size={16} />
              <h3>Structural Hull &amp; Health</h3>
            </div>
            <p>
              Direct collisions with traffic or roadside barriers reduce vehicle integrity. Maintain separation to avoid catastrophic vehicle failure.
            </p>
            <div className="metric-tag">Damage Recovery: Nil</div>
          </SystemCard>

          <SystemCard>
            <div className="head">
              <Zap size={16} />
              <h3>Dual Nitro Afterburner</h3>
            </div>
            <p>
              Ignites high-octane nitrous through dual exhaust pipes, kicking the camera FOV back and accelerating past traffic at peak velocity.
            </p>
            <div className="metric-tag">Recharges Automatically</div>
          </SystemCard>

          <SystemCard>
            <div className="head">
              <Target size={16} />
              <h3>Near-Miss Multiplier</h3>
            </div>
            <p>
              Threading closely between civilian vehicles without contact triggers near-miss bonuses and scales the score multiplier rapidly.
            </p>
            <div className="metric-tag">+150 PTS × MULTIPLIER</div>
          </SystemCard>

          <SystemCard>
            <div className="head">
              <Fuel size={16} />
              <h3>Fuel &amp; Checkpoints</h3>
            </div>
            <p>
              High-speed driving steadily consumes fuel. Cross marked highway checkpoints before the tank empties to restore fuel and earn bonus points.
            </p>
            <div className="metric-tag">+15-25% TANK PER GATE</div>
          </SystemCard>

          <SystemCard>
            <div className="head">
              <Gauge size={16} />
              <h3>Adaptive Traffic Radar</h3>
            </div>
            <p>
              The cockpit radar maps civil traffic up to 100 metres ahead. Scan ahead for slow-moving trucks and clear lanes before firing nitro.
            </p>
            <div className="metric-tag">Real-Time Canvas Radar</div>
          </SystemCard>

          <SystemCard>
            <div className="head">
              <Sparkles size={16} />
              <h3>Coin Pickups &amp; Unlocks</h3>
            </div>
            <p>
              Collected coins are deposited permanently to your driver balance for garage tuning, visual customizations, and unlocking new destination tracks.
            </p>
            <div className="metric-tag">Permanent Bank</div>
          </SystemCard>
        </SystemsGrid>

        {/* RACING TACTICS */}
        <TerminalPanel>
          <PanelHead>
            <div className="title-group">
              <Shield size={16} />
              <h2>Tactical Racing Directives</h2>
            </div>
          </PanelHead>

          <ControlBody>
            <TipsGrid>
              <TipCard>
                <div className="idx">01</div>
                <strong>Preserve Apex Velocity</strong>
                <p>
                  Avoid sharp erratic steering inputs. Smooth steering lines minimise lateral tire scrub and maintain maximum top-end acceleration.
                </p>
              </TipCard>

              <TipCard>
                <div className="idx">02</div>
                <strong>Deploy Nitro in High-Speed Gaps</strong>
                <p>
                  Do not trigger nitro in blind clusters. Consult the HUD radar and fire the afterburner when straightaways present an open trajectory.
                </p>
              </TipCard>

              <TipCard>
                <div className="idx">03</div>
                <strong>Protect the Chain</strong>
                <p>
                  Every near-miss and collected checkpoint compounds your score. A single scrape wipes out the combo multiplier.
                </p>
              </TipCard>
            </TipsGrid>
          </ControlBody>
        </TerminalPanel>
      </ContentWrap>
    </Stage>
  );
}

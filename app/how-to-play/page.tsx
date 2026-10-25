'use client';

import styled from 'styled-components';
import {
  ArrowRight,
  Car,
  Flag,
  Fuel,
  Gauge,
  Gamepad2,
  Heart,
  Keyboard,
  ListChecks,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, Panel, PanelLabel, SectionKicker, StatRow } from '@/components/ui/Panel';
import { DAILY_MISSION_COUNT, LONG_TERM_MISSIONS } from '@/lib/data/missions';
import { TROPHIES } from '@/lib/data/trophies';
import { useGameStore } from '@/lib/store/useGameStore';
import { formatKeyCode } from '@/lib/ui/format';
import { media } from '@/lib/ui/theme';

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 14px;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(Panel)`
  padding: clamp(20px, 3vw, 30px);
`;

const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;

  svg {
    color: ${({ theme }) => theme.colors.lime};
    flex: 0 0 auto;
    margin-top: 2px;
  }

  h3 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 22px;
    text-transform: uppercase;
    font-style: italic;
    line-height: 1;
  }
  p {
    margin-top: 6px;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.6;
  }
`;

const Text = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  line-height: 1.8;
`;

const ControlTable = styled.div`
  display: flex;
  flex-direction: column;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  font-size: 11px;

  &:last-child {
    border-bottom: 0;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Keys = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;

  kbd {
    min-width: 28px;
    min-height: 25px;
    display: inline-grid;
    place-items: center;
    padding: 0 7px;
    border: 1px solid var(--line-strong);
    border-bottom-color: rgba(255, 255, 255, 0.32);
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.035);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
  }
`;

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const Step = styled.div`
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }
  b {
    width: 26px;
    height: 26px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid rgba(215, 255, 63, 0.35);
    background: rgba(215, 255, 63, 0.08);
    color: var(--lime);
    font-family: var(--font-mono);
    font-size: 10px;
  }
  strong {
    display: block;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  span {
    display: block;
    margin-top: 5px;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.6;
  }
`;

const ToneRow = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};

  &:last-child {
    border-bottom: 0;
  }

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 11px;
  }
  b {
    color: ${({ $color }) => $color};
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;

const TipGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 14px;

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

const Tip = styled.div`
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.018);
  svg {
    color: var(--lime);
    margin-bottom: 10px;
  }
  strong {
    display: block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  p {
    margin-top: 6px;
    color: var(--text-muted);
    font-size: 10px;
    line-height: 1.65;
  }
`;

const CTA = styled(Panel)`
  margin-top: 14px;
  padding: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  background:
    radial-gradient(ellipse at 0% 50%, rgba(215, 255, 63, 0.08), transparent 60%),
    var(--panel);
  h3 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(24px, 3vw, 36px);
    text-transform: uppercase;
    font-style: italic;
    line-height: 1;
  }
  p {
    margin-top: 8px;
    color: var(--text-muted);
    font-size: 11px;
  }
`;

export default function HowToPlayPage() {
  const bindings = useGameStore((state) => state.settings.controls.keybindings);
  const difficulty = useGameStore((state) => state.settings.gameplay.difficulty);

  return (
    <PageShell
      kicker="Driver briefing"
      title={
        <>
          Learn the <em>rush.</em>
        </>
      }
      intro="Highway Rush is a free-steering endless racer. Keep the car alive, keep the combo alive, and reach the finish gate before the fuel runs dry."
      actions={
        <ButtonLink href="/play" size="sm" icon={<Flag size={13} />}>
          Start driving
        </ButtonLink>
      }
      wide
    >
      <Grid>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <CardHead>
              <Target size={20} />
              <div>
                <h3>The objective</h3>
                <p>Survive the highway and cross the finish gate.</p>
              </div>
            </CardHead>
            <Text>
              Race mode sets a distance target for the route you choose. Reach it to bank a finish
              bonus. Endless mode removes the finish line and keeps scaling traffic until you crash,
              run dry or quit. Either way, your score, distance and coins are saved at the end of the
              run.
            </Text>
            <Steps style={{ marginTop: 16 }}>
              <Step>
                <b>1</b>
                <div>
                  <strong>Pick a car and route</strong>
                  <span>Garage builds and destination unlocks are permanent on this device.</span>
                </div>
              </Step>
              <Step>
                <b>2</b>
                <div>
                  <strong>Thread traffic, collect coins</strong>
                  <span>Near misses build a combo multiplier. Coins spawn in clusters across lanes.</span>
                </div>
              </Step>
              <Step>
                <b>3</b>
                <div>
                  <strong>Manage fuel, health and nitro</strong>
                  <span>Checkpoints restore fuel. Impacts drain health. Nitro burns a rechargeable tank.</span>
                </div>
              </Step>
              <Step>
                <b>4</b>
                <div>
                  <strong>Cross the line, bank the record</strong>
                  <span>Results feed statistics, daily missions and the trophy room automatically.</span>
                </div>
              </Step>
            </Steps>
          </Card>

          <Card>
            <CardHead>
              <Keyboard size={20} />
              <div>
                <h3>Keyboard controls</h3>
                <p>Default bindings. Every key can be changed in Settings.</p>
              </div>
            </CardHead>
            <ControlTable>
              <ControlRow>
                <span>Steer left / right</span>
                <Keys>
                  <kbd>{formatKeyCode(bindings.steerLeft)}</kbd>
                  <kbd>{formatKeyCode(bindings.steerRight)}</kbd>
                </Keys>
              </ControlRow>
              <ControlRow>
                <span>Accelerate / brake</span>
                <Keys>
                  <kbd>{formatKeyCode(bindings.accelerate)}</kbd>
                  <kbd>{formatKeyCode(bindings.brake)}</kbd>
                </Keys>
              </ControlRow>
              <ControlRow>
                <span>Nitro</span>
                <Keys>
                  <kbd>{formatKeyCode(bindings.nitro)}</kbd>
                </Keys>
              </ControlRow>
              <ControlRow>
                <span>Pause</span>
                <Keys>
                  <kbd>{formatKeyCode(bindings.pause)}</kbd>
                </Keys>
              </ControlRow>
              <ControlRow>
                <span>Camera orbit (garage / map)</span>
                <Keys>
                  <kbd>Drag</kbd>
                </Keys>
              </ControlRow>
            </ControlTable>
          </Card>

          <Card>
            <CardHead>
              <Smartphone size={20} />
              <div>
                <h3>Touch &amp; gamepad</h3>
                <p>Playable on phones, tablets and controllers.</p>
              </div>
            </CardHead>
            <Text>
              On touch devices a left/right steering pad, brake paddle and nitro button appear over
              the road. Tap-and-hold to steer, release to centre. Gamepads are detected
              automatically.
            </Text>
            <div style={{ marginTop: 14 }}>
              <ToneRow $color="var(--lime)">
                <span>
                  <Gamepad2 size={12} /> Left stick / D-pad
                </span>
                <b>Steer</b>
              </ToneRow>
              <ToneRow $color="var(--lime)">
                <span>
                  <Gamepad2 size={12} /> RT / A
                </span>
                <b>Accelerate</b>
              </ToneRow>
              <ToneRow $color="var(--lime)">
                <span>
                  <Gamepad2 size={12} /> LT / B
                </span>
                <b>Brake</b>
              </ToneRow>
              <ToneRow $color="var(--lime)">
                <span>
                  <Gamepad2 size={12} /> RB / X / Y
                </span>
                <b>Nitro</b>
              </ToneRow>
              <ToneRow $color="var(--lime)">
                <span>
                  <Gamepad2 size={12} /> Start
                </span>
                <b>Pause</b>
              </ToneRow>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <CardHead>
              <Sparkles size={20} />
              <div>
                <h3>Systems</h3>
                <p>What the HUD is telling you.</p>
              </div>
            </CardHead>
            <ToneRow $color="var(--lime)">
              <span>
                <Heart size={12} /> Health
              </span>
              <b>Crash damage</b>
            </ToneRow>
            <ToneRow $color="var(--warning)">
              <span>
                <Fuel size={12} /> Fuel
              </span>
              <b>Drains constantly</b>
            </ToneRow>
            <ToneRow $color="var(--info)">
              <span>
                <Zap size={12} /> Nitro
              </span>
              <b>Recharges over time</b>
            </ToneRow>
            <ToneRow $color="var(--purple)">
              <span>
                <Gauge size={12} /> Combo
              </span>
              <b>Near-miss multiplier</b>
            </ToneRow>
            <ToneRow $color="var(--lime)">
              <span>
                <Flag size={12} /> Checkpoints
              </span>
              <b>Fuel + score bonus</b>
            </ToneRow>
            <ToneRow $color="var(--text)">
              <span>
                <Car size={12} /> Gear &amp; RPM
              </span>
              <b>Manual-style auto box</b>
            </ToneRow>
          </Card>

          <Card>
            <CardHead>
              <ListChecks size={20} />
              <div>
                <h3>Scoring</h3>
                <p>Everything stacks into your final score.</p>
              </div>
            </CardHead>
            <StatRow>
              <span>Distance</span>
              <strong style={{ fontSize: 16 }}>2 pts / m + speed</strong>
            </StatRow>
            <StatRow>
              <span>Near miss</span>
              <strong style={{ fontSize: 16 }}>150 × multiplier</strong>
            </StatRow>
            <StatRow>
              <span>Coin</span>
              <strong style={{ fontSize: 16 }}>35 × multiplier + 1 coin</strong>
            </StatRow>
            <StatRow>
              <span>Checkpoint</span>
              <strong style={{ fontSize: 16 }}>600 + 150 × index</strong>
            </StatRow>
            <StatRow>
              <span>Finish bonus</span>
              <strong style={{ fontSize: 16 }}>5,000 pts</strong>
            </StatRow>
            <StatRow>
              <span>Drift</span>
              <strong style={{ fontSize: 16 }}>4 pts / m</strong>
            </StatRow>
            <div style={{ marginTop: 14 }}>
              <Badge $tone="info">Current difficulty · {difficulty}</Badge>
            </div>
          </Card>

          <Card>
            <CardHead>
              <Trophy size={20} />
              <div>
                <h3>Progression</h3>
                <p>Nothing is paywalled behind a timer.</p>
              </div>
            </CardHead>
            <Text>
              Coins come from runs, near misses, daily missions and trophies. Cars and destinations
              also check performance requirements such as races completed, near misses and trophy
              count. Daily objectives are generated from the date and reset at local midnight.
            </Text>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge $tone="lime">{TROPHIES.length} trophies</Badge>
              <Badge $tone="purple">{LONG_TERM_MISSIONS.length} career objectives</Badge>
              <Badge $tone="warning">{DAILY_MISSION_COUNT} daily missions</Badge>
            </div>
          </Card>

          <CTA>
            <div>
              <SectionKicker>Ready</SectionKicker>
              <h3>Seat time is the only teacher.</h3>
              <p>Your current car and route are already set.</p>
            </div>
            <ButtonLink href="/play" size="lg" icon={<ArrowRight size={15} />}>
              Hit the highway
            </ButtonLink>
          </CTA>
        </div>
      </Grid>

      <div style={{ marginTop: 14 }}>
        <PanelLabel>Driver tips</PanelLabel>
        <TipGrid>
          <Tip>
            <Target size={17} />
            <strong>Steer, don't snap</strong>
            <p>Hold a line instead of tapping. Smooth inputs preserve speed and let the drift model work.</p>
          </Tip>
          <Tip>
            <Zap size={17} />
            <strong>Save nitro for gaps</strong>
            <p>A full tank is worth more on a clear straight than in dense traffic. Check the radar first.</p>
          </Tip>
          <Tip>
            <Heart size={17} />
            <strong>Protect the streak</strong>
            <p>Crash-free distance is a trophy metric. One wall tap costs more than a missed coin.</p>
          </Tip>
        </TipGrid>
      </div>
    </PageShell>
  );
}

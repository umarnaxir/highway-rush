'use client';

import styled from 'styled-components';
import {
  ArrowRight,
  Car,
  Code2,
  Cpu,
  Flag,
  Gauge,
  Heart,
  Music2,
  Route,
  Sparkles,
  Trophy,
  Users,
  Volume2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, Panel, PanelLabel, SectionKicker } from '@/components/ui/Panel';
import { TROPHIES } from '@/lib/data/trophies';
import { CARS } from '@/lib/data/cars';
import { DESTINATIONS } from '@/lib/data/destinations';
import { media } from '@/lib/ui/theme';

const Hero = styled(Panel)`
  position: relative;
  padding: clamp(28px, 5vw, 56px);
  overflow: hidden;
  background:
    radial-gradient(ellipse at 8% 0%, rgba(215, 255, 63, 0.13), transparent 56%),
    radial-gradient(ellipse at 92% 100%, rgba(56, 189, 248, 0.08), transparent 52%),
    linear-gradient(150deg, rgba(255, 255, 255, 0.045), transparent 48%),
    var(--panel);

  &::after {
    content: '';
    position: absolute;
    top: -40%;
    right: -8%;
    width: 380px;
    height: 380px;
    border: 1px solid rgba(215, 255, 63, 0.09);
    border-radius: 50%;
    box-shadow:
      0 0 0 44px rgba(215, 255, 63, 0.025),
      0 0 0 88px rgba(215, 255, 63, 0.015);
    pointer-events: none;
  }

  ${media.mobile} {
    padding: 26px 20px;
  }
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--lime);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
`;

const Name = styled.h1`
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin-top: 14px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(44px, 8vw, 104px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: -0.045em;
  text-transform: uppercase;

  em {
    display: block;
    color: var(--lime);
    font-style: inherit;
  }
`;

const CreditLine = styled.p`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding: 10px 14px;
  border: 1px solid rgba(215, 255, 63, 0.34);
  border-radius: 3px;
  background: rgba(215, 255, 63, 0.07);
  color: var(--text);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;

  svg {
    color: var(--lime);
  }
`;

const Lede = styled.p`
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin-top: 22px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.8;
`;

const StatStrip = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: 30px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--line);
  overflow: hidden;

  ${media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Stat = styled.div`
  padding: 15px 17px;
  background: rgba(3, 6, 8, 0.55);

  span {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-dim);
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  svg {
    color: var(--lime);
  }

  strong {
    display: block;
    margin-top: 6px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(22px, 2.6vw, 30px);
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 14px;
  margin-top: 14px;
  align-items: start;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

const Card = styled(Panel)`
  padding: clamp(20px, 3vw, 30px);
`;

const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;

  > svg {
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--lime);
  }

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 23px;
    font-style: italic;
    line-height: 1;
    letter-spacing: -0.01em;
    text-transform: uppercase;
  }

  p {
    margin-top: 6px;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.6;
  }
`;

const Role = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 13px 0;
  border-bottom: 1px solid var(--line);

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  span {
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1.6;
    text-transform: uppercase;
  }

  strong {
    flex: 0 0 auto;
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 10px;
    font-weight: 700;
    text-align: right;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Note = styled.p`
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.8;
`;

const Signature = styled(Panel)`
  margin-top: 14px;
  padding: clamp(24px, 4vw, 42px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 26px;
  flex-wrap: wrap;
  background:
    radial-gradient(ellipse at 100% 50%, rgba(215, 255, 63, 0.1), transparent 58%),
    var(--panel);

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(28px, 4vw, 46px);
    font-style: italic;
    line-height: 0.92;
    letter-spacing: -0.02em;
    text-transform: uppercase;

    em {
      color: var(--lime);
      font-style: inherit;
    }
  }

  p {
    max-width: 560px;
    margin-top: 12px;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.7;
  }
`;

const Legal = styled.p`
  margin: 18px 0 0;
  color: var(--text-dim);
  font-size: 9px;
  line-height: 1.8;
  letter-spacing: 0.02em;

  code {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 9px;
  }
`;

export default function CreditsPage() {
  return (
    <PageShell
      kicker="Credits"
      title={
        <>
          The people behind the <em>rush.</em>
        </>
      }
      intro="Highway Rush is an independent, local-first browser racing game. Every route, machine, sound and interface was designed and built for this project."
      actions={
        <ButtonLink href="/play" size="sm" icon={<Flag size={13} />}>
          Back to the highway
        </ButtonLink>
      }
      wide
    >
      <Hero>
        <Eyebrow>
          <Sparkles size={11} /> Original production · Version 2.0.0
        </Eyebrow>
        <Name>
          Highway
          <em>Rush.</em>
        </Name>
        <CreditLine>
          <Heart size={12} fill="currentColor" /> Built by Umar Nazir
        </CreditLine>
        <Lede>
          A complete 3D arcade racer that runs entirely in the browser: no installer, no account and
          no remote game server. Progress and records stay on your device, and the soundtrack is
          synthesised in real time.
        </Lede>
        <StatStrip>
          <Stat>
            <span>
              <Route size={10} /> Routes
            </span>
            <strong>{DESTINATIONS.length}</strong>
          </Stat>
          <Stat>
            <span>
              <Car size={10} /> Machines
            </span>
            <strong>{CARS.length}</strong>
          </Stat>
          <Stat>
            <span>
              <Trophy size={10} /> Trophies
            </span>
            <strong>{TROPHIES.length}</strong>
          </Stat>
          <Stat>
            <span>
              <Gauge size={10} /> Engine
            </span>
            <strong>Three.js</strong>
          </Stat>
        </StatStrip>
      </Hero>

      <Grid>
        <Column>
          <Card>
            <CardHead>
              <Users size={20} />
              <div>
                <h2>Production</h2>
                <p>Design, code, content and direction.</p>
              </div>
            </CardHead>
            <Role>
              <span>Creator &amp; lead developer</span>
              <strong>Umar Nazir</strong>
            </Role>
            <Role>
              <span>Game design &amp; balance</span>
              <strong>Umar Nazir</strong>
            </Role>
            <Role>
              <span>UI / UX &amp; interface system</span>
              <strong>Umar Nazir</strong>
            </Role>
            <Role>
              <span>3D environments &amp; vehicle art direction</span>
              <strong>Umar Nazir</strong>
            </Role>
            <Role>
              <span>Procedural audio design</span>
              <strong>Umar Nazir</strong>
            </Role>
          </Card>

          <Card>
            <CardHead>
              <Code2 size={20} />
              <div>
                <h2>Technology</h2>
                <p>Open-source tools that make the browser feel like a cockpit.</p>
              </div>
            </CardHead>
            <Stack>
              <Badge $tone="lime">Next.js App Router</Badge>
              <Badge $tone="info">React 19</Badge>
              <Badge $tone="purple">TypeScript</Badge>
              <Badge $tone="warning">Three.js</Badge>
              <Badge>styled-components</Badge>
              <Badge>Zustand</Badge>
              <Badge>Lucide</Badge>
              <Badge>Web Audio API</Badge>
              <Badge>LocalStorage</Badge>
            </Stack>
            <Note style={{ marginTop: 18 }}>
              All geometry, materials, scenery, particles and audio are generated in code at runtime.
              There are no downloaded models, textures or music files to break or go missing.
            </Note>
          </Card>

          <Card>
            <CardHead>
              <Cpu size={20} />
              <div>
                <h2>Engineering notes</h2>
                <p>Built for stable frame pacing and clean teardown.</p>
              </div>
            </CardHead>
            <Note>
              The race engine owns one Three.js renderer per run and disposes every geometry,
              material, texture, listener and timer when you leave the road. Traffic, checkpoints and
              coins are pooled rather than recreated. Graphics settings scale shadows, render
              resolution and effects independently so the game stays playable on integrated GPUs and
              phones.
            </Note>
            <Note style={{ marginTop: 12 }}>
              Audio begins only after a deliberate tap or keypress, in line with browser autoplay
              rules. Volume changes and mute state are applied immediately and persisted locally.
            </Note>
          </Card>
        </Column>

        <Column>
          <Card>
            <CardHead>
              <Music2 size={20} />
              <div>
                <h2>Sound</h2>
                <p>Every note is generated, never streamed.</p>
              </div>
            </CardHead>
            <Note>
              The engine note follows RPM, throttle, gear and speed. Tyre slip, nitro, impacts,
              pickups and interface cues are layered on top, while each destination gets its own
              procedural music bed and ambience. The audio graph is suspended when the tab is hidden
              and torn down when you leave the race.
            </Note>
            <Stack style={{ marginTop: 16 }}>
              <Badge $tone="lime">
                <Volume2 size={9} /> Engine synthesis
              </Badge>
              <Badge $tone="info">Procedural music</Badge>
              <Badge $tone="purple">Ambience beds</Badge>
            </Stack>
          </Card>

          <Card>
            <CardHead>
              <Flag size={20} />
              <div>
                <h2>Content</h2>
                <p>Hand-built for this release.</p>
              </div>
            </CardHead>
            <Note>
              Seven destinations — Mountain Highway, City Night, Desert Highway, Coastal Road, Snowy
              Mountain Pass, Forest Highway and Neon City — each carry their own sky, weather,
              lighting, road furniture and soundtrack. Eight cars span sport, muscle, super, hyper,
              offroad and electric classes, with per-car paint, rims, wheels, spoilers, decals and
              underglow saved in your garage.
            </Note>
          </Card>

          <Card>
            <CardHead>
              <Trophy size={20} />
              <div>
                <h2>Acknowledgements</h2>
                <p>Standing on the shoulders of open source.</p>
              </div>
            </CardHead>
            <Note>
              Thanks to the maintainers and communities behind Three.js, Next.js, React, TypeScript,
              styled-components, Zustand and Lucide. Their work is used under the MIT and Apache
              licences. Thanks also to every player who keeps chasing one more kilometre.
            </Note>
            <Note style={{ marginTop: 12 }}>
              Highway Rush is a fictional arcade experience. Vehicle names, brands and route names
              are original to the game. Any resemblance to real products is coincidental.
            </Note>
          </Card>

          <Card>
            <CardHead>
              <Code2 size={20} />
              <div>
                <h2>Press kit</h2>
                <p>Short description for streams, posts and listings.</p>
              </div>
            </CardHead>
            <Note>
              <strong style={{ color: 'var(--text)' }}>Highway Rush</strong> is a free 3D endless
              highway racer for the browser. Thread traffic, chain near misses, manage fuel, health
              and nitro, and unlock seven routes and eight cars. Built by Umar Nazir with Next.js and
              Three.js.
            </Note>
            <Stack style={{ marginTop: 16 }}>
              <Badge $tone="lime">Free to play</Badge>
              <Badge>No account</Badge>
              <Badge>Local saves</Badge>
              <Badge>Desktop &amp; mobile</Badge>
            </Stack>
          </Card>
        </Column>
      </Grid>

      <Signature>
        <div>
          <SectionKicker>One name on the door</SectionKicker>
          <h2>
            Built by <em>Umar Nazir.</em>
          </h2>
          <p>
            If you enjoyed the drive, the best thanks is another run. The road is always open, and
            your next personal best is one launch away.
          </p>
        </div>
        <ButtonLink href="/play" size="xl" icon={<ArrowRight size={15} />}>
          Hit the highway
        </ButtonLink>
      </Signature>

      <Legal>
        © {new Date().getFullYear()} Highway Rush. All rights reserved. Built by Umar Nazir. Highway
        Rush is an independent project and is not affiliated with any vehicle manufacturer. Progress,
        settings and records are stored locally under <code>highway-rush-save-v2</code>; clearing
        browser data removes them permanently.
      </Legal>
    </PageShell>
  );
}

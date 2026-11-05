'use client';

import Link from 'next/link';
import styled from 'styled-components';
import {
  ArrowLeft,
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
  Zap,
} from 'lucide-react';
import { CARS } from '@/lib/data/cars';
import { DESTINATIONS } from '@/lib/data/destinations';
import { TROPHIES } from '@/lib/data/trophies';
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

const HeroPanel = styled.div`
  position: relative;
  padding: clamp(28px, 4vw, 48px);
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background:
    radial-gradient(ellipse at 95% 10%, rgba(215, 255, 63, 0.1), transparent 50%),
    linear-gradient(180deg, rgba(16, 21, 28, 0.95), rgba(7, 10, 14, 0.98));
  backdrop-filter: blur(14px);
  overflow: hidden;

  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--lime);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  h2 {
    margin-top: 10px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(36px, 6vw, 68px);
    font-style: italic;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.03em;
    text-transform: uppercase;

    em {
      color: var(--lime);
      font-style: inherit;
    }
  }

  .creator-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 18px;
    padding: 6px 14px;
    border-radius: 3px;
    border: 1px solid rgba(215, 255, 63, 0.35);
    background: rgba(215, 255, 63, 0.08);
    color: var(--text);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;

    svg {
      color: var(--lime);
    }
  }

  .subhead {
    max-width: 600px;
    margin-top: 14px;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.7;
  }
`;

const MetricsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: 24px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: var(--line);
  overflow: hidden;

  ${media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const MetricTile = styled.div`
  padding: 14px 16px;
  background: rgba(6, 9, 12, 0.85);

  span {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-dim);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;

    svg {
      color: var(--lime);
    }
  }

  strong {
    display: block;
    margin-top: 6px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 24px;
    font-style: italic;
    font-weight: 900;
    color: var(--text);
    line-height: 1;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  ${media.desktop} {
    grid-template-columns: 1fr;
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
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.2);

  svg {
    color: var(--lime);
  }

  h3 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 16px;
    font-style: italic;
    font-weight: 900;
    text-transform: uppercase;
  }
`;

const PanelBody = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RoleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);

  &:last-child {
    border-bottom: 0;
  }

  span {
    color: var(--text-dim);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    color: var(--text);
    font-size: 11px;
    font-weight: 800;
  }
`;

const BadgeCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TechTag = styled.div<{ $highlight?: boolean }>`
  padding: 4px 10px;
  border-radius: 3px;
  border: 1px solid ${({ $highlight }) => ($highlight ? 'var(--lime)' : 'var(--line)')};
  background: ${({ $highlight }) => ($highlight ? 'rgba(215, 255, 63, 0.1)' : 'rgba(255, 255, 255, 0.03)')};
  color: ${({ $highlight }) => ($highlight ? 'var(--lime)' : 'var(--text-muted)')};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const TechDesc = styled.p`
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;
`;

const FooterNote = styled.div`
  padding: 16px 20px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  span {
    color: var(--text-dim);
    font-size: 9px;
    letter-spacing: 0.05em;
  }

  strong {
    color: var(--text);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 10px;
  }
`;

export default function CreditsPage() {
  return (
    <Stage>
      <ContentWrap>
        <TopNav>
          <BackPill href="/">
            <ArrowLeft size={16} /> Main Menu
          </BackPill>

          <HeaderTitle>
            <span>System Information</span>
            <h1>
              Production <em>Credits</em>
            </h1>
          </HeaderTitle>

          <RaceLinkBtn href="/play">
            <Flag size={14} /> Back to Highway
          </RaceLinkBtn>
        </TopNav>

        <HeroPanel>
          <div className="kicker">
            <Sparkles size={12} /> Original Browser 3D Production · v2.0.0
          </div>
          <h2>
            Highway <em>Rush</em>
          </h2>
          <div className="creator-badge">
            <Heart size={13} fill="currentColor" /> Engineered by Umar Nazir
          </div>
          <p className="subhead">
            A standalone high-performance 3D racing simulator engineered completely for modern web browsers.
            Procedural Web Audio DSP, GPU instanced geometry, and authentic arcade handling without external asset streams or installations.
          </p>

          <MetricsStrip>
            <MetricTile>
              <span>
                <Route size={10} /> Destinations
              </span>
              <strong>{DESTINATIONS.length}</strong>
            </MetricTile>

            <MetricTile>
              <span>
                <Car size={10} /> Performance Machines
              </span>
              <strong>{CARS.length}</strong>
            </MetricTile>

            <MetricTile>
              <span>
                <Trophy size={10} /> Career Trophies
              </span>
              <strong>{TROPHIES.length}</strong>
            </MetricTile>

            <MetricTile>
              <span>
                <Gauge size={10} /> Target Framerate
              </span>
              <strong>60 FPS</strong>
            </MetricTile>
          </MetricsStrip>
        </HeroPanel>

        <Grid>
          <TerminalPanel>
            <PanelHead>
              <Users size={16} />
              <h3>Development &amp; Creative Direction</h3>
            </PanelHead>
            <PanelBody>
              <RoleRow>
                <span>Creator &amp; Software Architect</span>
                <strong>Umar Nazir</strong>
              </RoleRow>
              <RoleRow>
                <span>3D Graphics &amp; Shader Engineering</span>
                <strong>Umar Nazir</strong>
              </RoleRow>
              <RoleRow>
                <span>Procedural Audio Synthesis</span>
                <strong>Umar Nazir</strong>
              </RoleRow>
              <RoleRow>
                <span>Vehicle Dynamics &amp; Physics Tuning</span>
                <strong>Umar Nazir</strong>
              </RoleRow>
              <RoleRow>
                <span>Interface &amp; HUD Architecture</span>
                <strong>Umar Nazir</strong>
              </RoleRow>
            </PanelBody>
          </TerminalPanel>

          <TerminalPanel>
            <PanelHead>
              <Cpu size={16} />
              <h3>Engine &amp; Performance Core</h3>
            </PanelHead>
            <PanelBody>
              <BadgeCluster>
                <TechTag $highlight>Three.js WebGL</TechTag>
                <TechTag $highlight>Instanced Meshes</TechTag>
                <TechTag $highlight>Web Audio DSP</TechTag>
                <TechTag>React 19</TechTag>
                <TechTag>Next.js App Router</TechTag>
                <TechTag>TypeScript</TechTag>
                <TechTag>Zustand Stores</TechTag>
                <TechTag>Styled Components</TechTag>
              </BadgeCluster>

              <TechDesc>
                The 3D engine leverages hardware-accelerated instancing for road dashes, barriers, and environmental props.
                Web Audio automation scheduling is strictly throttled to prevent DSP queue buffer underruns, ensuring fluid 60 FPS gameplay on desktop and mobile GPUs.
              </TechDesc>
            </PanelBody>
          </TerminalPanel>
        </Grid>

        <FooterNote>
          <span>© {new Date().getFullYear()} Highway Rush. All rights reserved. Original work by Umar Nazir.</span>
          <strong>HIGHWAY RUSH v2.0 // ZERO-LAG 3D CORE</strong>
        </FooterNote>
      </ContentWrap>
    </Stage>
  );
}

'use client';

import styled from 'styled-components';
import type { DestinationDefinition, EnvironmentType } from '@/lib/types';
import {
  Building2,
  CloudSnow,
  Mountain,
  Radio,
  Sun,
  Trees,
  Waves,
  type LucideIcon,
} from 'lucide-react';

export const ENVIRONMENT_ICONS: Record<EnvironmentType, LucideIcon> = {
  mountain: Mountain,
  city: Building2,
  desert: Sun,
  coastal: Waves,
  snow: CloudSnow,
  forest: Trees,
  neon: Radio,
};

export function EnvironmentIcon({
  environment,
  size = 16,
}: {
  environment: EnvironmentType;
  size?: number;
}) {
  const Icon = ENVIRONMENT_ICONS[environment];
  return <Icon size={size} />;
}

const Scene = styled.div<{ $height: number }>`
  position: relative;
  width: 100%;
  height: ${({ $height }) => $height}px;
  min-height: 120px;
  overflow: hidden;
  background: linear-gradient(180deg, var(--sky) 0%, var(--fog) 100%);
  isolation: isolate;
`;

const SunDot = styled.div`
  position: absolute;
  top: 16%;
  right: 15%;
  width: clamp(24px, 4vw, 44px);
  height: clamp(24px, 4vw, 44px);
  border-radius: 50%;
  background: var(--sun);
  box-shadow: 0 0 46px 12px color-mix(in srgb, var(--sun) 55%, transparent);
  opacity: 0.9;
  z-index: 1;
`;

const Ridge = styled.div<{ $color: string; $clip: string; $bottom: string; $opacity?: number }>`
  position: absolute;
  left: -12%;
  right: -12%;
  bottom: ${({ $bottom }) => $bottom};
  height: 72%;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip};
  opacity: ${({ $opacity }) => $opacity ?? 1};
  z-index: 2;
`;

const Buildings = styled.div`
  position: absolute;
  inset: 12% 0 42%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  z-index: 2;
  padding: 0 8%;

  i {
    display: block;
    flex: 1;
    max-width: 22px;
    min-width: 5px;
    height: var(--h);
    background: var(--building);
    border-top: 1px solid var(--accent);
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
    opacity: 0.88;
  }
`;

const Ground = styled.div`
  position: absolute;
  inset: auto 0 0;
  height: 46%;
  background: linear-gradient(180deg, var(--ground), color-mix(in srgb, var(--ground) 72%, #000));
  z-index: 3;
`;

const Road = styled.div`
  position: absolute;
  left: 50%;
  bottom: -4%;
  width: 66%;
  height: 46%;
  transform: translateX(-50%) perspective(180px) rotateX(26deg);
  transform-origin: bottom center;
  background: linear-gradient(180deg, transparent, var(--road) 22%, var(--road));
  clip-path: polygon(43% 0, 57% 0, 100% 100%, 0 100%);
  z-index: 4;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 8%;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, transparent, var(--lane) 40%);
    opacity: 0.8;
  }
  &::before {
    left: 37%;
    transform: rotate(8deg);
    transform-origin: bottom;
  }
  &::after {
    right: 37%;
    transform: rotate(-8deg);
    transform-origin: bottom;
  }
`;

const LaneDashes = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 6px;
  height: 44%;
  transform: translateX(-50%);
  background: repeating-linear-gradient(
    180deg,
    var(--lane) 0 6px,
    transparent 6px 16px
  );
  opacity: 0.65;
  z-index: 5;
  mask-image: linear-gradient(180deg, transparent, #000 30%);
`;

const Glow = styled.div`
  position: absolute;
  inset: auto 0 0;
  height: 44%;
  background: linear-gradient(0deg, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%);
  z-index: 6;
  pointer-events: none;
`;

const Grid = styled.div`
  position: absolute;
  inset: 45% 0 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--accent) 16%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 16%, transparent) 1px, transparent 1px);
  background-size: 26px 18px;
  transform: perspective(180px) rotateX(52deg);
  transform-origin: bottom;
  opacity: 0.22;
  z-index: 5;
`;

const weatherDots = (color: string, count: number) =>
  Array.from({ length: count }, (_, index) => (
    <i
      key={index}
      style={{
        position: 'absolute',
        left: `${(index * 37) % 96}%`,
        top: `${(index * 19) % 82}%`,
        width: index % 3 === 0 ? 2 : 1,
        height: index % 3 === 0 ? 2 : 1,
        borderRadius: '50%',
        background: color,
        opacity: 0.55,
        zIndex: 7,
      }}
    />
  ));

export function DestinationVisual({
  destination,
  height = 150,
  showWeather = true,
}: {
  destination: DestinationDefinition;
  height?: number;
  showWeather?: boolean;
}) {
  const { theme: t, environment } = destination;
  const neon = environment === 'neon';
  const city = environment === 'city' || neon;

  return (
    <Scene
      $height={height}
      style={
        {
          '--sky': t.sky,
          '--fog': t.fog,
          '--sun': t.sun,
          '--ground': t.ground,
          '--road': t.road,
          '--lane': t.lane,
          '--accent': t.accent,
          '--building': neon ? '#120c22' : '#0d1420',
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <SunDot />
      {environment === 'mountain' && (
        <>
          <Ridge
            $color="#4b6354"
            $bottom="24%"
            $clip="polygon(0 100%, 8% 52%, 18% 82%, 31% 26%, 45% 78%, 58% 40%, 72% 86%, 86% 30%, 100% 100%)"
          />
          <Ridge
            $color="#789883"
            $bottom="18%"
            $opacity={0.85}
            $clip="polygon(0 100%, 12% 68%, 24% 88%, 41% 48%, 55% 90%, 70% 58%, 86% 92%, 100% 66%, 100% 100%)"
          />
        </>
      )}
      {environment === 'snow' && (
        <>
          <Ridge
            $color="#8fa9bd"
            $bottom="24%"
            $clip="polygon(0 100%, 10% 40%, 25% 84%, 40% 30%, 55% 82%, 70% 42%, 85% 88%, 100% 50%, 100% 100%)"
          />
          <Ridge
            $color="#dbe7ef"
            $bottom="18%"
            $opacity={0.9}
            $clip="polygon(0 100%, 14% 62%, 30% 92%, 46% 54%, 62% 94%, 78% 64%, 100% 90%, 100% 100%)"
          />
        </>
      )}
      {environment === 'desert' && (
        <>
          <Ridge
            $color="#9d6a48"
            $bottom="25%"
            $clip="polygon(0 100%, 16% 58%, 34% 82%, 52% 44%, 70% 80%, 86% 60%, 100% 84%, 100% 100%)"
          />
          <Ridge
            $color="#c08a55"
            $bottom="18%"
            $opacity={0.9}
            $clip="polygon(0 100%, 22% 74%, 40% 92%, 60% 64%, 78% 92%, 100% 72%, 100% 100%)"
          />
        </>
      )}
      {(environment === 'forest' || environment === 'coastal') && (
        <>
          <Ridge
            $color={environment === 'forest' ? '#2f4a32' : '#5e7c68'}
            $bottom="22%"
            $clip="polygon(0 100%, 10% 66%, 26% 88%, 42% 56%, 60% 86%, 78% 62%, 100% 82%, 100% 100%)"
          />
          <Ridge
            $color={environment === 'forest' ? '#456742' : '#8aa081'}
            $bottom="18%"
            $opacity={0.85}
            $clip="polygon(0 100%, 18% 80%, 36% 94%, 56% 72%, 74% 94%, 100% 76%, 100% 100%)"
          />
        </>
      )}
      {city && (
        <Buildings>
          {[38, 62, 45, 78, 54, 90, 44, 68, 35, 58, 72, 42, 56].map((h, index) => (
            <i key={index} style={{ ['--h' as string]: `${h}%` }} />
          ))}
        </Buildings>
      )}
      {neon && <Grid />}
      <Ground />
      <Road />
      <LaneDashes />
      <Glow />
      {showWeather && t.weather === 'snow' && weatherDots('#ffffff', 18)}
      {showWeather && t.weather === 'rain' && weatherDots(t.lane, 22)}
      {showWeather && t.weather === 'dust' && weatherDots('#ffd6a5', 16)}
      {showWeather && t.weather === 'fireflies' && weatherDots('#e8ffa3', 12)}
    </Scene>
  );
}

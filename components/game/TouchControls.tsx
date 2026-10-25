'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { ChevronLeft, ChevronRight, ChevronsDown, ChevronsUp, Zap } from 'lucide-react';
import { media } from '@/lib/ui/theme';

type VirtualAction = 'steerLeft' | 'steerRight' | 'accelerate' | 'brake' | 'nitro';

interface TouchControlsProps {
  onControl: (action: VirtualAction, active: boolean) => void;
  active: boolean;
}

const Root = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: auto 0 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transform: translateY(${({ $active }) => ($active ? '0' : '14px')});
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
  visibility: ${({ $active }) => ($active ? 'visible' : 'hidden')};
`;

const Cluster = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
`;

const Key = styled.button<{
  $size: 'sm' | 'md' | 'lg';
  $tone: 'steer' | 'nitro' | 'brake' | 'throttle';
  $pressed: boolean;
}>`
  position: relative;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: linear-gradient(160deg, rgba(22, 29, 37, 0.78), rgba(6, 9, 12, 0.72));
  color: var(--text);
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 28px rgba(0, 0, 0, 0.32);
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    background 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;

  svg {
    width: ${({ $size }) => ($size === 'lg' ? 34 : $size === 'md' ? 25 : 21)}px;
    height: ${({ $size }) => ($size === 'lg' ? 34 : $size === 'md' ? 25 : 21)}px;
    stroke-width: 2.4;
    pointer-events: none;
  }

  span {
    pointer-events: none;
    opacity: 0.62;
  }

  ${({ $size }) =>
    $size === 'lg' &&
    css`
      width: 92px;
      height: 96px;
      border-radius: 20px;
    `}
  ${({ $size }) =>
    $size === 'md' &&
    css`
      width: 68px;
      height: 68px;
    `}
  ${({ $size }) =>
    $size === 'sm' &&
    css`
      width: 58px;
      height: 52px;
      border-radius: 12px;
    `}

  ${({ $tone }) =>
    $tone === 'throttle' &&
    css`
      border-color: rgba(215, 255, 63, 0.38);
      background: linear-gradient(160deg, rgba(215, 255, 63, 0.2), rgba(20, 28, 10, 0.7));
      color: var(--lime);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        0 0 30px rgba(215, 255, 63, 0.13);
    `}
  ${({ $tone }) =>
    $tone === 'nitro' &&
    css`
      border-color: rgba(56, 189, 248, 0.35);
      color: var(--info);
    `}
  ${({ $tone }) =>
    $tone === 'brake' &&
    css`
      border-color: rgba(255, 93, 93, 0.32);
      color: var(--danger);
    `}

  ${({ $pressed, $tone }) =>
    $pressed &&
    css`
      transform: scale(0.94);
      background: ${$tone === 'throttle'
        ? 'rgba(215, 255, 63, 0.34)'
        : $tone === 'nitro'
          ? 'rgba(56, 189, 248, 0.24)'
          : $tone === 'brake'
            ? 'rgba(255, 93, 93, 0.22)'
            : 'rgba(255, 255, 255, 0.16)'};
      border-color: ${$tone === 'throttle'
        ? 'var(--lime)'
        : $tone === 'nitro'
          ? 'var(--info)'
          : $tone === 'brake'
            ? 'var(--danger)'
            : 'rgba(255, 255, 255, 0.5)'};
    `}

  ${media.mobile} {
    ${({ $size }) =>
      $size === 'lg' &&
      css`
        width: 84px;
        height: 88px;
      `}
    ${({ $size }) =>
      $size === 'md' &&
      css`
        width: 62px;
        height: 62px;
      `}
    ${({ $size }) =>
      $size === 'sm' &&
      css`
        width: 54px;
        height: 48px;
      `}
  }

  @media (orientation: landscape) and (max-height: 560px) {
    ${({ $size }) =>
      $size === 'lg' &&
      css`
        width: 74px;
        height: 74px;
      `}
    ${({ $size }) =>
      $size === 'md' &&
      css`
        width: 56px;
        height: 56px;
      `}
    ${({ $size }) =>
      $size === 'sm' &&
      css`
        width: 50px;
        height: 42px;
      `}
  }
`;

function HoldKey({
  action,
  label,
  icon,
  size = 'md',
  tone = 'steer',
  onControl,
}: {
  action: VirtualAction;
  label: string;
  icon: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'steer' | 'nitro' | 'brake' | 'throttle';
  onControl: (action: VirtualAction, active: boolean) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const pointerRef = useRef<number | null>(null);
  const controlRef = useRef(onControl);
  controlRef.current = onControl;

  const release = () => {
    pointerRef.current = null;
    setPressed((wasPressed) => {
      if (wasPressed) controlRef.current(action, false);
      return false;
    });
  };

  useEffect(() => {
    return () => {
      controlRef.current(action, false);
    };
  }, [action]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    if (pointerRef.current !== null) return;
    pointerRef.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort on older mobile browsers.
    }
    setPressed(true);
    controlRef.current(action, true);
  };

  return (
    <Key
      type="button"
      $size={size}
      $tone={tone}
      $pressed={pressed}
      aria-label={label}
      aria-pressed={pressed}
      onPointerDown={onPointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      {icon}
      <span>{label}</span>
    </Key>
  );
}

/**
 * Translucent hold controls for touch devices. Every key maps directly onto
 * the engine's virtual input channel and releases on pointer cancellation, so
 * inputs cannot remain stuck when a thumb slides off the glass.
 */
export function TouchControls({ onControl, active }: TouchControlsProps) {
  return (
    <Root $active={active} aria-hidden={!active}>
      <Cluster>
        <HoldKey
          action="steerLeft"
          label="Left"
          icon={<ChevronLeft />}
          size="lg"
          onControl={onControl}
        />
        <HoldKey
          action="steerRight"
          label="Right"
          icon={<ChevronRight />}
          size="lg"
          onControl={onControl}
        />
      </Cluster>
      <Cluster>
        <Stack>
          <HoldKey
            action="nitro"
            label="Nitro"
            icon={<Zap />}
            size="sm"
            tone="nitro"
            onControl={onControl}
          />
          <HoldKey
            action="brake"
            label="Brake"
            icon={<ChevronsDown />}
            size="sm"
            tone="brake"
            onControl={onControl}
          />
        </Stack>
        <HoldKey
          action="accelerate"
          label="Throttle"
          icon={<ChevronsUp />}
          size="lg"
          tone="throttle"
          onControl={onControl}
        />
      </Cluster>
    </Root>
  );
}

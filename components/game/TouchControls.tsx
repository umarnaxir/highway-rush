'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { ChevronLeft, ChevronRight, ChevronsDown, ChevronsUp, Smartphone, Volume2, Zap } from 'lucide-react';
import { media } from '@/lib/ui/theme';

type VirtualAction =
  | 'steerLeft'
  | 'steerRight'
  | 'accelerate'
  | 'brake'
  | 'nitro'
  | 'horn'
  | 'switchCamera';

interface TouchControlsProps {
  onControl: (action: VirtualAction, active: boolean) => void;
  active: boolean;
  /** Tilt and drag modes keep throttle/brake/nitro but hide steering keys. */
  showSteering?: boolean;
  steeringLabel?: string;
}

const Root = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: auto 0 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 0 max(14px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom))
    max(14px, env(safe-area-inset-left));
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

const LeftCluster = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  pointer-events: none;
`;

const SteeringRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
`;

const RightCluster = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
`;

const SteeringHint = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  align-self: flex-end;
  margin-bottom: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(215, 255, 63, 0.24);
  border-radius: 999px;
  background: rgba(7, 10, 13, 0.65);
  color: var(--lime);
  font-size: 7.5px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  pointer-events: none;
  backdrop-filter: blur(10px);

  svg {
    width: 12px;
    height: 12px;
  }
`;

const Key = styled.button<{
  $variant: 'steer' | 'throttle' | 'nitro' | 'brake' | 'horn';
  $pressed: boolean;
}>`
  position: relative;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(165deg, rgba(16, 22, 28, 0.72), rgba(6, 9, 12, 0.78));
  color: var(--text);
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.35);
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  transition:
    transform 0.08s ease,
    background 0.1s ease,
    border-color 0.1s ease,
    box-shadow 0.1s ease;

  svg {
    stroke-width: 2.4;
    pointer-events: none;
  }

  span {
    pointer-events: none;
    opacity: 0.65;
    font-size: 6.5px;
    margin-top: 1px;
  }

  /* Steering keys: compact & ergonomic */
  ${({ $variant }) =>
    $variant === 'steer' &&
    css`
      width: 54px;
      height: 52px;
      svg {
        width: 24px;
        height: 24px;
      }
    `}

  /* Primary Throttle key */
  ${({ $variant }) =>
    $variant === 'throttle' &&
    css`
      width: 56px;
      height: 68px;
      border-radius: 14px;
      border-color: rgba(215, 255, 63, 0.36);
      background: linear-gradient(165deg, rgba(215, 255, 63, 0.18), rgba(12, 18, 10, 0.78));
      color: var(--lime);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.16),
        0 0 20px rgba(215, 255, 63, 0.14);

      svg {
        width: 26px;
        height: 26px;
      }
    `}

  /* Nitro key: compact slot */
  ${({ $variant }) =>
    $variant === 'nitro' &&
    css`
      width: 48px;
      height: 31px;
      border-radius: 8px;
      border-color: rgba(56, 189, 248, 0.3);
      color: var(--info);
      svg {
        width: 14px;
        height: 14px;
      }
    `}

  /* Brake key: compact slot */
  ${({ $variant }) =>
    $variant === 'brake' &&
    css`
      width: 48px;
      height: 31px;
      border-radius: 8px;
      border-color: rgba(255, 93, 93, 0.3);
      color: var(--danger);
      svg {
        width: 15px;
        height: 15px;
      }
    `}

  /* Horn key: small secondary round badge */
  ${({ $variant }) =>
    $variant === 'horn' &&
    css`
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border-color: rgba(245, 158, 11, 0.32);
      color: #fbbf24;
      svg {
        width: 13px;
        height: 13px;
      }
    `}

  /* Active / Pressed states */
  ${({ $pressed, $variant }) =>
    $pressed &&
    css`
      transform: scale(0.93);
      background: ${$variant === 'throttle'
        ? 'rgba(215, 255, 63, 0.38)'
        : $variant === 'nitro'
          ? 'rgba(56, 189, 248, 0.28)'
          : $variant === 'brake'
            ? 'rgba(255, 93, 93, 0.26)'
            : $variant === 'horn'
              ? 'rgba(245, 158, 11, 0.32)'
              : 'rgba(215, 255, 63, 0.22)'};
      border-color: ${$variant === 'throttle'
        ? 'var(--lime)'
        : $variant === 'nitro'
          ? 'var(--info)'
          : $variant === 'brake'
            ? 'var(--danger)'
            : $variant === 'horn'
              ? '#fbbf24'
              : 'var(--lime)'};
      box-shadow: 0 0 14px
        ${$variant === 'throttle'
          ? 'rgba(215, 255, 63, 0.45)'
          : $variant === 'nitro'
            ? 'rgba(56, 189, 248, 0.4)'
            : $variant === 'brake'
              ? 'rgba(255, 93, 93, 0.4)'
              : 'rgba(215, 255, 63, 0.3)'};
    `}

  @media (orientation: landscape) and (max-height: 560px) {
    ${({ $variant }) =>
      $variant === 'steer' &&
      css`
        width: 48px;
        height: 46px;
      `}
    ${({ $variant }) =>
      $variant === 'throttle' &&
      css`
        width: 50px;
        height: 58px;
      `}
    ${({ $variant }) =>
      ($variant === 'nitro' || $variant === 'brake') &&
      css`
        width: 44px;
        height: 27px;
      `}
  }
`;

function HoldKey({
  action,
  label,
  icon,
  variant,
  showLabel = false,
  onControl,
}: {
  action: VirtualAction;
  label: string;
  icon: ReactNode;
  variant: 'steer' | 'throttle' | 'nitro' | 'brake' | 'horn';
  showLabel?: boolean;
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
      // Pointer capture is best-effort on mobile browsers.
    }
    setPressed(true);
    controlRef.current(action, true);
  };

  return (
    <Key
      type="button"
      $variant={variant}
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
      {showLabel && <span>{label}</span>}
    </Key>
  );
}

/**
 * Clean, minimal, thumb-friendly mobile controls.
 * Left cluster: Left/Right steering + small Horn.
 * Right cluster: Throttle (primary) + Nitro & Brake.
 * Zero duplicate camera button (camera is placed in Top HUD).
 * Middle area is 100% empty for maximum 3D road and vehicle visibility.
 */
export function TouchControls({
  onControl,
  active,
  showSteering = true,
  steeringLabel,
}: TouchControlsProps) {
  return (
    <Root $active={active} aria-hidden={!active}>
      {/* LEFT CLUSTER: STEERING & HORN */}
      <LeftCluster>
        <HoldKey
          action="horn"
          label="Horn"
          icon={<Volume2 />}
          variant="horn"
          onControl={onControl}
        />
        {showSteering ? (
          <SteeringRow>
            <HoldKey
              action="steerLeft"
              label="Steer Left"
              icon={<ChevronLeft />}
              variant="steer"
              onControl={onControl}
            />
            <HoldKey
              action="steerRight"
              label="Steer Right"
              icon={<ChevronRight />}
              variant="steer"
              onControl={onControl}
            />
          </SteeringRow>
        ) : (
          <SteeringHint>
            <Smartphone /> {steeringLabel ?? 'Tilt to steer'}
          </SteeringHint>
        )}
      </LeftCluster>

      {/* RIGHT CLUSTER: NITRO, BRAKE, THROTTLE */}
      <RightCluster>
        <Stack>
          <HoldKey
            action="nitro"
            label="Nitro"
            icon={<Zap />}
            variant="nitro"
            onControl={onControl}
          />
          <HoldKey
            action="brake"
            label="Brake"
            icon={<ChevronsDown />}
            variant="brake"
            onControl={onControl}
          />
        </Stack>
        <HoldKey
          action="accelerate"
          label="Gas"
          icon={<ChevronsUp />}
          variant="throttle"
          onControl={onControl}
        />
      </RightCluster>
    </Root>
  );
}

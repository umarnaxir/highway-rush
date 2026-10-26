'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import styled from 'styled-components';
import { GripHorizontal } from 'lucide-react';

interface DragSteerLayerProps {
  active: boolean;
  onSteer: (value: number) => void;
}

const Layer = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 14;
  touch-action: none;
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
  -webkit-tap-highlight-color: transparent;

  &:active {
    cursor: grabbing;
  }
`;

const Guide = styled.div<{ $x: number; $visible: boolean }>`
  position: absolute;
  left: 50%;
  bottom: calc(108px + env(safe-area-inset-bottom));
  width: min(360px, 62vw);
  height: 38px;
  transform: translateX(-50%);
  border: 1px solid rgba(245, 246, 247, 0.14);
  border-radius: 999px;
  background: rgba(7, 10, 13, 0.42);
  backdrop-filter: blur(10px);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.18s ease;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 16px;
    right: 16px;
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      rgba(215, 255, 63, 0.5) 0 6px,
      transparent 6px 12px
    );
  }

  &::after {
    content: '';
    position: absolute;
    top: 5px;
    bottom: 5px;
    left: calc(50% + ${({ $x }) => $x}px);
    width: 3px;
    border-radius: 999px;
    background: var(--lime);
    box-shadow: 0 0 18px rgba(215, 255, 63, 0.65);
    transform: translateX(-50%);
  }

  @media (orientation: landscape) and (max-height: 560px) {
    bottom: calc(86px + env(safe-area-inset-bottom));
    width: min(300px, 44vw);
    height: 30px;
  }
`;

const Hint = styled.div<{ $visible: boolean }>`
  position: absolute;
  left: 50%;
  bottom: calc(150px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  pointer-events: none;
  white-space: nowrap;

  @media (orientation: landscape) and (max-height: 560px) {
    bottom: calc(120px + env(safe-area-inset-bottom));
  }
`;

/**
 * Full-canvas horizontal drag steering. It sits behind the translucent control
 * buttons, so throttle/brake/nitro and pause remain independently tappable.
 * Returning the pointer to centre is a physical, discoverable zero point.
 */
export function DragSteerLayer({ active, onSteer }: DragSteerLayerProps) {
  const pointerRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const steerRef = useRef(onSteer);
  steerRef.current = onSteer;
  const [state, setState] = useState({ dragging: false, offset: 0, steer: 0 });

  useEffect(() => {
    if (!active) {
      pointerRef.current = null;
      steerRef.current(0);
      setState({ dragging: false, offset: 0, steer: 0 });
    }
  }, [active]);

  useEffect(() => {
    return () => steerRef.current(0);
  }, []);

  const begin = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!active) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (pointerRef.current !== null) return;
    event.preventDefault();
    pointerRef.current = event.pointerId;
    startXRef.current = event.clientX;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Best effort on older mobile browsers.
    }
    setState({ dragging: true, offset: 0, steer: 0 });
    steerRef.current(0);
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    event.preventDefault();
    const range = Math.max(120, window.innerWidth * 0.22);
    const delta = event.clientX - startXRef.current;
    const clamped = Math.max(-1, Math.min(1, delta / range));
    const curved = Math.sign(clamped) * Math.pow(Math.abs(clamped), 1.18);
    setState({
      dragging: true,
      offset: Math.max(-range, Math.min(range, delta)) * 0.48,
      steer: curved,
    });
    steerRef.current(curved);
  };

  const end = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    setState({ dragging: false, offset: 0, steer: 0 });
    steerRef.current(0);
  };

  return (
    <Layer
      $active={active}
      aria-hidden="true"
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Hint $visible={state.dragging}>
        <GripHorizontal size={12} /> Drag left / right to steer
      </Hint>
      <Guide $x={state.offset} $visible={state.dragging} />
    </Layer>
  );
}

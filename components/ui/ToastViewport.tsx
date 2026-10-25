'use client';

import styled, { keyframes } from 'styled-components';
import { Award, CheckCircle2, Coins, Info, Sparkles, TriangleAlert, Trophy, X } from 'lucide-react';
import { useUiStore, type ToastKind } from '@/lib/store/useUiStore';
import { media } from '@/lib/ui/theme';

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(22px) scale(.98); }
  to { opacity: 1; transform: translateX(0) scale(1); }
`;

const Wrap = styled.div`
  position: fixed;
  top: 86px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 32px));
  pointer-events: none;
  ${media.mobile} {
    top: 76px;
    right: 16px;
    left: 16px;
    width: auto;
  }
`;

const tones: Record<ToastKind, { color: string; bg: string; border: string }> = {
  info: { color: 'var(--info)', bg: 'rgba(56,189,248,.09)', border: 'rgba(56,189,248,.35)' },
  success: { color: 'var(--lime)', bg: 'rgba(215,255,63,.08)', border: 'rgba(215,255,63,.35)' },
  error: { color: 'var(--danger)', bg: 'rgba(255,93,93,.08)', border: 'rgba(255,93,93,.35)' },
  trophy: { color: 'var(--warning)', bg: 'rgba(251,191,36,.09)', border: 'rgba(251,191,36,.4)' },
  achievement: { color: 'var(--purple)', bg: 'rgba(167,139,250,.09)', border: 'rgba(167,139,250,.35)' },
  reward: { color: 'var(--warning)', bg: 'rgba(255,212,59,.08)', border: 'rgba(255,212,59,.35)' },
};

const Toast = styled.div<{ $kind: ToastKind }>`
  pointer-events: auto;
  position: relative;
  display: flex;
  gap: 13px;
  padding: 14px 40px 14px 14px;
  background: linear-gradient(150deg, rgba(20, 27, 34, 0.98), rgba(9, 13, 17, 0.98));
  border: 1px solid ${({ $kind }) => tones[$kind].border};
  border-left: 3px solid ${({ $kind }) => tones[$kind].color};
  border-radius: 5px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(14px);
  animation: ${slideIn} 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: ${({ $kind }) => tones[$kind].color};
    opacity: 0.55;
  }
`;

const IconWrap = styled.div<{ $kind: ToastKind }>`
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: ${({ $kind }) => tones[$kind].color};
  background: ${({ $kind }) => tones[$kind].bg};
  border: 1px solid ${({ $kind }) => tones[$kind].border};
`;

const Copy = styled.div`
  min-width: 0;
  padding-top: 1px;

  strong {
    display: block;
    font-size: 11px;
    line-height: 1.25;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text);
  }

  span {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-muted);
  }
`;

const Dismiss = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-dim);
  transition: all 0.15s ease;
  &:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.08);
  }
`;

function ToastIcon({ kind }: { kind: ToastKind }) {
  const size = 17;
  switch (kind) {
    case 'trophy':
      return <Trophy size={size} />;
    case 'achievement':
      return <Award size={size} />;
    case 'reward':
      return <Coins size={size} />;
    case 'success':
      return <CheckCircle2 size={size} />;
    case 'error':
      return <TriangleAlert size={size} />;
    case 'info':
    default:
      return <Info size={size} />;
  }
}

export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);

  return (
    <Wrap aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} $kind={toast.kind} role="status">
          <IconWrap $kind={toast.kind}>
            <ToastIcon kind={toast.kind} />
          </IconWrap>
          <Copy>
            <strong>
              {toast.kind === 'trophy' && <Sparkles size={11} style={{ marginRight: 5, verticalAlign: -1 }} />}
              {toast.title}
            </strong>
            {toast.message && <span>{toast.message}</span>}
          </Copy>
          <Dismiss onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
            <X size={13} />
          </Dismiss>
        </Toast>
      ))}
    </Wrap>
  );
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { Button } from './Button';
import { media } from '@/lib/ui/theme';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(2, 4, 6, 0.78);
  backdrop-filter: blur(10px);
  animation: fadeIn 0.18s ease both;
`;

const Dialog = styled.div<{ $size: 'sm' | 'md' | 'lg' }>`
  width: min(
    ${({ $size }) => ($size === 'sm' ? '420px' : $size === 'lg' ? '920px' : '620px')},
    100%
  );
  max-height: min(86vh, 900px);
  overflow-y: auto;
  background: linear-gradient(160deg, #12181f, #0a0e12 70%);
  border: 1px solid ${({ theme }) => theme.colors.lineStrong};
  border-radius: 8px;
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.7);
  animation: modalIn 0.26s cubic-bezier(0.22, 1, 0.36, 1) both;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 24px;
    right: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(215, 255, 63, 0.6), transparent);
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: translateY(18px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  ${media.mobile} {
    max-height: 90vh;
  }
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 26px 18px;
`;

const Title = styled.h3`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.01em;
  line-height: 1;
  text-transform: uppercase;
`;

const Subtitle = styled.p`
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  line-height: 1.65;
`;

const Close = styled.button`
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: rgba(255, 255, 255, 0.03);
  color: ${({ theme }) => theme.colors.textMuted};
  transition: all 0.15s ease;
  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.lineStrong};
  }
`;

const Body = styled.div`
  padding: 0 26px 26px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 26px;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  background: rgba(0, 0, 0, 0.16);
  flex-wrap: wrap;
`;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
  hideClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  hideClose,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <Backdrop
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <Dialog $size={size} role="dialog" aria-modal="true" aria-label={title}>
        <Head>
          <div>
            <Title>{title}</Title>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </div>
          {!hideClose && (
            <Close onClick={onClose} aria-label="Close dialog">
              <X size={17} />
            </Close>
          )}
        </Head>
        {children && <Body>{children}</Body>}
        {footer && <Footer>{footer}</Footer>}
      </Dialog>
    </Backdrop>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  destructive,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  destructive?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>{message}</p>
    </Modal>
  );
}

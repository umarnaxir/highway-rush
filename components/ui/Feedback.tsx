'use client';

import styled from 'styled-components';
import { Loader2 } from 'lucide-react';

const Wrap = styled.div<{ $minHeight?: string }>`
  min-height: ${({ $minHeight }) => $minHeight ?? '220px'};
  display: grid;
  place-items: center;
  gap: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: 32px;

  span {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  svg {
    color: ${({ theme }) => theme.colors.lime};
    animation: spin 1s linear infinite;
  }
`;

export function PageLoader({ label = 'Loading', minHeight }: { label?: string; minHeight?: string }) {
  return (
    <Wrap $minHeight={minHeight} role="status" aria-live="polite">
      <Loader2 size={26} />
      <span>{label}</span>
    </Wrap>
  );
}

const EmptyWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 52px 24px;
  border: 1px dashed ${({ theme }) => theme.colors.lineStrong};
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.textMuted};
  gap: 10px;

  svg {
    color: ${({ theme }) => theme.colors.textDim};
    margin-bottom: 4px;
  }

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 22px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  p {
    max-width: 420px;
    font-size: 12px;
    line-height: 1.7;
  }
`;

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <EmptyWrap>
      {icon}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </EmptyWrap>
  );
}

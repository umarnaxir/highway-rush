'use client';

import Link from 'next/link';
import Image from 'next/image';
import styled, { css } from 'styled-components';
import { media } from '@/lib/ui/theme';

const sizes = {
  sm: { text: 17, mark: 20, gap: 8, kicker: 6 },
  nav: { text: 20, mark: 24, gap: 9, kicker: 6 },
  md: { text: 24, mark: 28, gap: 11, kicker: 7 },
  lg: { text: 42, mark: 46, gap: 16, kicker: 9 },
  xl: { text: 'clamp(44px, 8vw, 104px)', mark: 'clamp(44px, 8vw, 104px)', gap: 24, kicker: 11 },
};

const Wrap = styled(Link)<{ $size: keyof typeof sizes; $plain?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $size }) => sizes[$size].gap}px;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
  ${({ $plain }) =>
    !$plain &&
    css`
      &:hover {
        opacity: 0.92;
      }
    `}
`;

const Mark = styled.span<{ $size: keyof typeof sizes }>`
  position: relative;
  width: ${({ $size }) => (typeof sizes[$size].mark === 'number' ? `${sizes[$size].mark}px` : sizes[$size].mark)};
  height: ${({ $size }) => (typeof sizes[$size].mark === 'number' ? `${sizes[$size].mark}px` : sizes[$size].mark)};
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  overflow: hidden;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const Words = styled.span<{ $size: keyof typeof sizes }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 0.82;
`;

const Word = styled.span<{ $size: keyof typeof sizes }>`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ $size }) => (typeof sizes[$size].text === 'number' ? `${sizes[$size].text}px` : sizes[$size].text)};
  font-style: italic;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: var(--text);
  white-space: nowrap;

  b {
    color: var(--lime);
    font-weight: inherit;
  }

  ${media.mobile} {
    font-size: ${({ $size }) =>
      $size === 'xl' ? 'clamp(38px, 12vw, 68px)' : $size === 'lg' ? '32px' : undefined};
  }
`;

const Kicker = styled.span<{ $size: keyof typeof sizes }>`
  display: block;
  margin-top: 4px;
  color: var(--text-dim);
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ $size }) => sizes[$size].kicker}px;
  font-weight: 800;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  white-space: nowrap;
`;

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/icon.svg"
      width={size}
      height={size}
      alt="Highway Rush Logo"
      unoptimized
      style={{ display: 'block', borderRadius: 6, objectFit: 'contain' }}
    />
  );
}

export function Logo({
  size = 'md',
  href = '/',
  plain,
  showKicker = true,
}: {
  size?: keyof typeof sizes;
  href?: string;
  plain?: boolean;
  showKicker?: boolean;
}) {
  return (
    <Wrap href={href} $size={size} $plain={plain} aria-label="Highway Rush home">
      <Mark $size={size}>
        <Image
          src="/icon.svg"
          alt="Highway Rush Logo"
          width={32}
          height={32}
          unoptimized
          style={{ width: '100%', height: '100%', display: 'block', borderRadius: 6, objectFit: 'contain' }}
        />
      </Mark>
      <Words $size={size}>
        <Word $size={size}>
          HIGHWAY<b>&nbsp;RUSH</b>
        </Word>
        {showKicker && <Kicker $size={size}>Endless Drive</Kicker>}
      </Words>
    </Wrap>
  );
}

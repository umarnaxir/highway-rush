'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { media } from '@/lib/ui/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface StyleProps {
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth?: boolean;
  $square?: boolean;
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const baseStyles = css<StyleProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  ${({ $size }) =>
    $size === 'sm' &&
    css`
      min-height: 34px;
      padding: 0 14px;
      font-size: 10px;
    `}
  ${({ $size }) =>
    $size === 'md' &&
    css`
      min-height: 44px;
      padding: 0 20px;
      font-size: 11px;
    `}
  ${({ $size }) =>
    $size === 'lg' &&
    css`
      min-height: 54px;
      padding: 0 26px;
      font-size: 12px;
    `}
  ${({ $size }) =>
    $size === 'xl' &&
    css`
      min-height: 64px;
      padding: 0 32px;
      font-size: 13px;
    `}

  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  ${({ $square }) =>
    $square &&
    css`
      width: 44px;
      min-width: 44px;
      padding: 0;
      aspect-ratio: 1;
    `}

  ${({ $variant, theme }) =>
    $variant === 'primary' &&
    css`
      background: ${theme.colors.lime};
      color: ${theme.colors.limeInk};
      clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
      box-shadow: 0 0 0 rgba(215, 255, 63, 0);
      &:hover {
        background: #e5ff78;
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(215, 255, 63, 0.18);
      }
      &:active {
        transform: translateY(0);
      }
    `}

  ${({ $variant, theme }) =>
    $variant === 'secondary' &&
    css`
      background: rgba(255, 255, 255, 0.035);
      border-color: ${theme.colors.lineStrong};
      color: ${theme.colors.text};
      &:hover {
        background: rgba(255, 255, 255, 0.075);
        border-color: rgba(255, 255, 255, 0.28);
        transform: translateY(-2px);
      }
    `}

  ${({ $variant, theme }) =>
    $variant === 'dark' &&
    css`
      background: #0a0e12;
      border-color: ${theme.colors.line};
      color: ${theme.colors.text};
      &:hover {
        border-color: ${theme.colors.lime};
        color: ${theme.colors.lime};
      }
    `}

  ${({ $variant, theme }) =>
    $variant === 'ghost' &&
    css`
      background: transparent;
      color: ${theme.colors.textMuted};
      &:hover {
        color: ${theme.colors.text};
        background: rgba(255, 255, 255, 0.05);
      }
    `}

  ${({ $variant, theme }) =>
    $variant === 'danger' &&
    css`
      background: rgba(255, 93, 93, 0.12);
      border-color: rgba(255, 93, 93, 0.45);
      color: ${theme.colors.danger};
      &:hover {
        background: ${theme.colors.danger};
        color: #180303;
      }
    `}

  &:disabled {
    opacity: 0.42;
    transform: none !important;
    box-shadow: none !important;
  }

  svg {
    flex: 0 0 auto;
  }

  ${media.mobile} {
    ${({ $size }) =>
      $size === 'xl' &&
      css`
        min-height: 56px;
        font-size: 12px;
      `}
  }
`;

const Spinner = styled.span`
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const StyledButton = styled.button<StyleProps>`
  ${baseStyles}
`;

const StyledLink = styled(Link)<StyleProps>`
  ${baseStyles}
`;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  square?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  square,
  loading,
  icon,
  iconRight,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $square={square}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner aria-hidden />
      ) : (
        icon
      )}
      {children}
      {!loading && iconRight}
    </StyledButton>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  square?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  onClick?: () => void;
  prefetch?: boolean;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  square,
  icon,
  iconRight,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <StyledLink
      href={href}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $square={square}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </StyledLink>
  );
}

export const IconButton = styled.button<{ $active?: boolean; $size?: number }>`
  width: ${({ $size }) => $size ?? 40}px;
  height: ${({ $size }) => $size ?? 40}px;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: rgba(255, 255, 255, 0.035);
  color: ${({ theme, $active }) => ($active ? theme.colors.lime : theme.colors.textMuted)};
  transition: all 0.18s ease;
  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.lineStrong};
    background: rgba(255, 255, 255, 0.08);
  }
`;

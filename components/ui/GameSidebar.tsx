'use client';

import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { media } from '@/lib/ui/theme';

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 24px rgba(215, 255, 63, 0.35), 0 0 48px rgba(215, 255, 63, 0.12);
  }
  50% {
    box-shadow: 0 0 36px rgba(215, 255, 63, 0.6), 0 0 70px rgba(215, 255, 63, 0.25);
  }
`;

export const GameSidebarRoot = styled.aside`
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  width: clamp(340px, 24vw, 390px);
  z-index: 30;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 12px;
  border: 1px solid rgba(215, 255, 63, 0.16);
  background: linear-gradient(175deg, rgba(10, 14, 20, 0.86) 0%, rgba(5, 8, 12, 0.94) 100%);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  box-shadow:
    -14px 0 45px rgba(0, 0, 0, 0.68),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: transform 0.25s ease, opacity 0.25s ease;

  @media (max-width: 960px) {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 48vh;
    border-radius: 18px 18px 0 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
    border-top: 1px solid rgba(215, 255, 63, 0.22);
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.7);
  }
`;

export const MobileDragHandle = styled.div`
  display: none;
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  margin: 8px auto 2px;
  flex: 0 0 auto;

  @media (max-width: 960px) {
    display: block;
  }
`;

export const SidebarScroll = styled.div`
  padding: 20px 20px 14px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(215, 255, 63, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(215, 255, 63, 0.2);
    border-radius: 4px;
  }

  @media (max-width: 960px) {
    padding: 10px 16px 10px;
    gap: 12px;
  }
`;

export const SidebarFooter = styled.div`
  padding: 14px 20px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(4, 7, 10, 0.65);
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 960px) {
    padding: 10px 16px max(14px, env(safe-area-inset-bottom));
  }
`;

export const SidebarKicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--lime);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 2px;
`;

export const SidebarTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(20px, 2.2vw, 26px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  margin: 0;
  color: #ffffff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.6);
`;

export const SidebarSubtitle = styled.p`
  margin: 4px 0 0;
  color: var(--text-dim);
  font-size: 11px;
  line-height: 1.4;
`;

export const SidebarBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const SidebarBadge = styled.span<{ $tone?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 4px;
  border: 1px solid ${({ $tone }) => ($tone ? $tone : 'rgba(255, 255, 255, 0.12)')};
  background: rgba(12, 17, 24, 0.7);
  color: ${({ $tone }) => ($tone ? $tone : 'var(--text)')};
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .section-label {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
`;

export const SidebarMetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

export const SidebarMetricCard = styled.div<{ $highlight?: boolean }>`
  background: rgba(12, 17, 24, 0.6);
  border: 1px solid ${({ $highlight }) => ($highlight ? 'rgba(215, 255, 63, 0.3)' : 'rgba(255, 255, 255, 0.07)')};
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;

  .label {
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .value {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: 13px;
    font-style: italic;
    font-weight: 900;
    color: ${({ $highlight }) => ($highlight ? 'var(--lime)' : '#ffffff')};
  }
`;

export const SidebarBarRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);

    b {
      color: #ffffff;
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 9px;
    }
  }

  .track {
    height: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;

    .fill {
      height: 100%;
      border-radius: 999px;
      background: var(--lime);
      box-shadow: 0 0 10px rgba(215, 255, 63, 0.4);
      transition: width 0.35s ease;
    }
  }
`;

export const SidebarPillGroup = styled.div`
  display: flex;
  align-items: center;
  background: rgba(12, 17, 24, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 3px;
  gap: 3px;
`;

export const SidebarPill = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 7px 8px;
  border-radius: 4px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--lime)' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(215, 255, 63, 0.16)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-dim)')};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 10px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  text-align: center;

  &:hover {
    color: #ffffff;
  }
`;

export const SidebarPrimaryBtn = styled.button<{ $tone?: 'lime' | 'amber' }>`
  width: 100%;
  padding: 14px 20px;
  border-radius: 6px;
  border: none;
  background: ${({ $tone }) => ($tone === 'amber' ? '#f59e0b' : 'var(--lime)')};
  color: #07090b;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 15px;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  animation: ${pulseGlow} 2.4s infinite ease-in-out;
  transition: all 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: ${({ $tone }) => ($tone === 'amber' ? '#fbbf24' : '#e6ff66')};
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-dim);
    animation: none;
    box-shadow: none;
  }
`;

export const SidebarNotice = styled.div<{ $tone?: 'warning' | 'info' | 'lime' }>`
  font-size: 8.5px;
  font-weight: 700;
  color: ${({ $tone }) => ($tone === 'warning' ? '#fbbf24' : 'var(--lime)')};
  background: ${({ $tone }) =>
    $tone === 'warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(215, 255, 63, 0.1)'};
  border: 1px solid
    ${({ $tone }) => ($tone === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(215, 255, 63, 0.25)')};
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const SidebarVehicleCard = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(12, 17, 24, 0.6);
  text-decoration: none;
  color: #ffffff;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--lime);
    background: rgba(215, 255, 63, 0.08);
    transform: translateY(-1px);
  }

  .veh-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 800;
    font-style: italic;
    text-transform: uppercase;
    font-family: ${({ theme }) => theme.fonts.display};

    svg {
      color: var(--lime);
    }

    .class-tag {
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 7.5px;
      font-style: normal;
      color: var(--lime);
      background: rgba(215, 255, 63, 0.14);
      padding: 2px 5px;
      border-radius: 3px;
    }
  }

  .veh-action {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--lime);
    text-transform: uppercase;
  }
`;

export const SidebarHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const QuickCycleGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(12, 17, 24, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 2px 4px;
  flex: 0 0 auto;

  button {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    background: transparent;
    border: none;
    color: var(--text-dim);
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: var(--lime);
      background: rgba(215, 255, 63, 0.15);
    }
  }

  span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 8.5px;
    font-weight: 800;
    color: #ffffff;
    padding: 0 4px;
  }
`;

export const RosterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(215, 255, 63, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(215, 255, 63, 0.2);
    border-radius: 4px;
  }
`;

export const RosterItem = styled.button<{ $active: boolean; $locked: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 5px;
  border: 1px solid
    ${({ $active }) => ($active ? 'var(--lime)' : 'rgba(255, 255, 255, 0.08)')};
  background: ${({ $active }) =>
    $active ? 'rgba(215, 255, 63, 0.14)' : 'rgba(12, 17, 24, 0.6)'};
  color: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  box-shadow: ${({ $active }) =>
    $active ? '0 0 12px rgba(215, 255, 63, 0.22)' : 'none'};
  opacity: ${({ $locked }) => ($locked ? 0.75 : 1)};

  &:hover {
    border-color: var(--lime);
    background: rgba(215, 255, 63, 0.08);
    transform: translateX(2px);
  }

  .item-left {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .item-class {
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${({ $active }) => ($active ? 'var(--lime)' : 'var(--text-dim)')};
    }

    .item-name {
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 11.5px;
      font-style: italic;
      font-weight: 900;
      text-transform: uppercase;
      color: ${({ $active }) => ($active ? 'var(--lime)' : '#ffffff')};
    }
  }

  .item-right {
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 4px;

    .tag-equipped {
      color: var(--lime);
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .tag-owned {
      color: var(--text-dim);
    }

    .tag-locked {
      color: var(--warning);
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-family: ${({ theme }) => theme.fonts.mono};
    }
  }
`;

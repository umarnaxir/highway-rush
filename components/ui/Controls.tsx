'use client';

import styled from 'styled-components';
import type { ReactNode } from 'react';

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  &:last-child {
    border-bottom: 0;
  }
`;

const Copy = styled.div`
  min-width: 0;
  strong {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
    letter-spacing: 0.03em;
  }
  span {
    display: block;
    margin-top: 5px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 11px;
    line-height: 1.55;
    max-width: 540px;
  }
`;

const Switch = styled.button<{ $on: boolean }>`
  position: relative;
  width: 46px;
  height: 25px;
  flex: 0 0 auto;
  border-radius: 999px;
  border: 1px solid
    ${({ $on, theme }) => ($on ? 'rgba(215,255,63,.5)' : theme.colors.lineStrong)};
  background: ${({ $on }) => ($on ? 'rgba(215,255,63,.16)' : 'rgba(255,255,255,.06)')};
  transition: all 0.2s ease;
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? '24px' : '3px')};
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: ${({ $on, theme }) => ($on ? theme.colors.lime : theme.colors.textMuted)};
    box-shadow: ${({ $on }) => ($on ? '0 0 12px rgba(215,255,63,.5)' : 'none')};
    transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  }
`;

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Row>
      <Copy>
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </Copy>
      <Switch
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        $on={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </Row>
  );
}

const Segment = styled.div`
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: rgba(0, 0, 0, 0.22);
  flex-wrap: wrap;
`;

const SegmentButton = styled.button<{ $active: boolean }>`
  min-height: 32px;
  padding: 0 13px;
  border-radius: 3px;
  border: 1px solid transparent;
  background: ${({ $active, theme }) => ($active ? theme.colors.lime : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.limeInk : theme.colors.textMuted)};
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.15s ease;
  &:hover {
    color: ${({ $active, theme }) => ($active ? theme.colors.limeInk : theme.colors.text)};
  }
`;

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  description,
}: {
  value: T;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
  label?: string;
  description?: string;
}) {
  return (
    <Row>
      {(label || description) && (
        <Copy>
          {label && <strong>{label}</strong>}
          {description && <span>{description}</span>}
        </Copy>
      )}
      <Segment role="group" aria-label={label}>
        {options.map((option) => (
          <SegmentButton
            key={option.value}
            type="button"
            $active={value === option.value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </SegmentButton>
        ))}
      </Segment>
    </Row>
  );
}

const SliderRow = styled(Row)`
  align-items: flex-start;
`;

const SliderBody = styled.div`
  flex: 1;
  min-width: 0;
  padding-top: 2px;
`;

const SliderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
  strong {
    font-size: 12px;
    font-weight: 700;
  }
  b {
    color: ${({ theme }) => theme.colors.lime};
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

const Extra = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

export function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  format,
  description,
  onCommit,
  extra,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  description?: string;
  onCommit?: () => void;
  extra?: ReactNode;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <SliderRow>
      <SliderBody>
        <SliderTop>
          <strong>{label}</strong>
          <b>{format ? format(value) : value.toFixed(2)}</b>
        </SliderTop>
        {description && (
          <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.55, marginBottom: 10 }}>
            {description}
          </p>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          style={{ ['--range-progress' as string]: `${percent}%` }}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerUp={onCommit}
          onKeyUp={onCommit}
        />
        {extra && <Extra>{extra}</Extra>}
      </SliderBody>
    </SliderRow>
  );
}

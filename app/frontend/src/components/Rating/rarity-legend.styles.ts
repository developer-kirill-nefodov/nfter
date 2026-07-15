import styled from 'styled-components';

import {focusRing} from '../../styles';
import type {ITheme} from '../../theme';

const tierColour = (theme: ITheme, tier: string): string =>
  ({
    pass: theme.colors.textMuted,
    common: theme.colors.rarity.common,
    rare: theme.colors.rarity.rare,
    epic: theme.colors.rarity.epic,
    legendary: theme.colors.rarity.legendary,
  })[tier] ?? theme.colors.border;

export const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

export const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({theme}) => theme.space.xs};
  cursor: pointer;
  font: inherit;
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({theme}) => theme.colors.textMuted};
  background: transparent;
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.pill};
  padding: ${({theme}) => `${theme.space.xs} ${theme.space.sm}`};
  transition: all ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover {
    color: ${({theme}) => theme.colors.text};
    background: ${({theme}) => theme.colors.surfaceRaised};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Panel = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: auto;
  z-index: ${({theme}) => theme.zIndices.dropdown};
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  width: 16rem;
  max-width: min(16rem, 78vw);
  padding: ${({theme}) => theme.space.md};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};
  box-shadow: ${({theme}) => theme.shadows.lg};
`;

export const PanelTitle = styled.span`
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: ${({theme}) => theme.space.xs};
`;

export const Card = styled.div<{$tier: string}>`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.sm};
  padding: ${({theme}) => `${theme.space.xs} ${theme.space.sm}`};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-left: 3px solid ${({theme, $tier}) => tierColour(theme, $tier)};
  border-radius: ${({theme}) => theme.radii.sm};
`;

export const Swatch = styled.span<{$tier: string}>`
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 3px;
  background: ${({theme, $tier}) => tierColour(theme, $tier)};
`;

export const CardName = styled.span<{$tier: string}>`
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({theme, $tier}) => tierColour(theme, $tier)};
`;

export const CardPoints = styled.span`
  margin-left: auto;
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 700;
  color: ${({theme}) => theme.colors.text};
  font-variant-numeric: tabular-nums;
`;

export const Note = styled.span`
  margin-top: ${({theme}) => theme.space.xs};
  font-size: ${({theme}) => theme.fontSizes.xs};
  color: ${({theme}) => theme.colors.textMuted};
`;

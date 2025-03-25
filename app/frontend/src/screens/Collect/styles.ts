import styled, {css} from 'styled-components';

import {focusRing} from '../../styles';

type ITierKey = 'common' | 'rare' | 'epic' | 'legendary';

/** The tier is legible from the card itself, not only from the price. */
const accents: Record<ITierKey, string> = {
  common: '#8b93a7',
  rare: '#22d3ee',
  epic: '#a78bfa',
  legendary: '#fbbf24',
};

export const TierGrid = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`;

export const TierCard = styled.button<{$active: boolean; $tier: ITierKey}>`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  cursor: pointer;
  font: inherit;
  text-align: left;
  padding: ${({theme}) => theme.space.lg};
  border-radius: ${({theme}) => theme.radii.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  transition: transform ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover:not(:disabled) {
    transform: translateY(-3px);
  }

  ${({$active, $tier}) =>
    $active &&
    css`
      border-color: ${accents[$tier]};
      box-shadow: 0 0 0 1px ${accents[$tier]};
    `};

  ${({$tier}) => css`
    ${TierName} {
      color: ${accents[$tier]};
    }
  `};
`;

export const TierName = styled.strong`
  font-size: ${({theme}) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const Price = styled.span`
  font-size: ${({theme}) => theme.fontSizes.lg};
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${({theme}) => theme.colors.text};
`;

export const Remaining = styled.span`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
`;

export const Sold = styled.span`
  color: ${({theme}) => theme.colors.error};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
`;

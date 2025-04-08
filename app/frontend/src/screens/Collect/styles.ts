import styled, {css, keyframes} from 'styled-components';

import {focusRing} from '../../styles';

type ITierKey = 'common' | 'rare' | 'epic' | 'legendary';

/** The tier is legible from the card itself, not only from the price. */
const enter = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
`;

const RARITY: Record<string, string> = {
  common: '#9aa4b8',
  rare: '#38bdf8',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

const accents: Record<ITierKey, string> = {
  common: '#9aa4b8',
  rare: '#38bdf8',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

export const TierGrid = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`;

export const TierCard = styled.button<{$active: boolean; $tier: ITierKey; $delay?: number}>`
  animation: 320ms ease both ${enter};
  animation-delay: ${({$delay}) => $delay ?? 0}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

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

/** Where the choice becomes a purchase — pinned under the tiers, never far. */
export const MintBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({theme}) => theme.space.md};
  padding: ${({theme}) => theme.space.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};

  strong {
    font-size: ${({theme}) => theme.fontSizes.lg};
  }
`;

export const Minted = styled.span`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const Showcase = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
`;

export const ShowcaseCard = styled.button<{$rarity: string; $delay: number}>`
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  text-align: left;
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme, $rarity}) => RARITY[$rarity] ?? theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  box-shadow: 0 0 24px -16px ${({theme, $rarity}) => RARITY[$rarity] ?? theme.colors.border};
  animation: 320ms ease both ${enter};
  animation-delay: ${({$delay}) => $delay}ms;
  transition: transform ${({theme}) => theme.transitions.base};
  ${focusRing};

  &:hover {
    transform: translateY(-4px);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: ${({theme}) => theme.space.md};
  }

  strong {
    font-size: ${({theme}) => theme.fontSizes.sm};
  }

  span {
    color: ${({$rarity, theme}) => RARITY[$rarity] ?? theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.xs};
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  code {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.xs};
  }
`;

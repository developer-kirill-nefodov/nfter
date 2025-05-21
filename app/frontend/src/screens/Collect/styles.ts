import styled, {css, keyframes} from 'styled-components';

import {focusRing} from '../../styles';

type ITierKey = 'common' | 'rare' | 'epic' | 'legendary';

const enter = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 2px #6366f1, 0 0 18px -2px rgba(99, 102, 241, 0.35); }
  50%      { box-shadow: 0 0 0 4px #818cf8, 0 0 34px 2px rgba(99, 102, 241, 0.65); }
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

export const Showcase = styled.div`
  position: relative;
  overflow: hidden;

  mask-image: linear-gradient(to right, transparent, #000 4%, #000 96%, transparent);
`;

const slide = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`;

export const ShowcaseTrack = styled.div`
  display: flex;
  gap: ${({theme}) => theme.space.md};
  width: max-content;
  animation: var(--rail-duration, 32s) linear infinite ${slide};

  ${Showcase}:hover &,
  ${Showcase}:focus-within & {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    flex-wrap: wrap;
  }
`;

export const GhostCard = styled.div`
  flex: 0 0 200px;
  height: 240px;
  border: 1px dashed ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  background: ${({theme}) => theme.colors.surface};
  animation: 2.4s ease-in-out infinite ${pulse};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const ShowcaseCard = styled.button<{$rarity: string; $delay: number; $mine?: boolean}>`
  flex: 0 0 200px;
  position: relative;
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

  ${({$mine, theme}) =>
    $mine &&
    css`
      border-color: ${theme.colors.primaryHover};
      transform: scale(1.03);
      animation: 2.4s ease-in-out infinite ${pulse};

      &:hover {
        transform: scale(1.03) translateY(-4px);
      }
    `};

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
    color: ${({theme}) => theme.colors.text};
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

export const Yours = styled.span`
  position: absolute;
  top: ${({theme}) => theme.space.sm};
  left: ${({theme}) => theme.space.sm};
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: ${({theme}) => theme.shadows.md};
  padding: ${({theme}) => `3px ${theme.space.sm}`};
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.primary};
  color: ${({theme}) => theme.colors.onPrimary};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

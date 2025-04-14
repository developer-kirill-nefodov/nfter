import styled, {css, keyframes} from 'styled-components';

import {focusRing} from '../../styles';

type ITierKey = 'common' | 'rare' | 'epic' | 'legendary';

/** The tier is legible from the card itself, not only from the price. */
const enter = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
  50%      { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.35); }
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

/**
 * A slider, not a scroll container.
 *
 * The previous version nudged `scrollLeft` frame by frame, which scroll-snap
 * quietly undid: the browser re-snapped to the nearest card on every programmatic
 * step, so the rail sat exactly still while the code believed it was moving. And
 * a scrollbar under a shop window is furniture nobody asked for.
 *
 * So the track slides instead. The list is rendered twice and the animation
 * travels exactly half its width — landing on the identical card, which is what
 * makes the loop seamless — and the window simply clips what hangs out.
 */
export const Showcase = styled.div`
  position: relative;
  overflow: hidden;

  /* The cards emerge and dissolve rather than being sliced off at the edges. */
  mask-image: linear-gradient(to right, transparent, #000 4%, #000 96%, transparent);
`;

const slide = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`;

export const ShowcaseTrack = styled.div<{$duration: number}>`
  display: flex;
  gap: ${({theme}) => theme.space.md};
  width: max-content;
  animation: ${({$duration}) => $duration}s linear infinite ${slide};

  /* Read it, do not chase it. */
  ${Showcase}:hover &,
  ${Showcase}:focus-within & {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    flex-wrap: wrap;
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

  /* The one the buyer just paid for, marked for as long as they are looking. */
  ${({$mine}) =>
    $mine &&
    css`
      animation:
        320ms ease both ${enter},
        1.8s ease-in-out 3 ${pulse};
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

/** "Yours" — a badge on the card the buyer just minted. */
export const Yours = styled.span`
  position: absolute;
  top: ${({theme}) => theme.space.sm};
  left: ${({theme}) => theme.space.sm};
  z-index: 1;
  padding: ${({theme}) => `2px ${theme.space.sm}`};
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.primary};
  color: ${({theme}) => theme.colors.onPrimary};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

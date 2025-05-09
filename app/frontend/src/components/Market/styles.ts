import styled, {keyframes} from 'styled-components';

import {focusRing} from '../../styles';
import {media} from '../../theme';

const RARITY: Record<string, string> = {
  common: '#9aa4b8',
  rare: '#38bdf8',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

const enter = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
`;

export const Grid = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.lg};
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
`;

export const ListingCard = styled.article<{$rarity: string; $delay: number}>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme, $rarity}) => RARITY[$rarity] ?? theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  box-shadow: 0 0 24px -16px ${({theme, $rarity}) => RARITY[$rarity] ?? theme.colors.border};
  animation: 320ms ease both ${enter};
  animation-delay: ${({$delay}) => $delay}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    cursor: pointer;
    ${focusRing};
  }
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.sm};
  padding: ${({theme}) => theme.space.md};
`;

export const Name = styled.strong`
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.md};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Rarity = styled.span<{$rarity: string}>`
  color: ${({theme, $rarity}) => RARITY[$rarity] ?? theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({theme}) => theme.space.sm};

  strong {
    color: ${({theme}) => theme.colors.text};
    font-size: ${({theme}) => theme.fontSizes.lg};
    font-variant-numeric: tabular-nums;
  }

  span {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.xs};
  }
`;

export const Seller = styled.span`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
`;

export const Empty = styled.div`
  padding: ${({theme}) => theme.space.xl};
  text-align: center;
  color: ${({theme}) => theme.colors.textMuted};
  background: ${({theme}) => theme.colors.surface};
  border: 1px dashed ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
`;

export const SaleRow = styled.a`
  display: grid;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: 1fr auto;
  padding: ${({theme}) => `${theme.space.md} ${theme.space.lg}`};

  ${media.down('sm')} {
    grid-template-columns: 1fr;
    row-gap: ${({theme}) => theme.space.xs};
    padding: ${({theme}) => theme.space.md};
  }
  text-decoration: none;
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};

  &:hover {
    border-color: ${({theme}) => theme.colors.primary};
  }

  span {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.sm};
  }

  strong {
    color: ${({theme}) => theme.colors.success};
    font-variant-numeric: tabular-nums;
  }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};

  label {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.sm};
    font-weight: 600;
  }
`;

export const PriceInput = styled.input`
  font: inherit;
  font-size: ${({theme}) => theme.fontSizes.lg};
  font-variant-numeric: tabular-nums;
  color: ${({theme}) => theme.colors.text};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};
  padding: ${({theme}) => theme.space.sm};
  ${focusRing};
`;

export const Picker = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.sm};
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  max-height: 260px;
  overflow-y: auto;
`;

export const Pick = styled.button<{$active: boolean}>`
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: none;
  border: 2px solid
    ${({theme, $active}) => ($active ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({theme}) => theme.radii.md};
  ${focusRing};

  img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
  }
`;

export const Quote = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => theme.space.md};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border-radius: ${({theme}) => theme.radii.md};
  font-size: ${({theme}) => theme.fontSizes.sm};

  div {
    display: flex;
    justify-content: space-between;
  }

  span {
    color: ${({theme}) => theme.colors.textMuted};
  }

  strong {
    font-variant-numeric: tabular-nums;
  }
`;

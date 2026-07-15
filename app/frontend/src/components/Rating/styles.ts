import styled, {css} from 'styled-components';

import {focusRing} from '../../styles';
import {media} from '../../theme';

const PLACE_COLOURS = ['#fbbf24', '#cbd5e1', '#d19a66'];

export const BoardArea = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xl};
`;

export const LegendSlot = styled.div`
  position: absolute;
  top: -15px;
  right: 0;
  z-index: 1;
`;

export const Tabs = styled.div`
  display: inline-flex;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => theme.space.xs};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.pill};
`;

export const Tab = styled.button<{$active: boolean}>`
  cursor: pointer;
  font: inherit;
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 700;
  padding: ${({theme}) => `${theme.space.sm} ${theme.space.lg}`};
  border: 0;
  border-radius: ${({theme}) => theme.radii.pill};
  color: ${({theme, $active}) => ($active ? theme.colors.onPrimary : theme.colors.textMuted)};
  background: ${({theme, $active}) => ($active ? theme.colors.primary : 'transparent')};
  transition: all ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover:not(:disabled) {
    color: ${({theme, $active}) => ($active ? theme.colors.onPrimary : theme.colors.text)};
  }
`;

export const PodiumGrid = styled.div`
  display: grid;
  align-items: end;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(3, 1fr);

  ${media.down('sm')} {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

export const PodiumBlock = styled.div<{$place: number; $you: boolean}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => theme.space.lg};
  padding-top: ${({$place, theme}) => ($place === 0 ? theme.space.xl : theme.space.lg)};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({$place, theme}) => PLACE_COLOURS[$place] ?? theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  text-align: center;

  ${({$place}) =>
    $place === 0 &&
    css`
      transform: translateY(-12px);
      box-shadow: 0 0 32px -12px ${PLACE_COLOURS[0]};
    `};

  ${({$you, theme}) =>
    $you &&
    css`
      background: ${theme.colors.surfaceRaised};
    `};

  span {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.xs};
  }

  strong {
    color: ${({theme}) => theme.colors.accent};
    font-size: ${({theme}) => theme.fontSizes.xs};
  }
`;

export const Crown = styled.span`
  font-size: 28px;
  line-height: 1;
`;

export const Avatar = styled.span<{$address: string}>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({$address}) => {
    const hue = parseInt($address.slice(2, 8), 16) % 360;
    return `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 60) % 360}, 70%, 45%))`;
  }};
`;

export const PodiumName = styled.a`
  color: ${({theme}) => theme.colors.text};
  font-weight: 700;
  font-size: ${({theme}) => theme.fontSizes.sm};
  text-decoration: none;
  ${focusRing};

  &:hover {
    color: ${({theme}) => theme.colors.primaryHover};
  }
`;

export const PodiumValue = styled.strong`
  color: ${({theme}) => theme.colors.text} !important;
  font-size: ${({theme}) => theme.fontSizes.lg};
  font-variant-numeric: tabular-nums;
`;

export const Table = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  overflow: hidden;
`;

export const RowItem = styled.div<{$you: boolean}>`
  display: grid;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: 2.5rem auto 1fr auto;
  padding: ${({theme}) => `${theme.space.md} ${theme.space.lg}`};
  background: ${({theme, $you}) => ($you ? theme.colors.surfaceRaised : theme.colors.surface)};

  ${media.down('sm')} {
    grid-template-columns: 2rem 1fr;
    row-gap: ${({theme}) => theme.space.xs};
    padding: ${({theme}) => theme.space.md};
  }
  border-bottom: 1px solid ${({theme}) => theme.colors.border};

  &:last-child {
    border-bottom: 0;
  }

  ${({$you, theme}) =>
    $you &&
    css`
      box-shadow: inset 3px 0 0 ${theme.colors.primary};
    `};
`;

export const EmptyPodium = styled.div<{$place: number}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({theme}) => theme.space.sm};
  min-height: ${({$place}) => ($place === 0 ? '210px' : '180px')};
  padding: ${({theme}) => theme.space.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px dashed ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};
  opacity: 0.6;
`;

export const Rank = styled.span`
  color: ${({theme}) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
  font-weight: 700;
`;

export const RowMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  a {
    color: ${({theme}) => theme.colors.text};
    font-weight: 700;
    font-size: ${({theme}) => theme.fontSizes.sm};
    text-decoration: none;
  }

  span {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.xs};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const RowValue = styled.strong`
  color: ${({theme}) => theme.colors.success};
  font-variant-numeric: tabular-nums;
`;

export const Empty = styled.div`
  padding: ${({theme}) => theme.space.xl};
  text-align: center;
  color: ${({theme}) => theme.colors.textMuted};
  background: ${({theme}) => theme.colors.surface};
  border: 1px dashed ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
`;

export const EmptyRow = styled.div`
  display: grid;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: 2.5rem 1fr;
  padding: ${({theme}) => `${theme.space.md} ${theme.space.lg}`};
  background: ${({theme}) => theme.colors.surface};
  border-bottom: 1px dashed ${({theme}) => theme.colors.border};
  opacity: 0.45;

  &:last-child {
    border-bottom: 0;
  }

  span {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.sm};
  }
`;

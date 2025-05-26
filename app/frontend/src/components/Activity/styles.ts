import styled, {keyframes} from 'styled-components';

import {media} from '../../theme';

const ROW = 56;
const VISIBLE = 5;

const scroll = keyframes`
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
`;

export const Viewport = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.sm};
`;

export const Track = styled.div`
  position: relative;
  height: ${VISIBLE * ROW}px;
  overflow: hidden;
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  background: ${({theme}) => theme.colors.surface};

  mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 12%,
    #000 88%,
    transparent
  );
`;

export const Marquee = styled.div`
  display: flex;
  flex-direction: column;
  animation: var(--rail-duration, 28s) linear infinite ${scroll};

  ${Track}:hover & {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Item = styled.a`
  display: grid;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: 2rem 1fr auto;
  height: ${ROW}px;
  padding: 0 ${({theme}) => theme.space.lg};

  ${media.down('sm')} {
    gap: ${({theme}) => theme.space.sm};
    padding: 0 ${({theme}) => theme.space.md};
  }
  text-decoration: none;
  border-bottom: 1px solid ${({theme}) => theme.colors.border};
  transition: background ${({theme}) => theme.transitions.fast};

  &:hover {
    background: ${({theme}) => theme.colors.surfaceRaised};
  }
`;

export const Dot = styled.span<{$kind: string}>`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid
    ${({theme, $kind}) =>
      $kind === 'tip'
        ? theme.colors.warning
        : $kind === 'pass'
          ? theme.colors.border
          : theme.colors.primary};
  font-size: 14px;
`;

export const Line = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({theme}) => theme.space.sm};
  min-width: 0;

  strong {
    color: ${({theme}) => theme.colors.text};
    font-size: ${({theme}) => theme.fontSizes.sm};
  }

  span {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.sm};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const Value = styled.strong<{$kind: string}>`
  color: ${({theme, $kind}) => ($kind === 'tip' ? theme.colors.warning : theme.colors.success)};
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const GhostStack = styled.div`
  position: relative;
`;

export const GhostNote = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: ${({theme}) => theme.space.md};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};

  span {
    padding: ${({theme}) => `${theme.space.sm} ${theme.space.md}`};
    background: ${({theme}) => theme.colors.surfaceRaised};
    border: 1px solid ${({theme}) => theme.colors.border};
    border-radius: ${({theme}) => theme.radii.pill};
  }
`;

export const Ghost = styled.div`
  display: grid;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: 2rem 1fr auto;
  height: ${ROW}px;
  padding: 0 ${({theme}) => theme.space.lg};
  border-bottom: 1px dashed ${({theme}) => theme.colors.border};
  opacity: 0.5;

  ${media.down('sm')} {
    gap: ${({theme}) => theme.space.sm};
    padding: 0 ${({theme}) => theme.space.md};
  }
`;

export const GhostDot = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px dashed ${({theme}) => theme.colors.border};
`;

export const GhostBar = styled.span<{$width: string}>`
  width: ${({$width}) => $width};
  height: 10px;
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.surfaceRaised};
`;

export const Empty = styled.div`
  padding: ${({theme}) => theme.space.xl};
  text-align: center;
  color: ${({theme}) => theme.colors.textMuted};
  background: ${({theme}) => theme.colors.surface};
  border: 1px dashed ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
`;

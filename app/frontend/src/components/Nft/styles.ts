import styled, {css, keyframes} from 'styled-components';

import {focusRing} from '../../styles';

const RARITY_COLOURS: Record<string, string> = {
  common: '#9aa4b8',
  rare: '#38bdf8',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

export const Grid = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.lg};
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
`;

export const NftArticle = styled.article<{$rarity?: string}>`
  overflow: hidden;
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid
    ${({theme, $rarity}) =>
      ($rarity && RARITY_COLOURS[$rarity]) || theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  transition:
    transform ${({theme}) => theme.transitions.base},
    box-shadow ${({theme}) => theme.transitions.base};

  ${({$rarity}) =>
    $rarity &&
    RARITY_COLOURS[$rarity] &&
    css`
      box-shadow: 0 0 0 1px ${RARITY_COLOURS[$rarity]}22,
        0 0 24px -14px ${RARITY_COLOURS[$rarity]};
    `};

  &:hover {
    transform: translateY(-4px);
  }
`;

export const CardImage = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: ${({theme}) => theme.colors.surfaceRaised};
`;

export const ImageFallback = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  background: ${({theme}) => theme.colors.surfaceRaised};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.lg};
  font-weight: 700;
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.sm};
  padding: ${({theme}) => theme.space.md};
`;

export const CardName = styled.h3`
  margin: 0;
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.md};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Attributes = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${({theme}) => theme.space.xs};
  margin: 0;
`;

export const Attribute = styled.div`
  display: flex;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => `3px ${theme.space.sm}`};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.surfaceRaised};
  font-size: ${({theme}) => theme.fontSizes.xs};

  dt {
    color: ${({theme}) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    color: ${({theme}) => theme.colors.text};
    font-weight: 700;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  padding: ${({theme}) => theme.space.xxl} ${({theme}) => theme.space.md};
  text-align: center;
  color: ${({theme}) => theme.colors.textMuted};

  img {
    width: 140px;
    opacity: 0.6;
  }
`;

export const ClaimCard = styled.section`
  padding: ${({theme}) => theme.space.lg};
  border-radius: ${({theme}) => theme.radii.lg};
  border: 1px solid ${({theme}) => theme.colors.primary};
  background: linear-gradient(
    135deg,
    ${({theme}) => theme.colors.surface},
    ${({theme}) => theme.colors.surfaceRaised}
  );
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  padding-right: ${({theme}) => theme.space.xl};
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${({theme}) => theme.fontSizes.lg};
`;

export const ModalSubtitle = styled.p`
  margin: ${({theme}) => `${theme.space.sm} 0 0`};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};
  line-height: 1.5;
`;

export const RarityBadge = styled.span<{$rarity: string}>`
  padding: ${({theme}) => `2px ${theme.space.sm}`};
  border: 1px solid ${({$rarity}) => RARITY_COLOURS[$rarity] ?? '#8b93a7'};
  border-radius: ${({theme}) => theme.radii.pill};
  color: ${({$rarity}) => RARITY_COLOURS[$rarity] ?? '#8b93a7'};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const pop = keyframes`
  from { opacity: 0; transform: scale(0.9) rotate(-2deg); }
  60%  { transform: scale(1.02) rotate(1deg); }
  to   { opacity: 1; transform: none; }
`;

export const ModalArt = styled.img<{$reveal: boolean}>`
  display: block;
  width: 100%;
  max-width: 480px;
  margin: ${({theme}) => `${theme.space.md} auto`};
  aspect-ratio: 1;
  border-radius: ${({theme}) => theme.radii.lg};
  background: ${({theme}) => theme.colors.surfaceRaised};
  ${({$reveal}) => $reveal && css`animation: 520ms cubic-bezier(0.2, 0.9, 0.3, 1.3) ${pop};`};
`;

export const ModalLinks = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({theme}) => theme.space.md};
  margin-top: ${({theme}) => theme.space.lg};
  padding-top: ${({theme}) => theme.space.md};
  border-top: 1px solid ${({theme}) => theme.colors.border};

  a {
    color: ${({theme}) => theme.colors.accent};
    font-size: ${({theme}) => theme.fontSizes.sm};
    font-weight: 600;
  }
`;

const enter = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
`;

export const CardTrigger = styled.button<{$delay?: number}>`
  animation: 320ms ease both ${enter};
  animation-delay: ${({$delay}) => $delay ?? 0}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  display: block;
  width: 100%;
  padding: 0;
  cursor: pointer;
  text-align: left;
  background: none;
  border: 0;
  border-radius: ${({theme}) => theme.radii.lg};
  ${focusRing};

  &:hover ${() => NftArticle} {
    transform: translateY(-4px);
    border-color: ${({theme}) => theme.colors.primary};
  }
`;

export const CardRarity = styled.span<{$rarity: string}>`
  color: ${({$rarity}) => RARITY_COLOURS[$rarity] ?? '#8b93a7'};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

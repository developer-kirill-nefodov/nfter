import styled from 'styled-components';

export const Grid = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.lg};
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
`;

export const NftArticle = styled.article`
  overflow: hidden;
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  transition: transform ${({theme}) => theme.transitions.base};

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
  padding: ${({theme}) => `2px ${theme.space.sm}`};
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.surfaceRaised};
  font-size: ${({theme}) => theme.fontSizes.xs};

  dt {
    color: ${({theme}) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
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

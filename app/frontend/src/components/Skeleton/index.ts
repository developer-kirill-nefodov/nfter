import styled, {keyframes} from 'styled-components';

const shimmer = keyframes`
  from { background-position: -420px 0; }
  to   { background-position: 420px 0; }
`;

export const Skeleton = styled.div<{$height?: string; $width?: string; $radius?: string}>`
  width: ${({$width}) => $width ?? '100%'};
  height: ${({$height}) => $height ?? '1rem'};
  border-radius: ${({$radius, theme}) => $radius ?? theme.radii.sm};
  background: linear-gradient(
    90deg,
    ${({theme}) => theme.colors.surface} 25%,
    ${({theme}) => theme.colors.surfaceRaised} 50%,
    ${({theme}) => theme.colors.surface} 75%
  );
  background-size: 840px 100%;
  animation: 1.4s linear infinite ${shimmer};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const SkeletonCard = styled(Skeleton)`
  aspect-ratio: 1;
  height: auto;
  border-radius: ${({theme}) => theme.radii.lg};
`;

export const SkeletonGrid = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.lg};
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
`;

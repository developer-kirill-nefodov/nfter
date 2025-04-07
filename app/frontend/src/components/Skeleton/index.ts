import styled, {keyframes} from 'styled-components';

const shimmer = keyframes`
  from { background-position: -420px 0; }
  to   { background-position: 420px 0; }
`;

/**
 * A placeholder that occupies exactly the space the real thing will.
 *
 * A spinner says "wait"; a skeleton says "wait, and here is where it lands".
 * The difference is that the page does not jump when the answer arrives — which
 * is the whole complaint about things skipping around while you navigate.
 */
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

/** A card-shaped one, for the galleries. */
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

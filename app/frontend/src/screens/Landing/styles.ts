import styled, {keyframes} from 'styled-components';

import {media} from '../../theme';

export const Hero = styled.section`
  display: grid;
  align-items: center;
  gap: ${({theme}) => theme.space.xl};
  grid-template-columns: 1fr auto;
  padding: ${({theme}) => theme.space.xl} 0;

  img {
    border-radius: ${({theme}) => theme.radii.lg};
    box-shadow: ${({theme}) => theme.shadows.lg};
  }

  ${media.down('md')} {
    grid-template-columns: 1fr;

    img {
      justify-self: center;
      width: 220px;
      height: 220px;
    }
  }
`;

export const HeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.md};
  max-width: 34rem;
`;

export const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(32px, 5vw, ${({theme}) => theme.fontSizes.xxl});
  line-height: 1.15;
  background: linear-gradient(
    120deg,
    ${({theme}) => theme.colors.text},
    ${({theme}) => theme.colors.accent}
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

export const Highlight = styled.span`
  align-self: flex-start;
  padding: ${({theme}) => `${theme.space.xs} ${theme.space.md}`};
  border: 1px solid ${({theme}) => theme.colors.primary};
  border-radius: ${({theme}) => theme.radii.pill};
  color: ${({theme}) => theme.colors.primaryHover};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const Stats = styled.section`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  padding: ${({theme}) => theme.space.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
`;

export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  text-align: center;
`;

export const StatValue = styled.strong`
  font-size: ${({theme}) => theme.fontSizes.xl};
  font-variant-numeric: tabular-nums;
  color: ${({theme}) => theme.colors.text};
`;

export const StatLabel = styled.span`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.md};

  a {
    color: ${({theme}) => theme.colors.accent};
    font-size: ${({theme}) => theme.fontSizes.sm};
  }
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${({theme}) => theme.fontSizes.lg};
`;

export const Showcase = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
`;

export const ShowcaseCard = styled.article`
  overflow: hidden;
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  transition: transform ${({theme}) => theme.transitions.base};

  &:hover {
    transform: translateY(-4px);
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
    padding: ${({theme}) => theme.space.sm};
  }

  span {
    color: ${({theme}) => theme.colors.accent};
    font-size: ${({theme}) => theme.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  code {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.xs};
  }
`;

const shimmer = keyframes`
  from { background-position: -400px 0; }
  to   { background-position: 400px 0; }
`;

/** A skeleton, not a spinner: the page keeps its shape while the chain answers. */
export const ShowcaseSkeleton = styled.div`
  aspect-ratio: 1;
  border-radius: ${({theme}) => theme.radii.lg};
  background: linear-gradient(
    90deg,
    ${({theme}) => theme.colors.surface} 25%,
    ${({theme}) => theme.colors.surfaceRaised} 50%,
    ${({theme}) => theme.colors.surface} 75%
  );
  background-size: 800px 100%;
  animation: 1.4s linear infinite ${shimmer};
`;

export const Features = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

export const Feature = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.sm};
  padding: ${({theme}) => theme.space.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};

  p {
    margin: 0;
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.sm};
    line-height: 1.5;
  }
`;

import styled, {createGlobalStyle, css} from 'styled-components';
import {Link} from 'react-router-dom';

import {media} from './theme';

export const AppGlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    min-height: 100%;
  }

  html {
    overflow-x: hidden;
  }

  img, svg, video, canvas {
    max-width: 100%;
  }

  body {
    font-family: 'Nunito', system-ui, sans-serif;
    background: ${({theme}) => theme.colors.background};
    color: ${({theme}) => theme.colors.text};
    -webkit-font-smoothing: antialiased;
  }

  button,
  input,
  select,
  textarea {
    color: inherit;
    font-family: inherit;
  }

  :focus-visible {
    outline: 2px solid ${({theme}) => theme.colors.accent};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export const focusRing = css`
  &:focus-visible {
    outline: 2px solid ${({theme}) => theme.colors.accent};
    outline-offset: 2px;
  }
`;

export const Stack = styled.div<{$gap?: string; $align?: string; $justify?: string}>`
  display: flex;
  flex-direction: column;
  gap: ${({$gap, theme}) => $gap ?? theme.space.md};
  align-items: ${({$align}) => $align ?? 'stretch'};
  justify-content: ${({$justify}) => $justify ?? 'flex-start'};
`;

export const Row = styled.div<{$gap?: string; $align?: string; $justify?: string; $wrap?: boolean}>`
  display: flex;
  flex-direction: row;
  gap: ${({$gap, theme}) => $gap ?? theme.space.md};
  align-items: ${({$align}) => $align ?? 'center'};
  justify-content: ${({$justify}) => $justify ?? 'flex-start'};
  flex-wrap: ${({$wrap}) => ($wrap ? 'wrap' : 'nowrap')};
`;

export const Card = styled.section`
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  box-shadow: ${({theme}) => theme.shadows.md};
  padding: ${({theme}) => theme.space.lg};

  ${media.down('sm')} {
    padding: ${({theme}) => theme.space.md};
  }
`;

export const Title = styled.h1`
  margin: 0;
  font-size: clamp(22px, 5vw, ${({theme}) => theme.fontSizes.xl});
  font-weight: 700;
  overflow-wrap: anywhere;
`;

export const Subtitle = styled.p`
  margin: 0;
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};
`;

export const NavLink = styled(Link)`
  color: ${({theme}) => theme.colors.text};
  font-weight: 600;
  text-decoration: none;
  border-radius: ${({theme}) => theme.radii.sm};
  transition: color ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover {
    color: ${({theme}) => theme.colors.primaryHover};
  }
`;

import styled from 'styled-components';
import {NavLink as RouterNavLink} from 'react-router-dom';

import {focusRing} from '../../styles';
import {media} from '../../theme';

/** Grid rows instead of an empty div: this is what keeps the footer at the bottom. */
export const Shell = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({theme}) => theme.zIndices.header};
  /* Translucent, so the page slides under it instead of butting against it. */
  background: color-mix(in srgb, ${({theme}) => theme.colors.background} 82%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({theme}) => theme.colors.border};
`;

export const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({theme}) => theme.space.lg};
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({theme}) => `${theme.space.sm} ${theme.space.lg}`};
`;

export const Zone = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.xs};
`;

export const NavItem = styled(RouterNavLink)`
  padding: ${({theme}) => `${theme.space.xs} ${theme.space.md}`};
  border-radius: ${({theme}) => theme.radii.pill};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 600;
  text-decoration: none;
  transition: all ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover {
    color: ${({theme}) => theme.colors.text};
    background: ${({theme}) => theme.colors.surface};
  }

  /* Where am I? The old header never said. */
  &.active {
    color: ${({theme}) => theme.colors.text};
    background: ${({theme}) => theme.colors.surfaceRaised};
    box-shadow: inset 0 0 0 1px ${({theme}) => theme.colors.border};
  }
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.sm};
  flex-shrink: 0;

  a {
    text-decoration: none;
  }
`;

export const Burger = styled.button`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 18px;
  color: ${({theme}) => theme.colors.text};
  background: transparent;
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};
  ${focusRing};
`;

export const MobileNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => theme.space.md};
  border-top: 1px solid ${({theme}) => theme.colors.border};

  ${media.up('md')} {
    display: none;
  }
`;

export const Main = styled.main`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({theme}) => theme.space.xl} ${({theme}) => theme.space.lg};
`;

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({theme}) => theme.space.sm};
  padding: ${({theme}) => `${theme.space.lg}`};
  border-top: 1px solid ${({theme}) => theme.colors.border};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};

  a {
    color: inherit;
  }
`;

export const Logo = styled.img`
  height: 32px;
  display: block;
`;

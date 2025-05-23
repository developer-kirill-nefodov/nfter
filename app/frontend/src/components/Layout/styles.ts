import styled from 'styled-components';
import {Link, NavLink as RouterNavLink} from 'react-router-dom';

import {focusRing} from '../../styles';
import {media} from '../../theme';

export const Shell = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  isolation: isolate;
  z-index: ${({theme}) => theme.zIndices.header};
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

  ${media.down('sm')} {
    gap: ${({theme}) => theme.space.sm};
    padding: ${({theme}) => `${theme.space.sm} ${theme.space.md}`};
  }
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
  background: ${({theme}) => theme.colors.background};
  border-top: 1px solid ${({theme}) => theme.colors.border};
  max-height: calc(100dvh - 64px);
  overflow-y: auto;
  overscroll-behavior: contain;

  ${media.up('md')} {
    display: none;
  }
`;

export const MobileTools = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({theme}) => theme.space.sm};
  margin-top: ${({theme}) => theme.space.sm};
  padding-top: ${({theme}) => theme.space.sm};
  border-top: 1px solid ${({theme}) => theme.colors.border};
`;

export const Main = styled.main`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({theme}) => theme.space.xl} ${({theme}) => theme.space.lg};

  ${media.down('sm')} {
    padding: ${({theme}) => theme.space.lg} ${({theme}) => theme.space.md};
  }
`;

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  text-align: center;
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

export const Brand = styled.span`
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.md};
  font-weight: 800;
  letter-spacing: -0.01em;

  ${media.down('sm')} {
    display: none;
  }
`;

export const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.sm};
  text-decoration: none;
  ${focusRing};
`;

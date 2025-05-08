import styled from 'styled-components';

import {media} from '../../theme';

import {focusRing} from '../../styles';

export const AddressPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => `${theme.space.xs} ${theme.space.md}`};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.surfaceRaised};
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

export const Wrapper = styled.div`
  position: relative;
`;

export const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({theme}) => theme.space.sm};
  cursor: pointer;
  font: inherit;
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${({theme}) => theme.colors.text};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.pill};
  padding: ${({theme}) => `6px ${theme.space.md} 6px 6px`};
  transition: border-color ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover {
    border-color: ${({theme}) => theme.colors.primary};
  }
`;

export const Avatar = styled.span<{$address: string}>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({$address}) => {
    const hue = parseInt($address.slice(2, 8), 16) % 360;
    return `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 60) % 360}, 70%, 45%))`;
  }};
`;

export const Balance = styled.strong`
  color: ${({theme}) => theme.colors.accent};

  ${media.down('sm')} {
    display: none;
  }
`;

export const MenuPanel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: ${({theme}) => theme.zIndices.dropdown};
  display: flex;
  flex-direction: column;
  min-width: 15rem;
  padding: ${({theme}) => theme.space.sm};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};
  box-shadow: ${({theme}) => theme.shadows.lg};
`;

export const MenuRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({theme}) => theme.space.sm};
  padding: ${({theme}) => `${theme.space.xs} ${theme.space.sm}`};
  font-size: ${({theme}) => theme.fontSizes.sm};

  span {
    color: ${({theme}) => theme.colors.textMuted};
  }

  code,
  strong {
    font-variant-numeric: tabular-nums;
  }
`;

export const MenuItem = styled.button`
  display: block;
  width: 100%;
  cursor: pointer;
  font: inherit;
  font-size: ${({theme}) => theme.fontSizes.sm};
  text-align: left;
  text-decoration: none;
  color: ${({theme}) => theme.colors.text};
  background: transparent;
  border: 0;
  border-radius: ${({theme}) => theme.radii.sm};
  padding: ${({theme}) => `${theme.space.sm}`};
  ${focusRing};

  &:hover {
    background: ${({theme}) => theme.colors.surface};
  }
`;

export const Danger = styled.button`
  color: ${({theme}) => theme.colors.error};
`;

export const Divider = styled.hr`
  margin: ${({theme}) => `${theme.space.xs} 0`};
  border: 0;
  border-top: 1px solid ${({theme}) => theme.colors.border};
`;

export const Network = styled.strong<{$ok: boolean}>`
  display: inline-flex;
  align-items: center;
  gap: ${({theme}) => theme.space.xs};
  color: ${({theme, $ok}) => ($ok ? theme.colors.success : theme.colors.warning)};

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
`;

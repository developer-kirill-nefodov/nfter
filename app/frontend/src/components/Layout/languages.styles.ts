import styled from 'styled-components';

import {focusRing} from '../../styles';

export const Wrapper = styled.div`
  position: relative;
`;

export const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({theme}) => theme.space.sm};
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  font-size: ${({theme}) => theme.fontSizes.sm};
  color: ${({theme}) => theme.colors.text};
  background: transparent;
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};
  padding: ${({theme}) => `${theme.space.sm} ${theme.space.md}`};
  transition: background ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover {
    background: ${({theme}) => theme.colors.surfaceRaised};
  }
`;

export const Menu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: ${({theme}) => theme.zIndices.dropdown};
  display: flex;
  flex-direction: column;
  min-width: 10rem;
  padding: ${({theme}) => theme.space.xs};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};
  box-shadow: ${({theme}) => theme.shadows.lg};
`;

export const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.sm};
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: ${({theme}) => theme.colors.textMuted};
  background: transparent;
  border: 0;
  border-radius: ${({theme}) => theme.radii.sm};
  padding: ${({theme}) => `${theme.space.sm} ${theme.space.md}`};
  ${focusRing};

  &:hover,
  &[aria-selected='true'] {
    background: ${({theme}) => theme.colors.surface};
    color: ${({theme}) => theme.colors.text};
  }
`;

export const Flag = styled.span`
  font-size: 1.2em;
  line-height: 1;
`;

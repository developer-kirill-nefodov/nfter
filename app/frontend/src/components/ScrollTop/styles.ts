import styled from 'styled-components';

import {focusRing} from '../../styles';

export const Fab = styled.button<{$shown: boolean}>`
  position: fixed;
  left: ${({theme}) => theme.space.lg};
  bottom: ${({theme}) => theme.space.lg};
  z-index: ${({theme}) => theme.zIndices.dropdown};
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  cursor: pointer;
  color: ${({theme}) => theme.colors.text};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: 50%;
  box-shadow: ${({theme}) => theme.shadows.md};
  opacity: ${({$shown}) => ($shown ? 1 : 0)};
  transform: translateY(${({$shown}) => ($shown ? '0' : '12px')});
  pointer-events: ${({$shown}) => ($shown ? 'auto' : 'none')};
  transition:
    opacity ${({theme}) => theme.transitions.base},
    transform ${({theme}) => theme.transitions.base},
    border-color ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover {
    border-color: ${({theme}) => theme.colors.primary};
  }
`;

import styled, {css, keyframes} from 'styled-components';

import {focusRing} from '../../styles';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const RefreshTrigger = styled.button`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  cursor: pointer;
  color: ${({theme}) => theme.colors.textMuted};
  background: transparent;
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};
  transition: all ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover:not(:disabled) {
    color: ${({theme}) => theme.colors.text};
    background: ${({theme}) => theme.colors.surfaceRaised};
    border-color: ${({theme}) => theme.colors.primary};
  }

  &:disabled {
    cursor: progress;
  }
`;

export const RefreshIcon = styled.svg<{$spinning: boolean}>`
  width: 18px;
  height: 18px;

  ${({$spinning}) =>
    $spinning &&
    css`
      animation: 900ms linear infinite ${spin};
    `};
`;

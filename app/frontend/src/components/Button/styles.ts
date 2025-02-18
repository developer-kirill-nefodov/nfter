import styled, {css, keyframes} from 'styled-components';

import {focusRing} from '../../styles';

export type IButtonVariant = 'primary' | 'ghost' | 'danger';

const ripple = keyframes`
  from { transform: scale(0); opacity: 0.45; }
  to   { transform: scale(30); opacity: 0; }
`;

const variants = {
  primary: css`
    background: ${({theme}) => theme.colors.primary};
    color: ${({theme}) => theme.colors.onPrimary};
    border-color: transparent;

    &:hover:not(:disabled) {
      background: ${({theme}) => theme.colors.primaryHover};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({theme}) => theme.colors.text};
    border-color: ${({theme}) => theme.colors.border};

    &:hover:not(:disabled) {
      background: ${({theme}) => theme.colors.surfaceRaised};
    }
  `,
  danger: css`
    background: transparent;
    color: ${({theme}) => theme.colors.error};
    border-color: ${({theme}) => theme.colors.border};

    &:hover:not(:disabled) {
      background: ${({theme}) => theme.colors.surfaceRaised};
    }
  `,
} satisfies Record<IButtonVariant, ReturnType<typeof css>>;

export const StyledButton = styled.button<{$variant: IButtonVariant; $fullWidth: boolean}>`
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid;
  border-radius: ${({theme}) => theme.radii.md};
  padding: ${({theme}) => `${theme.space.sm} ${theme.space.lg}`};
  font: inherit;
  font-weight: 700;
  font-size: ${({theme}) => theme.fontSizes.sm};
  width: ${({$fullWidth}) => ($fullWidth ? '100%' : 'auto')};
  transition: background ${({theme}) => theme.transitions.fast};
  ${({$variant}) => variants[$variant]};
  ${focusRing};

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const RippleSpan = styled.span<{$left: number; $top: number}>`
  position: absolute;
  left: ${({$left}) => $left}px;
  top: ${({$top}) => $top}px;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  background: currentColor;
  animation: 600ms ease-out forwards ${ripple};
  pointer-events: none;
`;

export const ButtonContent = styled.span`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({theme}) => theme.space.sm};
`;

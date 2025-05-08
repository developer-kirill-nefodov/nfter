import styled, {keyframes} from 'styled-components';

import {focusRing} from '../../styles';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: none; }
`;

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: ${({theme}) => theme.space.md};
  background: rgba(6, 8, 13, 0.72);
  backdrop-filter: blur(6px);
  animation: 160ms ease ${fadeIn};
  overflow-y: auto;
`;

export const Dialog = styled.div`
  position: relative;
  width: min(640px, 100%);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: ${({theme}) => theme.space.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  box-shadow: ${({theme}) => theme.shadows.lg};
  animation: 200ms ease ${riseIn};
  ${focusRing};
`;

export const CloseButton = styled.button`
  position: absolute;
  top: ${({theme}) => theme.space.sm};
  right: ${({theme}) => theme.space.sm};
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  color: ${({theme}) => theme.colors.textMuted};
  background: transparent;
  border: 1px solid transparent;
  border-radius: ${({theme}) => theme.radii.sm};
  ${focusRing};

  &:hover {
    color: ${({theme}) => theme.colors.text};
    background: ${({theme}) => theme.colors.surfaceRaised};
  }
`;

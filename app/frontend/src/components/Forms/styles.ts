import styled from 'styled-components';

import {focusRing} from '../../styles';
import {media} from '../../theme';

export const FormCard = styled.div`
  width: 100%;
  max-width: 420px;

  ${media.down('sm')} {
    max-width: none;
  }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
`;

export const Label = styled.label`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 600;
`;

export const InputWrap = styled.div`
  position: relative;
  display: flex;
`;

export const Reveal = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 0 ${({theme}) => theme.space.sm};
  background: none;
  border: 0;
  color: ${({theme}) => theme.colors.textMuted};
  cursor: pointer;
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: color ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &:hover {
    color: ${({theme}) => theme.colors.accent};
  }
`;

export const Input = styled.input<{$invalid: boolean; $padded?: boolean}>`
  flex: 1;
  padding-right: ${({theme, $padded}) => ($padded ? theme.space.xxl : theme.space.sm)};
  font: inherit;
  color: ${({theme}) => theme.colors.text};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid
    ${({theme, $invalid}) => ($invalid ? theme.colors.error : theme.colors.border)};
  border-radius: ${({theme}) => theme.radii.md};
  padding: ${({theme}) => theme.space.sm};
  transition: border-color ${({theme}) => theme.transitions.fast};
  ${focusRing};

  &::placeholder {
    color: ${({theme}) => theme.colors.textMuted};
  }
`;

export const FieldError = styled.span`
  color: ${({theme}) => theme.colors.error};
  font-size: ${({theme}) => theme.fontSizes.xs};
  min-height: 1em;
`;

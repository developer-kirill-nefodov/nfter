import styled from 'styled-components';

import {focusRing} from '../../styles';
import {media} from '../../theme';

/**
 * Centred by the page's flex column, not by `position: absolute; top: 30%`,
 * which is what used to drop the form on top of the header on short viewports.
 */
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

export const Input = styled.input<{$invalid: boolean}>`
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

/** In normal flow under the input — the old one was absolutely positioned over the label. */
export const FieldError = styled.span`
  color: ${({theme}) => theme.colors.error};
  font-size: ${({theme}) => theme.fontSizes.xs};
  min-height: 1em;
`;

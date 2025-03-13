import styled from 'styled-components';

import {focusRing} from '../../styles';

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.sm};

  label {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.sm};
    font-weight: 600;
  }
`;

export const Amount = styled.input`
  font: inherit;
  font-size: ${({theme}) => theme.fontSizes.lg};
  font-variant-numeric: tabular-nums;
  color: ${({theme}) => theme.colors.text};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};
  padding: ${({theme}) => theme.space.sm};
  ${focusRing};

  &::placeholder {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.md};
  }
`;

export const Presets = styled.div`
  display: flex;
  gap: ${({theme}) => theme.space.sm};
  flex-wrap: wrap;
`;

export const Preset = styled.button<{$active: boolean}>`
  cursor: pointer;
  font: inherit;
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({theme, $active}) => ($active ? theme.colors.onPrimary : theme.colors.textMuted)};
  background: ${({theme, $active}) => ($active ? theme.colors.primary : 'transparent')};
  border: 1px solid ${({theme, $active}) => ($active ? 'transparent' : theme.colors.border)};
  border-radius: ${({theme}) => theme.radii.pill};
  padding: ${({theme}) => `${theme.space.xs} ${theme.space.md}`};
  ${focusRing};

  &:hover:not(:disabled) {
    color: ${({theme}) => theme.colors.text};
  }
`;

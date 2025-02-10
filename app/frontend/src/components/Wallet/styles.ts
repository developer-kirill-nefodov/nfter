import styled from 'styled-components';

export const AddressPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => `${theme.space.xs} ${theme.space.md}`};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.surfaceRaised};
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.sm};
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({theme}) => theme.colors.success};
  }
`;

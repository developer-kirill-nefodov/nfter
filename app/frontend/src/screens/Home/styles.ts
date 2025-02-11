import styled from 'styled-components';

export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  min-width: 120px;
`;

export const StatLabel = styled.span`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const StatValue = styled.strong`
  font-size: ${({theme}) => theme.fontSizes.lg};
  font-variant-numeric: tabular-nums;
`;

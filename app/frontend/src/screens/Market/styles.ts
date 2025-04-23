import styled from 'styled-components';

export const Earnings = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({theme}) => theme.space.md};
  padding: ${({theme}) => theme.space.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.success};
  border-radius: ${({theme}) => theme.radii.lg};

  strong {
    color: ${({theme}) => theme.colors.success};
    font-size: ${({theme}) => theme.fontSizes.xl};
    font-variant-numeric: tabular-nums;
  }
`;

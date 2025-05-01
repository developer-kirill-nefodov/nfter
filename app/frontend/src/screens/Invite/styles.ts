import styled from 'styled-components';

export const CodeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({theme}) => theme.space.md};
`;

export const Code = styled.strong`
  padding: ${({theme}) => `${theme.space.sm} ${theme.space.lg}`};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border: 1px dashed ${({theme}) => theme.colors.primary};
  border-radius: ${({theme}) => theme.radii.md};
  color: ${({theme}) => theme.colors.accent};
  font-size: ${({theme}) => theme.fontSizes.lg};
  letter-spacing: 0.12em;
`;

export const Stats = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  padding: ${({theme}) => theme.space.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
`;

export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  text-align: center;
`;

export const StatValue = styled.strong`
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.xl};
  font-variant-numeric: tabular-nums;
`;

export const StatLabel = styled.span`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const Earned = styled.div`
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

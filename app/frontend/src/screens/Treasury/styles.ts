import styled from 'styled-components';

export const Total = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => theme.space.xl};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.primary};
  border-radius: ${({theme}) => theme.radii.lg};

  strong {
    color: ${({theme}) => theme.colors.text};
    font-size: ${({theme}) => theme.fontSizes.xxl};
    font-variant-numeric: tabular-nums;
  }

  a {
    color: ${({theme}) => theme.colors.accent};
  }
`;

export const Line = styled.div<{$muted?: boolean}>`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({theme}) => theme.space.md};
  padding-bottom: ${({theme}) => theme.space.sm};
  border-bottom: 1px solid ${({theme}) => theme.colors.border};
  opacity: ${({$muted}) => ($muted ? 0.6 : 1)};

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  span {
    color: ${({theme}) => theme.colors.textMuted};
    font-size: ${({theme}) => theme.fontSizes.sm};
  }

  strong {
    color: ${({theme}) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
`;

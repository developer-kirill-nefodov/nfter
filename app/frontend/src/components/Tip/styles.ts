import styled from 'styled-components';

export const Entry = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => theme.space.md};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.md};

  a {
    color: ${({theme}) => theme.colors.accent};
    font-weight: 700;
    font-size: ${({theme}) => theme.fontSizes.sm};
  }
`;

export const Amount = styled.strong`
  color: ${({theme}) => theme.colors.success};
  font-variant-numeric: tabular-nums;
`;

export const Message = styled.p`
  margin: 0;
  color: ${({theme}) => theme.colors.text};
  font-style: italic;
`;

export const EmptyFeed = styled.div`
  padding: ${({theme}) => theme.space.xl};
  text-align: center;
  color: ${({theme}) => theme.colors.textMuted};
  background: ${({theme}) => theme.colors.surface};
  border: 1px dashed ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
`;

export const Medal = styled.span`
  font-size: ${({theme}) => theme.fontSizes.lg};
  min-width: 2rem;
`;

/** The signed-in user's own row, so they can find themselves at a glance. */
export const You = styled(Entry)`
  border-color: ${({theme}) => theme.colors.primary};
  background: ${({theme}) => theme.colors.surfaceRaised};
`;

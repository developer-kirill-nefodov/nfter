import styled from 'styled-components';

/** Grid rows instead of an empty div: this is what keeps the footer at the bottom. */
export const Shell = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({theme}) => theme.zIndices.header};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({theme}) => theme.space.md};
  padding: ${({theme}) => `${theme.space.sm} ${theme.space.lg}`};
  background: ${({theme}) => theme.colors.background};
  border-bottom: 1px solid ${({theme}) => theme.colors.border};
`;

export const Main = styled.main`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({theme}) => theme.space.xl} ${({theme}) => theme.space.lg};
`;

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({theme}) => theme.space.sm};
  padding: ${({theme}) => `${theme.space.lg}`};
  border-top: 1px solid ${({theme}) => theme.colors.border};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};

  a {
    color: inherit;
  }
`;

export const Logo = styled.img`
  height: 32px;
  display: block;
`;

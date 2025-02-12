import styled from 'styled-components';

import {Row} from '../../styles';

export const AuthShell = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({theme}) => theme.space.xl} 0;
`;

export const FormActions = styled(Row)`
  justify-content: space-between;
  gap: ${({theme}) => theme.space.md};
  margin-top: ${({theme}) => theme.space.sm};
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
  text-transform: uppercase;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({theme}) => theme.colors.border};
  }
`;

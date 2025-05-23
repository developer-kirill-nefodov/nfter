import styled from 'styled-components';

export const Track = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  overflow: hidden;
`;

export const Bar = styled.span`
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: 0 50%;
  background: linear-gradient(
    90deg,
    ${({theme}) => theme.colors.primary},
    ${({theme}) => theme.colors.accent}
  );
`;

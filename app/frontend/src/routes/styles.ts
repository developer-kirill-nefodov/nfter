import styled, {keyframes} from 'styled-components';

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
`;

export const Fade = styled.div`
  animation: 260ms cubic-bezier(0.2, 0.8, 0.3, 1) ${rise};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const PageSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.lg};
  padding: ${({theme}) => theme.space.md} 0;
`;

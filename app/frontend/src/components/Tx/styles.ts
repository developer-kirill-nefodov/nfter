import styled, {css} from 'styled-components';

type ITone = 'info' | 'success' | 'error';

const tones = {
  info: css`
    border-color: ${({theme}) => theme.colors.primary};
  `,
  success: css`
    border-color: ${({theme}) => theme.colors.success};
  `,
  error: css`
    border-color: ${({theme}) => theme.colors.error};
  `,
} satisfies Record<ITone, ReturnType<typeof css>>;

export const Panel = styled.aside<{$tone: ITone}>`
  position: fixed;
  right: ${({theme}) => theme.space.lg};
  bottom: ${({theme}) => theme.space.lg};
  z-index: ${({theme}) => theme.zIndices.toast};
  width: min(360px, calc(100vw - 32px));
  max-width: 100%;
  padding: ${({theme}) => theme.space.md};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid;
  border-left-width: 4px;
  border-radius: ${({theme}) => theme.radii.md};
  box-shadow: ${({theme}) => theme.shadows.lg};
  ${({$tone}) => tones[$tone]};

  a {
    color: ${({theme}) => theme.colors.accent};
    font-size: ${({theme}) => theme.fontSizes.sm};
  }
`;

export const Steps = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Step = styled.li<{$state: 'todo' | 'active' | 'done'}>`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.sm};
  font-size: ${({theme}) => theme.fontSizes.sm};
  color: ${({theme, $state}) =>
    $state === 'todo' ? theme.colors.textMuted : theme.colors.text};
  font-weight: ${({$state}) => ($state === 'active' ? 700 : 400)};

  &::before {
    content: ${({$state}) => ($state === 'done' ? "'✓'" : "'•'")};
    color: ${({theme, $state}) =>
      $state === 'done'
        ? theme.colors.success
        : $state === 'active'
          ? theme.colors.primary
          : theme.colors.border};
  }
`;

import styled from 'styled-components';

import {Row} from '../../styles';
import {media} from '../../theme';

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

export const Shell = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: ${({theme}) => theme.space.xxl};
  padding: ${({theme}) => theme.space.xl} 0;

  ${media.down('md')} {
    grid-template-columns: 1fr;
    gap: ${({theme}) => theme.space.xl};
  }
`;

export const Aside = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.md};

  /* On a phone the form is what you came for; the pitch is not worth a scroll. */
  ${media.down('sm')} {
    display: none;
  }
`;

export const Scene = styled.div`
  align-self: flex-start;
  padding: ${({theme}) => theme.space.lg};
  background: radial-gradient(
    120% 120% at 20% 0%,
    ${({theme}) => theme.colors.surfaceRaised},
    ${({theme}) => theme.colors.surface}
  );
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};
  box-shadow: ${({theme}) => theme.shadows.md};
`;

export const Grid = styled.div`
  display: grid;
  gap: 6px;
  width: 168px;
  height: 168px;
`;

export const Cell = styled.span<{$on: boolean}>`
  border-radius: ${({theme}) => theme.radii.sm};
  background: ${({theme, $on}) => ($on ? theme.colors.primary : theme.colors.border)};
  opacity: ${({$on}) => ($on ? 1 : 0.35)};
  transition:
    background ${({theme}) => theme.transitions.base},
    opacity ${({theme}) => theme.transitions.base};
`;

export const Brand = styled.h2`
  margin: 0;
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.xxl};
  letter-spacing: -0.02em;
`;

export const Pitch = styled.p`
  margin: 0;
  max-width: 44ch;
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.md};
  line-height: 1.6;
`;

export const Bullets = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Bullet = styled.li`
  display: flex;
  align-items: baseline;
  gap: ${({theme}) => theme.space.sm};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};

  &::before {
    content: '';
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({theme}) => theme.colors.accent};
  }
`;

export const InviteNote = styled.p`
  margin: 0;
  padding: ${({theme}) => theme.space.sm} ${({theme}) => theme.space.md};
  align-self: flex-start;
  background: ${({theme}) => theme.colors.surface};
  border: 1px dashed ${({theme}) => theme.colors.primary};
  border-radius: ${({theme}) => theme.radii.md};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.sm};

  strong {
    color: ${({theme}) => theme.colors.accent};
    letter-spacing: 0.08em;
  }
`;

export const Slot = styled.div`
  display: flex;
  justify-content: center;
`;

/** A quiet way in for a reviewer who has no intention of inventing a password. */
export const Demo = styled.button`
  align-self: flex-start;
  padding: 0;
  background: none;
  border: 0;
  border-bottom: 1px dashed ${({theme}) => theme.colors.border};
  color: ${({theme}) => theme.colors.textMuted};
  cursor: pointer;
  font-size: ${({theme}) => theme.fontSizes.xs};
  transition: color ${({theme}) => theme.transitions.fast};

  &:hover {
    color: ${({theme}) => theme.colors.accent};
  }
`;

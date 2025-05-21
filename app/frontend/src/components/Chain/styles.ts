import styled, {css, keyframes} from 'styled-components';

import {media} from '../../theme';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  70% { transform: scale(2.2); opacity: 0; }
  100% { transform: scale(2.2); opacity: 0; }
`;

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.md};
  height: 100%;
  padding: ${({theme}) => theme.space.lg};
  background: ${({theme}) => theme.colors.surface};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: ${({theme}) => theme.radii.lg};

  ${media.down('sm')} {
    padding: ${({theme}) => theme.space.md};
  }
`;

export const PanelHead = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({theme}) => theme.space.md};
`;

export const PanelTitle = styled.h3`
  margin: 0;
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.md};
`;

export const Live = styled.span<{$online: boolean}>`
  display: inline-flex;
  align-items: center;
  gap: ${({theme}) => theme.space.sm};
  color: ${({theme, $online}) => ($online ? theme.colors.success : theme.colors.error)};
  font-size: ${({theme}) => theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.08em;

  &::before {
    content: '';
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;

    ${({$online}) =>
      $online &&
      css`
        box-shadow: 0 0 0 0 currentColor;
        animation: ${pulse} 2s ease-out infinite;
      `};
  }
`;

export const Metrics = styled.dl`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  align-content: start;
  flex: 1;
  margin: 0;

  ${media.down('sm')} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const Metric = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  min-width: 0;
`;

export const MetricLabel = styled.dt`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const MetricValue = styled.dd`
  margin: 0;
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.lg};
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
`;

export const Rows = styled.ul`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${({theme}) => theme.space.sm};
  flex: 1;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const RowItem = styled.li`
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: ${({theme}) => theme.space.md};
  padding-bottom: ${({theme}) => theme.space.sm};
  border-bottom: 1px solid ${({theme}) => theme.colors.border};
  font-size: ${({theme}) => theme.fontSizes.sm};

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  ${media.down('sm')} {
    grid-template-columns: 1fr auto;
    row-gap: ${({theme}) => theme.space.xs};
  }
`;

export const RowName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({theme}) => theme.colors.text};
  font-weight: 600;
`;

export const RowAddress = styled.a`
  white-space: nowrap;
  color: ${({theme}) => theme.colors.accent};
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: ${({theme}) => theme.fontSizes.xs};
`;

export const Tag = styled.span<{$warn?: boolean}>`
  padding: 2px 8px;
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.surfaceRaised};
  color: ${({theme, $warn}) => ($warn ? theme.colors.warning : theme.colors.textMuted)};
  font-size: ${({theme}) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const Bars = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  gap: ${({theme}) => theme.space.md};
`;

export const BarRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
`;

export const BarHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({theme}) => theme.space.sm};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};

  strong {
    color: ${({theme}) => theme.colors.text};
    font-size: ${({theme}) => theme.fontSizes.sm};
  }
`;

export const BarTrack = styled.div`
  height: 8px;
  border-radius: ${({theme}) => theme.radii.pill};
  background: ${({theme}) => theme.colors.surfaceRaised};
  overflow: hidden;
`;

export const BarFill = styled.div<{$percent: number; $color: string}>`
  width: ${({$percent}) => `${String(Math.min(100, Math.max(2, $percent)))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({$color}) => $color};
  transition: width ${({theme}) => theme.transitions.base};
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${({theme}) => theme.space.md};
  flex: 1;
`;

export const Split = styled.div`
  display: flex;
  height: 12px;
  border-radius: ${({theme}) => theme.radii.pill};
  overflow: hidden;
`;

export const SplitPart = styled.span<{$percent: number; $color: string}>`
  width: ${({$percent}) => `${String($percent)}%`};
  background: ${({$color}) => $color};
`;

export const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({theme}) => theme.space.md};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const LegendItem = styled.li<{$color: string}>`
  display: flex;
  align-items: center;
  gap: ${({theme}) => theme.space.xs};
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};

  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: ${({$color}) => $color};
  }
`;

export const PanelGrid = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.lg};
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  align-items: stretch;

  ${media.down('sm')} {
    grid-template-columns: 1fr;
  }
`;

export const Notes = styled.div`
  display: grid;
  gap: ${({theme}) => theme.space.md};
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

export const Note = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.space.xs};
  padding: ${({theme}) => theme.space.md};
  background: ${({theme}) => theme.colors.surfaceRaised};
  border-radius: ${({theme}) => theme.radii.md};
`;

export const NoteTitle = styled.strong`
  color: ${({theme}) => theme.colors.text};
  font-size: ${({theme}) => theme.fontSizes.sm};
`;

export const NoteBody = styled.span`
  color: ${({theme}) => theme.colors.textMuted};
  font-size: ${({theme}) => theme.fontSizes.xs};
  line-height: 1.6;
`;

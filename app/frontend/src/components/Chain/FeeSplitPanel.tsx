import {useTranslation} from 'react-i18next';
import {useTheme} from 'styled-components';

import {useChainStatus} from '../../hooks/useChainStatus';
import {splitOf} from '../../utils/economics';

import {
  Body,
  Legend,
  LegendItem,
  Panel,
  PanelHead,
  PanelTitle,
  Split,
  SplitPart,
} from './styles';

interface IFeeSplitPanel {
  mode: 'sale' | 'mint';
}

const FeeSplitPanel = ({mode}: IFeeSplitPanel) => {
  const {t} = useTranslation();
  const theme = useTheme();
  const {status} = useChainStatus();

  const split = splitOf(mode, status?.feeBps ?? 250, status?.referralBps ?? 1_000);

  const parts = [
    ...(mode === 'sale'
      ? [{key: 'seller', percent: split.seller, color: theme.colors.success}]
      : []),
    {key: 'treasury', percent: split.treasury, color: theme.colors.primary},
    {key: 'referrer', percent: split.referrer, color: theme.colors.accent},
  ];

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>{t(mode === 'sale' ? 'chain.saleSplit' : 'chain.mintSplit')}</PanelTitle>
      </PanelHead>

      <Body>
        <Split>
          {parts.map((part) => (
            <SplitPart key={part.key} $percent={part.percent} $color={part.color} />
          ))}
        </Split>

        <Legend>
          {parts.map((part) => (
            <LegendItem key={part.key} $color={part.color}>
              {t(`chain.${part.key}`)} · {part.percent.toFixed(2)}%
            </LegendItem>
          ))}
        </Legend>
      </Body>
    </Panel>
  );
};

export default FeeSplitPanel;

import {useTranslation} from 'react-i18next';
import {useTheme} from 'styled-components';

import {useChainStatus} from '../../hooks/useChainStatus';

import {
  Legend,
  LegendItem,
  Panel,
  PanelHead,
  PanelTitle,
  Split,
  SplitPart,
} from './styles';

const BPS = 10_000;

interface IFeeSplitPanel {
  mode: 'sale' | 'mint';
}

const FeeSplitPanel = ({mode}: IFeeSplitPanel) => {
  const {t} = useTranslation();
  const theme = useTheme();
  const {status} = useChainStatus();

  const feeBps = status?.feeBps ?? 250;
  const referralBps = status?.referralBps ?? 1_000;

  const feePercent = mode === 'sale' ? (feeBps / BPS) * 100 : 100;
  const referralPercent = (feePercent * referralBps) / BPS;
  const treasuryPercent = feePercent - referralPercent;
  const sellerPercent = 100 - feePercent;

  const parts = [
    ...(mode === 'sale'
      ? [{key: 'seller', percent: sellerPercent, color: theme.colors.success}]
      : []),
    {key: 'treasury', percent: treasuryPercent, color: theme.colors.primary},
    {key: 'referrer', percent: referralPercent, color: theme.colors.accent},
  ];

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>{t(mode === 'sale' ? 'chain.saleSplit' : 'chain.mintSplit')}</PanelTitle>
      </PanelHead>

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
    </Panel>
  );
};

export default FeeSplitPanel;

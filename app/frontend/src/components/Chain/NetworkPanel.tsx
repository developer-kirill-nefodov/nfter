import {useTranslation} from 'react-i18next';

import {useChainStatus} from '../../hooks/useChainStatus';
import {CHAIN_NAME} from '../../web3/wallet';

import {Live, Metric, MetricLabel, MetricValue, Metrics, Panel, PanelHead, PanelTitle} from './styles';

const NetworkPanel = () => {
  const {t} = useTranslation();
  const {status} = useChainStatus();

  const lag = status ? Math.max(...status.contracts.map((item) => item.lag), 0) : 0;

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>{t('chain.title')}</PanelTitle>
        <Live $online={Boolean(status?.online)}>
          {t(status?.online ? 'chain.live' : 'chain.offline')}
        </Live>
      </PanelHead>

      <Metrics>
        <Metric>
          <MetricLabel>{t('chain.network')}</MetricLabel>
          <MetricValue>{CHAIN_NAME}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('chain.chainId')}</MetricLabel>
          <MetricValue>{status?.chainId ?? '—'}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('chain.block')}</MetricLabel>
          <MetricValue>{status ? status.blockNumber.toLocaleString() : '—'}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('chain.gas')}</MetricLabel>
          <MetricValue>{status ? `${Number(status.gasGwei).toFixed(2)} gwei` : '—'}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('chain.indexerLag')}</MetricLabel>
          <MetricValue>{status ? t('chain.blocks', {count: lag}) : '—'}</MetricValue>
        </Metric>
      </Metrics>
    </Panel>
  );
};

export default NetworkPanel;

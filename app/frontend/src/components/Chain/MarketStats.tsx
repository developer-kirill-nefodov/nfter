import {useTranslation} from 'react-i18next';

import {useStoreSelector} from '../../store/hooks';
import {bookStats} from '../../utils/economics';

import {Metric, MetricLabel, MetricValue, Metrics, Panel, PanelHead, PanelTitle} from './styles';

const MarketStats = () => {
  const {t} = useTranslation();
  const book = useStoreSelector((state) => state.market.book);

  const {listed, floor, sold, volume, fees} = bookStats(book?.listings ?? [], book?.sales ?? []);

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>{t('market.book')}</PanelTitle>
      </PanelHead>

      <Metrics>
        <Metric>
          <MetricLabel>{t('market.listed')}</MetricLabel>
          <MetricValue>{listed}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('market.floor')}</MetricLabel>
          <MetricValue>{floor === null ? '—' : `${floor.toFixed(3)} Ξ`}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('market.sold')}</MetricLabel>
          <MetricValue>{sold}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('market.volume')}</MetricLabel>
          <MetricValue>{volume.toFixed(3)} Ξ</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('market.feesPaid')}</MetricLabel>
          <MetricValue>{fees.toFixed(4)} Ξ</MetricValue>
        </Metric>
      </Metrics>
    </Panel>
  );
};

export default MarketStats;

import {useTranslation} from 'react-i18next';

import {useStoreSelector} from '../../store/hooks';

import {Metric, MetricLabel, MetricValue, Metrics, Panel, PanelHead, PanelTitle} from './styles';

const MarketStats = () => {
  const {t} = useTranslation();
  const book = useStoreSelector((state) => state.market.book);

  const listings = book?.listings ?? [];
  const sales = book?.sales ?? [];

  const floor = listings.reduce<number | null>((lowest, item) => {
    const price = Number(item.priceEth);

    return lowest === null || price < lowest ? price : lowest;
  }, null);

  const volume = sales.reduce((total, sale) => total + Number(sale.priceEth), 0);
  const fees = sales.reduce((total, sale) => total + Number(sale.feeEth), 0);

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>{t('market.book')}</PanelTitle>
      </PanelHead>

      <Metrics>
        <Metric>
          <MetricLabel>{t('market.listed')}</MetricLabel>
          <MetricValue>{listings.length}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('market.floor')}</MetricLabel>
          <MetricValue>{floor === null ? '—' : `${floor.toFixed(3)} Ξ`}</MetricValue>
        </Metric>

        <Metric>
          <MetricLabel>{t('market.sold')}</MetricLabel>
          <MetricValue>{sales.length}</MetricValue>
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

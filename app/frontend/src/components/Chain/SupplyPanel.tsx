import {useTranslation} from 'react-i18next';
import {useTheme} from 'styled-components';

import {useChainStatus} from '../../hooks/useChainStatus';

import {BarFill, BarHead, BarRow, BarTrack, Bars, Panel, PanelHead, PanelTitle} from './styles';

const SupplyPanel = () => {
  const {t} = useTranslation();
  const theme = useTheme();
  const {status} = useChainStatus();

  const palette = [
    theme.colors.rarity.common,
    theme.colors.rarity.rare,
    theme.colors.rarity.epic,
    theme.colors.rarity.legendary,
  ];

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>{t('chain.supply')}</PanelTitle>
      </PanelHead>

      <Bars>
        {(status?.tiers ?? []).map((tier) => (
          <BarRow key={tier.tier}>
            <BarHead>
              <strong>{tier.name}</strong>
              <span>
                {tier.minted}/{tier.cap} · {Number(tier.priceEth).toFixed(3)} Ξ
              </span>
            </BarHead>

            <BarTrack>
              <BarFill
                $percent={tier.cap === 0 ? 0 : (tier.minted / tier.cap) * 100}
                $color={palette[tier.tier] ?? theme.colors.primary}
              />
            </BarTrack>
          </BarRow>
        ))}
      </Bars>
    </Panel>
  );
};

export default SupplyPanel;

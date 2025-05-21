import {useEffect, type CSSProperties} from 'react';
import {useTranslation} from 'react-i18next';

import {fetchActivityRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Subtitle} from '../../styles';
import {explorerTx} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {
  Dot,
  Ghost,
  GhostBar,
  GhostDot,
  Item,
  Line,
  Marquee,
  Track,
  Value,
  Viewport,
} from './styles';

const ICONS = {artifact: '🎨', pass: '🎟️', tip: '💛'} as const;

const Activity = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const items = useStoreSelector((state) => state.stats.activity);

  useEffect(() => {
    dispatch(fetchActivityRequest());
  }, [dispatch]);

  if (items.length === 0) {
    return (
      <Viewport>
        <Track>
          {Array.from({length: 5}, (_, index) => (
            <Ghost key={index}>
              <GhostDot />
              <GhostBar $width={`${String(45 + ((index * 13) % 35))}%`} />
              <GhostBar $width="48px" />
            </Ghost>
          ))}
        </Track>

        <Subtitle>{t('activity.empty')}</Subtitle>
      </Viewport>
    );
  }

  const describe = (item: (typeof items)[number]) => {
    if (item.kind === 'tip') {
      return t('activity.tipped', {amount: Number(item.amountEth).toFixed(3)});
    }

    if (item.kind === 'pass') {
      return t('activity.claimed');
    }

    return t('activity.minted', {tier: item.tier});
  };

  const rows = [...items, ...items];

  return (
    <Viewport>
      <Track>
        <Marquee style={{'--rail-duration': `${String(Math.max(20, items.length * 4))}s`} as CSSProperties}>
          {rows.map((item, index) => (
            <Item
              key={`${item.txHash}-${index}`}
              href={explorerTx(item.txHash)}
              target="_blank"
              rel="noreferrer noopener"
              aria-hidden={index >= items.length}
            >
              <Dot $kind={item.kind}>{ICONS[item.kind]}</Dot>

              <Line>
                <strong>{formatAddress(item.actor)}</strong>
                <span>{describe(item)}</span>
              </Line>

              <Value $kind={item.kind}>
                {item.kind === 'tip'
                  ? `${Number(item.amountEth).toFixed(3)} Ξ`
                  : item.priceEth && Number(item.priceEth) > 0
                    ? `${Number(item.priceEth).toFixed(3)} Ξ`
                    : t('activity.free')}
              </Value>
            </Item>
          ))}
        </Marquee>
      </Track>

      <Subtitle>{t('activity.hint')}</Subtitle>
    </Viewport>
  );
};

export default Activity;

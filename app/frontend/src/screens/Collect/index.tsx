import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import ConnectButton from '../../components/Wallet/ConnectButton';
import {fetchTiersRequest, mintArtifactRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Card, Row, Stack, Subtitle, Title} from '../../styles';
import {TIERS, type ITier} from '../../web3/contracts';

import {Price, Remaining, TierCard, TierGrid, TierName, Sold} from './styles';

/**
 * The tier is chosen and paid for, not rolled.
 *
 * A random tier would make this a slot machine — you would send ETH not knowing
 * what comes back. Here the price buys exactly what it says, and the scarcity is
 * a hard cap in the contract rather than a marketing line: the number left is
 * read from the chain, not from a banner.
 */
const CollectPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const {tiers} = useStoreSelector((state) => state.nft);
  const stage = useStoreSelector((state) => state.tx.stage);

  const [selected, setSelected] = useState<ITier>(0);

  useEffect(() => {
    dispatch(fetchTiersRequest());
  }, [dispatch]);

  const busy = stage === 'estimating' || stage === 'signing' || stage === 'pending';
  const remaining = tiers?.[selected]?.remaining;
  const soldOut = remaining === 0;

  return (
    <Stack $gap="40px">
      <Stack $gap="8px">
        <Title>{t('collect.title')}</Title>
        <Subtitle>{t('collect.subtitle')}</Subtitle>
      </Stack>

      <TierGrid>
        {TIERS.map((tier) => {
          const info = tiers?.[tier.id];
          const out = info?.remaining === 0;

          return (
            <TierCard
              key={tier.id}
              type="button"
              $active={selected === tier.id}
              $tier={tier.key}
              disabled={busy}
              aria-pressed={selected === tier.id}
              onClick={() => setSelected(tier.id)}
            >
              <TierName>{t(`collect.tiers.${tier.key}`)}</TierName>
              <Price>{tier.price} ETH</Price>
              {out ? (
                <Sold>{t('collect.soldOut')}</Sold>
              ) : (
                <Remaining>
                  {info
                    ? t('collect.remaining', {left: info.remaining, cap: tier.cap})
                    : `— / ${tier.cap}`}
                </Remaining>
              )}
            </TierCard>
          );
        })}
      </TierGrid>

      <Card>
        {user.walletAddress ? (
          <Row $justify="space-between" $wrap $gap="16px">
            <Subtitle>{t('collect.hint')}</Subtitle>
            <Button
              loading={busy}
              disabled={busy || soldOut}
              onClick={() => dispatch(mintArtifactRequest(selected))}
            >
              {soldOut
                ? t('collect.soldOut')
                : t('collect.buy', {
                    tier: t(`collect.tiers.${TIERS[selected]!.key}`),
                    price: TIERS[selected]!.price,
                  })}
            </Button>
          </Row>
        ) : (
          <Row $justify="space-between" $wrap $gap="16px">
            <Subtitle>
              {t(user.role.name === 'VISITOR' ? 'collect.signInFirst' : 'collect.connectFirst')}
            </Subtitle>
            <ConnectButton />
          </Row>
        )}
      </Card>
    </Stack>
  );
};

export default CollectPage;

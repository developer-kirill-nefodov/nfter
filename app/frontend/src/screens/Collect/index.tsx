import {useEffect, useState, type CSSProperties} from 'react';
import {useTranslation} from 'react-i18next';

import Activity from '../../components/Activity';
import Button from '../../components/Button';
import FeeSplitPanel from '../../components/Chain/FeeSplitPanel';
import {useChainStatus} from '../../hooks/useChainStatus';
import Mechanics from '../../components/Chain/Mechanics';
import SupplyPanel from '../../components/Chain/SupplyPanel';
import {PanelGrid} from '../../components/Chain/styles';
import Modal from '../../components/Modal';
import NftModal from '../../components/Nft/NftModal';
import {SkeletonCard, SkeletonGrid} from '../../components/Skeleton';
import TipForm from '../../components/Tip/TipForm';
import ConnectButton from '../../components/Wallet/ConnectButton';
import {fetchStatsRequest, fetchTiersRequest, mintArtifactRequest} from '../../store/actions';
import {clearHighlight} from '../../store/reducers/stats-slice';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {isTxBusy} from '../../store/reducers/tx-slice';
import {Row, Stack, Subtitle, Title} from '../../styles';
import type {INft} from '../../types/nft';
import {ARTIFACTS_ADDRESS, TIERS, type ITier} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {
  MintBar,
  Price,
  Remaining,
  Showcase,
  ShowcaseCard,
  GhostCard,
  ShowcaseTrack,
  Sold,
  TierCard,
  TierGrid,
  TierName,
  Yours,
} from './styles';

const CollectPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const {tiers} = useStoreSelector((state) => state.nft);
  const {status} = useChainStatus();
  const {stats, loading, highlight} = useStoreSelector((state) => state.stats);
  const stage = useStoreSelector((state) => state.tx.stage);

  const [selected, setSelected] = useState<ITier>(0);
  const [preview, setPreview] = useState<INft | null>(null);
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    dispatch(fetchTiersRequest());
    dispatch(fetchStatsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (!highlight) {
      return;
    }

    const timer = setTimeout(() => dispatch(clearHighlight()), 60000);

    return () => clearTimeout(timer);
  }, [dispatch, highlight]);

  const busy = isTxBusy(stage);

  const remainingOf = (tier: ITier): number | undefined => {
    const onChain = status?.tiers.find((item) => item.tier === tier);

    return tiers?.[tier]?.remaining ?? (onChain ? onChain.cap - onChain.minted : undefined);
  };

  const remaining = remainingOf(selected);
  const soldOut = remaining === 0;

  const showcase = stats?.artifactShowcase ?? [];

  const rail = showcase.length > 0 ? [...showcase, ...showcase] : [];
  const duration = Math.max(18, showcase.length * 6);

  return (
    <Stack $gap="48px">
      <Stack $gap="8px">
        <Title>{t('collect.title')}</Title>
        <Subtitle>{t('collect.subtitle')}</Subtitle>
      </Stack>

      <TierGrid>
        {TIERS.map((tier, index) => {
          const left = remainingOf(tier.id);
          const out = left === 0;

          return (
            <TierCard
              key={tier.id}
              type="button"
              $active={selected === tier.id}
              $tier={tier.key}
              $delay={index * 60}
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
                  {left === undefined
                    ? `— / ${tier.cap}`
                    : t('collect.remaining', {left, cap: tier.cap})}
                </Remaining>
              )}
            </TierCard>
          );
        })}
      </TierGrid>

      <MintBar>
        <Stack $gap="4px">
          <strong>{t(`collect.tiers.${TIERS[selected]!.key}`)}</strong>
          <Subtitle>{t('collect.hint')}</Subtitle>
        </Stack>

        {user.walletAddress ? (
          <Row $gap="12px" $wrap>
            <Button variant="ghost" onClick={() => setDonating(true)}>
              {t('tip.open')}
            </Button>
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
          <Row $gap="12px" $wrap>
            <Subtitle>
              {t(user.role.name === 'VISITOR' ? 'collect.signInFirst' : 'collect.connectFirst')}
            </Subtitle>
            <ConnectButton />
          </Row>
        )}
      </MintBar>

      <Stack $gap="16px">
        <Title as="h2">{t('collect.recent')}</Title>

        {loading && showcase.length === 0 ? (
          <SkeletonGrid>
            {Array.from({length: 4}, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </SkeletonGrid>
        ) : showcase.length === 0 ? (
          <Stack $gap="12px">
            <Showcase>
              <ShowcaseTrack style={{animation: 'none'} as CSSProperties}>
                {Array.from({length: 6}, (_, index) => (
                  <GhostCard key={index} />
                ))}
              </ShowcaseTrack>
            </Showcase>

            <Subtitle>{t('collect.noneYet')}</Subtitle>
          </Stack>
        ) : (
          <Showcase>
            <ShowcaseTrack style={{'--rail-duration': `${String(duration)}s`} as CSSProperties}>
              {rail.map((item, index) => (
                <ShowcaseCard
                  key={`${item.tokenId}-${index}`}
                  aria-hidden={index >= showcase.length}
                  type="button"
                  $rarity={item.rarity.toLowerCase()}
                  $delay={index * 50}
                  $mine={item.tokenId === highlight && index < showcase.length}
                  onClick={() =>
                    setPreview({
                      tokenId: item.tokenId,
                      tokenUri: '',
                      name: item.name,
                      description: '',
                      image: item.image,
                      attributes: [{trait_type: 'Tier', value: item.rarity}],
                    })
                  }
                >
                  {item.tokenId === highlight && index < showcase.length && (
                    <Yours>★ {t('collect.yours')}</Yours>
                  )}
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.rarity}</span>
                    <code>{formatAddress(item.minter)}</code>
                  </div>
                </ShowcaseCard>
              ))}
            </ShowcaseTrack>
          </Showcase>
        )}
      </Stack>

      <PanelGrid>
        <SupplyPanel />
        <FeeSplitPanel mode="mint" />
      </PanelGrid>

      <Mechanics
        title="collect.mechanics"
        items={['collect.onchain', 'collect.cap', 'collect.seed']}
      />

      <Stack $gap="16px">
        <Title as="h2">{t('activity.title')}</Title>
        <Activity />
      </Stack>

      {preview && (
        <NftModal nft={preview} contract={ARTIFACTS_ADDRESS} onClose={() => setPreview(null)} />
      )}

      {donating && (
        <Modal open onClose={() => setDonating(false)} label={t('tip.title')}>
          <TipForm />
        </Modal>
      )}
    </Stack>
  );
};

export default CollectPage;

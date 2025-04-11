import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import Activity from '../../components/Activity';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import NftModal from '../../components/Nft/NftModal';
import {SkeletonCard, SkeletonGrid} from '../../components/Skeleton';
import TipForm from '../../components/Tip/TipForm';
import ConnectButton from '../../components/Wallet/ConnectButton';
import {fetchStatsRequest, fetchTiersRequest, mintArtifactRequest} from '../../store/actions';
import {clearHighlight} from '../../store/reducers/stats-slice';
import {useAutoScroll} from '../../hooks/useAutoScroll';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Card, Row, Stack, Subtitle, Title} from '../../styles';
import type {INft} from '../../types/nft';
import {ARTIFACTS_ADDRESS, TIERS, type ITier} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {
  MintBar,
  Minted,
  Price,
  Remaining,
  Showcase,
  ShowcaseCard,
  Sold,
  TierCard,
  TierGrid,
  TierName,
  Yours,
} from './styles';

/**
 * The shop, and the room it stands in.
 *
 * The page used to be four price cards and a lot of nothing. What was missing is
 * everything that makes a shop feel alive: what other people have bought, what
 * is happening right now, and somewhere to go once you have bought yours.
 */
const CollectPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const {tiers} = useStoreSelector((state) => state.nft);
  const {stats, loading, highlight} = useStoreSelector((state) => state.stats);
  const stage = useStoreSelector((state) => state.tx.stage);

  const railRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<ITier>(0);
  const [preview, setPreview] = useState<INft | null>(null);
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    dispatch(fetchTiersRequest());
    dispatch(fetchStatsRequest());
  }, [dispatch]);

  // The badge is a "look here", not a permanent label — it fades out of the way
  // once the buyer has had a moment to see it.
  useEffect(() => {
    if (!highlight) {
      return;
    }

    const timer = setTimeout(() => dispatch(clearHighlight()), 12000);

    return () => clearTimeout(timer);
  }, [dispatch, highlight]);

  const busy = stage === 'estimating' || stage === 'signing' || stage === 'pending';
  const remaining = tiers?.[selected]?.remaining;
  const soldOut = remaining === 0;

  const showcase = stats?.artifactShowcase ?? [];

  /**
   * Doubled, so the rail always has somewhere to scroll to.
   *
   * Five cards fit on a wide screen with room to spare — there was nothing to
   * scroll, which is why the drift was invisible. The copy guarantees overflow
   * and, wrapped at the halfway point, makes the loop seamless.
   */
  const rail = showcase.length > 0 ? [...showcase, ...showcase] : [];

  useAutoScroll(railRef, {enabled: showcase.length > 1, seamless: true});

  return (
    <Stack $gap="48px">
      <Stack $gap="8px">
        <Title>{t('collect.title')}</Title>
        <Subtitle>{t('collect.subtitle')}</Subtitle>
      </Stack>

      <TierGrid>
        {TIERS.map((tier, index) => {
          const info = tiers?.[tier.id];
          const out = info?.remaining === 0;

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
                  {info
                    ? t('collect.remaining', {left: info.remaining, cap: tier.cap})
                    : `— / ${tier.cap}`}
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
        <Row $justify="space-between" $wrap>
          <Title as="h2">{t('collect.recent')}</Title>
          {stats && <Minted>{t('collect.mintedSoFar', {count: stats.artifactsMinted})}</Minted>}
        </Row>

        {/* Not a mock-up: these are the artifacts other people have actually
            bought, drawn by the contract, clickable like any other card. */}
        {loading && showcase.length === 0 ? (
          <SkeletonGrid>
            {Array.from({length: 4}, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </SkeletonGrid>
        ) : showcase.length === 0 ? (
          <Card>
            <Subtitle>{t('collect.noneYet')}</Subtitle>
          </Card>
        ) : (
          <Showcase ref={railRef}>
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
                {item.tokenId === highlight && <Yours>{t('collect.yours')}</Yours>}
                <img src={item.image} alt={item.name} loading="lazy" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.rarity}</span>
                  <code>{formatAddress(item.minter)}</code>
                </div>
              </ShowcaseCard>
            ))}
          </Showcase>
        )}
      </Stack>

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

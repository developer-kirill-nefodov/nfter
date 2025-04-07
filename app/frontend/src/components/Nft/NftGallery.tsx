import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';

import NoNftIcon from '../../assets/svg/no-nft.svg';
import {fetchNftsRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle, Title} from '../../styles';
import Button from '../Button';
import Refresh from '../Refresh';
import {SkeletonCard, SkeletonGrid} from '../Skeleton';

import {NavigateUrls} from '../../utils/navigate-urls';
import type {INft} from '../../types/nft';

import NftCard from './NftCard';
import NftModal from './NftModal';
import {EmptyState, Grid} from './styles';

/** One section per collection: the pass you are given, the artifacts you buy. */
const NftGallery = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const {holdings, loading, error} = useStoreSelector((state) => state.nft);
  const [open, setOpen] = useState<{nft: INft; contract: string} | null>(null);

  // The grid keeps its shape while the chain answers, so nothing jumps into
  // place when it does.
  if (loading && !holdings) {
    return (
      <SkeletonGrid aria-label={t('nft.loading')} aria-busy="true">
        {Array.from({length: 4}, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </SkeletonGrid>
    );
  }

  if (error) {
    return (
      <EmptyState role="alert">
        <Subtitle>{error}</Subtitle>
        <Button variant="ghost" onClick={() => dispatch(fetchNftsRequest({refresh: true}))}>
          {t('nft.retry')}
        </Button>
      </EmptyState>
    );
  }

  const owned = holdings?.collections.filter((collection) => collection.items.length > 0) ?? [];

  if (owned.length === 0) {
    return (
      <EmptyState>
        <img src={NoNftIcon} alt="" />
        <Subtitle>{t('nft.empty')}</Subtitle>
        <Link to={NavigateUrls.collect}>
          <Button>{t('nft.goCollect')}</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <Stack $gap="32px">
      <Row $justify="flex-end">
        <Refresh
          spinning={loading}
          onClick={() => dispatch(fetchNftsRequest({refresh: true}))}
        />
      </Row>

      {owned.map((collection) => (
        <Stack key={collection.contract} $gap="16px">
          <Row $justify="space-between" $wrap>
            <Title as="h3">{collection.name}</Title>
            <Subtitle>
              {t('nft.owned', {count: collection.balance, symbol: collection.symbol})}
            </Subtitle>
          </Row>

          <Grid>
            {collection.items.map((nft, index) => (
              <NftCard
                key={`${collection.contract}-${nft.tokenId}`}
                nft={nft}
                index={index}
                onOpen={() => setOpen({nft, contract: collection.contract})}
              />
            ))}
          </Grid>
        </Stack>
      ))}

      <NftModal
        nft={open?.nft ?? null}
        contract={open?.contract ?? ''}
        onClose={() => setOpen(null)}
      />
    </Stack>
  );
};

export default NftGallery;

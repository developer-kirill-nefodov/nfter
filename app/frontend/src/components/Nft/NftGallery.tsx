import {useTranslation} from 'react-i18next';

import NoNftIcon from '../../assets/svg/no-nft.svg';
import {fetchNftsRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle, Title} from '../../styles';
import Button from '../Button';
import Spinner from '../Spinner';

import NftCard from './NftCard';
import {EmptyState, Grid} from './styles';

/** One section per collection: the pass you are given, the artifacts you buy. */
const NftGallery = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const {holdings, loading, error} = useStoreSelector((state) => state.nft);

  if (loading) {
    return (
      <Row $justify="center" style={{padding: '64px 0'}}>
        <Spinner size={32} label={t('nft.loading')} />
      </Row>
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
      </EmptyState>
    );
  }

  return (
    <Stack $gap="32px">
      <Row $justify="flex-end">
        <Button variant="ghost" onClick={() => dispatch(fetchNftsRequest({refresh: true}))}>
          {t('nft.refresh')}
        </Button>
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
            {collection.items.map((nft) => (
              <NftCard key={`${collection.contract}-${nft.tokenId}`} nft={nft} />
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
};

export default NftGallery;

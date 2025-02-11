import {useTranslation} from 'react-i18next';

import NoNftIcon from '../../assets/svg/no-nft.svg';
import {fetchNftsRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle} from '../../styles';
import Button from '../Button';
import Spinner from '../Spinner';

import NftCard from './NftCard';
import {EmptyState, Grid} from './styles';

const NftGallery = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const {collection, loading, error} = useStoreSelector((state) => state.nft);

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

  if (!collection || collection.items.length === 0) {
    return (
      <EmptyState>
        <img src={NoNftIcon} alt="" />
        <Subtitle>{t('nft.empty')}</Subtitle>
      </EmptyState>
    );
  }

  return (
    <Stack $gap="24px">
      <Row $justify="space-between" $wrap>
        <Subtitle>
          {t('nft.owned', {count: collection.balance, symbol: collection.symbol})}
        </Subtitle>
        <Button variant="ghost" onClick={() => dispatch(fetchNftsRequest({refresh: true}))}>
          {t('nft.refresh')}
        </Button>
      </Row>

      <Grid>
        {collection.items.map((nft) => (
          <NftCard key={nft.tokenId} nft={nft} />
        ))}
      </Grid>
    </Stack>
  );
};

export default NftGallery;

import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import ListDialog from '../../components/Market/ListDialog';
import Listings from '../../components/Market/Listings';
import Sales from '../../components/Market/Sales';
import Refresh from '../../components/Refresh';
import ConnectButton from '../../components/Wallet/ConnectButton';
import {
  fetchMarketRequest,
  fetchNftsRequest,
  fetchProceedsRequest,
  withdrawProceedsRequest,
} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle, Title} from '../../styles';
import {explorerAddress} from '../../web3/contracts';
import {formatAddress, formatBalance} from '../../web3/wallet';

import {Earnings} from './styles';

/**
 * The market.
 *
 * A seller keeps their token while it is listed — the contract only holds an
 * approval to move it — and nobody is paid during a sale: proceeds are credited
 * and withdrawn afterwards. Both of those are visible here: your token stays in
 * your gallery, and your earnings sit in a bar you can empty when you like.
 */
const MarketPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const {book, loading, proceeds} = useStoreSelector((state) => state.market);
  const stage = useStoreSelector((state) => state.tx.stage);

  const [listing, setListing] = useState(false);

  const wallet = user.walletAddress;

  useEffect(() => {
    dispatch(fetchMarketRequest());
  }, [dispatch]);

  useEffect(() => {
    if (wallet) {
      dispatch(fetchProceedsRequest());
      dispatch(fetchNftsRequest());
    }
  }, [dispatch, wallet]);

  const busy = stage === 'estimating' || stage === 'signing' || stage === 'pending';
  const earned = proceeds && proceeds !== '0' ? proceeds : null;

  return (
    <Stack $gap="40px">
      <Row $justify="space-between" $wrap $gap="16px">
        <Stack $gap="8px">
          <Title>{t('market.title')}</Title>
          <Subtitle>{t('market.subtitle', {fee: (book?.feeBps ?? 250) / 100})}</Subtitle>
        </Stack>

        <Row $gap="12px">
          <Refresh
            spinning={loading}
            label={t('market.refresh')}
            onClick={() => dispatch(fetchMarketRequest({refresh: true}))}
          />

          {wallet ? (
            <Button onClick={() => setListing(true)}>{t('market.sell')}</Button>
          ) : (
            <ConnectButton />
          )}
        </Row>
      </Row>

      {/* Money the market owes you. It is not pushed at you during a sale — that
          is what makes a hostile seller unable to break a purchase. */}
      {earned && (
        <Earnings>
          <Stack $gap="4px">
            <Subtitle>{t('market.earned')}</Subtitle>
            <strong>{formatBalance(earned)} ETH</strong>
          </Stack>

          <Button
            loading={busy}
            disabled={busy}
            onClick={() => dispatch(withdrawProceedsRequest())}
          >
            {t('market.withdraw')}
          </Button>
        </Earnings>
      )}

      <Listings />

      <Stack $gap="16px">
        <Title as="h2">{t('market.history')}</Title>
        <Sales />
      </Stack>

      {book && (
        <Subtitle>
          {t('market.contract')}{' '}
          <a href={explorerAddress(book.contract)} target="_blank" rel="noreferrer noopener">
            {formatAddress(book.contract)}
          </a>
        </Subtitle>
      )}

      {listing && <ListDialog onClose={() => setListing(false)} />}
    </Stack>
  );
};

export default MarketPage;

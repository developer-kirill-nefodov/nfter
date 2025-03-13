import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import ClaimPass from '../../components/Nft/ClaimPass';
import NftGallery from '../../components/Nft/NftGallery';
import ConnectButton from '../../components/Wallet/ConnectButton';
import {fetchNftsRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Card, Row, Stack, Subtitle, Title} from '../../styles';
import {CHAIN_NAME, formatAddress, formatBalance} from '../../web3/wallet';

import {Stat, StatLabel, StatValue} from './styles';

const HomePage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const collection = useStoreSelector((state) => state.nft.collection);

  const wallet = user.walletAddress;

  useEffect(() => {
    if (wallet) {
      dispatch(fetchNftsRequest());
    }
  }, [dispatch, wallet]);

  if (!wallet) {
    return (
      <Card>
        <Stack $gap="16px" $align="flex-start">
          <Title>{t('home.title')}</Title>
          <Subtitle>{t('home.connectPrompt')}</Subtitle>
          <ConnectButton />
        </Stack>
      </Card>
    );
  }

  return (
    <Stack $gap="40px">
      <Card>
        <Row $justify="space-between" $wrap $gap="24px">
          <Stat>
            <StatLabel>{t('home.wallet')}</StatLabel>
            <StatValue title={wallet}>{formatAddress(wallet)}</StatValue>
          </Stat>

          <Stat>
            <StatLabel>{t('home.network')}</StatLabel>
            <StatValue>{CHAIN_NAME}</StatValue>
          </Stat>

          <Stat>
            <StatLabel>{t('home.balance')}</StatLabel>
            <StatValue>
              {collection ? `${formatBalance(collection.nativeBalance)} ETH` : '—'}
            </StatValue>
          </Stat>

          <Stat>
            <StatLabel>{t('home.tokens')}</StatLabel>
            <StatValue>{collection?.balance ?? '—'}</StatValue>
          </Stat>
        </Row>
      </Card>

      <ClaimPass />

      <Stack $gap="16px">
        <Title as="h2">{t('nft.title')}</Title>
        <NftGallery />
      </Stack>
    </Stack>
  );
};

export default HomePage;

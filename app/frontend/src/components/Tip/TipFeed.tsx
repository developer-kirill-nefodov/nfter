import {useTranslation} from 'react-i18next';

import {useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle} from '../../styles';
import {explorerTx} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';
import Spinner from '../Spinner';

import {Entry, Message, Amount, EmptyFeed} from './styles';

const when = (timestamp: number) => new Date(timestamp * 1000).toLocaleString();

const TipFeed = () => {
  const {t} = useTranslation();
  const {feed, loading, error} = useStoreSelector((state) => state.tip);

  if (loading && !feed) {
    return (
      <Row $justify="center" style={{padding: '48px 0'}}>
        <Spinner size={28} />
      </Row>
    );
  }

  if (error) {
    return <EmptyFeed role="alert">{error}</EmptyFeed>;
  }

  if (!feed || feed.tips.length === 0) {
    return <EmptyFeed>{t('tip.empty')}</EmptyFeed>;
  }

  return (
    <Stack $gap="8px">
      {feed.tips.map((tip) => (
        <Entry key={tip.txHash}>
          <Row $justify="space-between" $wrap $gap="8px">
            <a href={explorerTx(tip.txHash)} target="_blank" rel="noreferrer noopener">
              {formatAddress(tip.from)}
            </a>
            <Amount>{tip.amountEth} ETH</Amount>
          </Row>
          {tip.message && <Message>“{tip.message}”</Message>}
          <Subtitle>{when(tip.timestamp)}</Subtitle>
        </Entry>
      ))}
    </Stack>
  );
};

export default TipFeed;

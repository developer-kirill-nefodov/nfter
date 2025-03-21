import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import {fetchLeaderboardRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Subtitle} from '../../styles';
import {explorerAddress} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {Amount, EmptyFeed, Entry, Medal, Message, You} from './styles';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Folded out of the same event log the feed reads — no extra storage, and anyone
 * can recompute it from the chain and get the same numbers. A leaderboard nobody
 * has to trust is the point of putting tips through a contract.
 */
const Leaderboard = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const entries = useStoreSelector((state) => state.stats.leaderboard);
  const wallet = useStoreSelector((state) => state.user.user.walletAddress);

  useEffect(() => {
    dispatch(fetchLeaderboardRequest());
  }, [dispatch]);

  if (entries.length === 0) {
    return <EmptyFeed>{t('tip.leaderboardEmpty')}</EmptyFeed>;
  }

  return (
    <>
      {entries.map((entry) => {
        const isYou = wallet?.toLowerCase() === entry.address.toLowerCase();

        return (
          <Entry key={entry.address} as={isYou ? You : undefined}>
            <Row $justify="space-between" $wrap $gap="8px">
              <Row $gap="8px">
                <Medal>{MEDALS[entry.rank - 1] ?? `#${entry.rank}`}</Medal>
                <a
                  href={explorerAddress(entry.address)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {formatAddress(entry.address)}
                </a>
                {isYou && <Subtitle>{t('tip.you')}</Subtitle>}
              </Row>
              <Amount>{entry.totalEth} ETH</Amount>
            </Row>
            <Subtitle>{t('tip.tipsCount', {count: entry.tips})}</Subtitle>
            {entry.lastMessage && <Message>“{entry.lastMessage}”</Message>}
          </Entry>
        );
      })}
    </>
  );
};

export default Leaderboard;

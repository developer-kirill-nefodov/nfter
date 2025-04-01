import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import Board, {type IBoardRow} from '../../components/Rating/Board';
import {Tab, Tabs} from '../../components/Rating/styles';
import TipForm from '../../components/Tip/TipForm';
import {fetchCollectorsRequest, fetchLeaderboardRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle, Title} from '../../styles';

type IBoardKey = 'donors' | 'collectors';

/**
 * Two boards, one page.
 *
 * Both are folded out of the chain's own event log — the donations board from
 * TipJar, the collectors board from the two mint contracts — so anybody can
 * recompute either one and get the same numbers. A leaderboard nobody has to
 * take on trust is the reason those events exist.
 */
const RatingPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const [board, setBoard] = useState<IBoardKey>('donors');

  const {leaderboard, collectors, loading} = useStoreSelector((state) => state.stats);
  const wallet = useStoreSelector((state) => state.user.user.walletAddress);

  useEffect(() => {
    dispatch(fetchLeaderboardRequest());
    dispatch(fetchCollectorsRequest());
  }, [dispatch]);

  const donorRows: IBoardRow[] = leaderboard.map((entry) => ({
    rank: entry.rank,
    address: entry.address,
    value: `${Number(entry.totalEth).toFixed(4)} Ξ`,
    subtitle: entry.lastMessage || t('tip.tipsCount', {count: entry.tips}),
  }));

  const collectorRows: IBoardRow[] = collectors.map((entry) => ({
    rank: entry.rank,
    address: entry.address,
    value: `${entry.tokens} NFT`,
    subtitle: [
      entry.bestTier && t('rating.bestTier', {tier: entry.bestTier}),
      t('rating.spent', {amount: Number(entry.spentEth).toFixed(3)}),
    ]
      .filter(Boolean)
      .join(' · '),
  }));

  const rows = board === 'donors' ? donorRows : collectorRows;

  return (
    <Stack $gap="40px">
      <Stack $gap="8px">
        <Title>{t('rating.title')}</Title>
        <Subtitle>{t('rating.subtitle')}</Subtitle>
      </Stack>

      <Row $justify="center">
        <Tabs role="tablist">
          {(['donors', 'collectors'] as const).map((key) => (
            <Tab
              key={key}
              type="button"
              role="tab"
              aria-selected={board === key}
              $active={board === key}
              onClick={() => setBoard(key)}
            >
              {t(`rating.tabs.${key}`)}
            </Tab>
          ))}
        </Tabs>
      </Row>

      <Stack $gap="24px">
        <Board
          rows={rows}
          you={wallet}
          loading={loading && rows.length === 0}
          emptyText={t(board === 'donors' ? 'rating.emptyDonors' : 'rating.emptyCollectors')}
        />
      </Stack>

      {/* The way onto the board — right below it, where someone who has just seen
          the ranking might actually want it. */}
      <TipForm />
    </Stack>
  );
};

export default RatingPage;

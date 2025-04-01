import {useTranslation} from 'react-i18next';

import {explorerAddress} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';
import Spinner from '../Spinner';

import Podium, {type IPodiumEntry} from './Podium';
import {Avatar, Empty, Rank, RowItem, RowMain, RowValue, Table} from './styles';

export interface IBoardRow extends IPodiumEntry {
  rank: number;
}

interface IBoard {
  rows: IBoardRow[];
  you: string | null;
  loading?: boolean;
  emptyText: string;
}

/**
 * One board, two lives: the top three on a podium, the rest in a table. Same
 * shape for donations and for collectors — a leaderboard is a leaderboard, and
 * two different-looking ones would be two things to learn instead of one.
 */
const Board = ({rows, you, loading = false, emptyText}: IBoard) => {
  const {t} = useTranslation();

  if (loading) {
    return (
      <Empty>
        <Spinner size={28} />
      </Empty>
    );
  }

  if (rows.length === 0) {
    return <Empty>{emptyText}</Empty>;
  }

  const rest = rows.slice(3);

  return (
    <>
      <Podium entries={rows.slice(0, 3)} you={you} />

      {rest.length > 0 && (
        <Table>
          {rest.map((row) => {
            const isYou = you?.toLowerCase() === row.address.toLowerCase();

            return (
              <RowItem key={row.address} $you={isYou}>
                <Rank>#{row.rank}</Rank>
                <Avatar $address={row.address} aria-hidden="true" style={{width: 32, height: 32}} />

                <RowMain>
                  <a
                    href={explorerAddress(row.address)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {formatAddress(row.address)}
                    {isYou && ` ${t('tip.you')}`}
                  </a>
                  <span>{row.subtitle}</span>
                </RowMain>

                <RowValue>{row.value}</RowValue>
              </RowItem>
            );
          })}
        </Table>
      )}
    </>
  );
};

export default Board;

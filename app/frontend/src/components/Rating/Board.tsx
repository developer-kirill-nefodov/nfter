import {useTranslation} from 'react-i18next';

import {explorerAddress} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';
import Spinner from '../Spinner';

import Podium, {type IPodiumEntry} from './Podium';
import {Avatar, Empty, EmptyRow, Rank, RowItem, RowMain, RowValue, Table} from './styles';

const PODIUM = 3;
const MIN_PLACES = 10;
const MAX_PLACES = 20;

export interface IBoardRow extends IPodiumEntry {
  rank: number;
}

interface IBoard {
  rows: IBoardRow[];
  you: string | null;
  loading?: boolean;
  emptyText: string;
}

const Board = ({rows, you, loading = false, emptyText}: IBoard) => {
  const {t} = useTranslation();

  if (loading) {
    return (
      <Empty>
        <Spinner size={28} />
      </Empty>
    );
  }

  const rest = rows.slice(3);

  const places = Math.min(MAX_PLACES, Math.max(MIN_PLACES, rows.length));
  const taken = Math.max(rows.length, PODIUM);
  const vacant = Array.from({length: Math.max(0, places - taken)}, (_, index) => ({
    rank: taken + index + 1,
  }));

  return (
    <>
      {rows.length === 0 ? (
        <Empty>{emptyText}</Empty>
      ) : (
        <Podium entries={rows.slice(0, 3)} you={you} />
      )}

      {(rest.length > 0 || vacant.length > 0) && (
        <Table>
          {rest.map((row) => {
            const isYou = you?.toLowerCase() === row.address.toLowerCase();

            return (
              <RowItem key={row.address} $you={isYou}>
                <Rank>#{row.rank}</Rank>
                <Avatar $address={row.address} aria-hidden="true" style={{width: 32, height: 32}} />

                <RowMain>
                  <a href={explorerAddress(row.address)} target="_blank" rel="noreferrer noopener">
                    {formatAddress(row.address)}
                    {isYou && ` ${t('tip.you')}`}
                  </a>
                  <span>{row.subtitle}</span>
                </RowMain>

                <RowValue>{row.value}</RowValue>
              </RowItem>
            );
          })}

          {vacant.map((slot) => (
            <EmptyRow key={`vacant-${slot.rank}`} aria-hidden="true">
              <Rank>#{slot.rank}</Rank>
              <span>{t('rating.vacant')}</span>
            </EmptyRow>
          ))}
        </Table>
      )}
    </>
  );
};

export default Board;

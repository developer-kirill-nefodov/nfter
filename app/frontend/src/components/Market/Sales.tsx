import {useTranslation} from 'react-i18next';

import {useStoreSelector} from '../../store/hooks';
import {Stack} from '../../styles';
import {explorerTx} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {EmptyBlock, EmptyNote, GhostRow, SaleRow} from './styles';

const Sales = () => {
  const {t} = useTranslation();
  const book = useStoreSelector((state) => state.market.book);

  if (!book || book.sales.length === 0) {
    return (
      <EmptyBlock>
        <Stack $gap="8px" aria-hidden="true">
          {Array.from({length: 3}, (_, index) => (
            <GhostRow key={index}>
              <span style={{width: `${String(40 + index * 12)}%`}} />
              <span style={{width: '56px'}} />
            </GhostRow>
          ))}
        </Stack>

        <EmptyNote>
          <span>{t('market.noSales')}</span>
        </EmptyNote>
      </EmptyBlock>
    );
  }

  return (
    <Stack $gap="8px">
      {book.sales.map((sale) => (
        <SaleRow
          key={sale.txHash}
          href={explorerTx(sale.txHash)}
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>
            {t('market.soldLine', {
              buyer: formatAddress(sale.buyer),
              seller: formatAddress(sale.seller),
              tokenId: sale.tokenId,
            })}
          </span>
          <strong>{sale.priceEth} Ξ</strong>
        </SaleRow>
      ))}
    </Stack>
  );
};

export default Sales;

import {useTranslation} from 'react-i18next';

import {useStoreSelector} from '../../store/hooks';
import {Stack} from '../../styles';
import {explorerTx} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {Empty, GhostRow, SaleRow} from './styles';

const Sales = () => {
  const {t} = useTranslation();
  const book = useStoreSelector((state) => state.market.book);

  if (!book || book.sales.length === 0) {
    return (
      <Stack $gap="8px">
        {Array.from({length: 3}, (_, index) => (
          <GhostRow key={index} aria-hidden="true">
            <span style={{width: `${String(40 + index * 12)}%`}} />
            <span style={{width: '56px'}} />
          </GhostRow>
        ))}

        <Empty>{t('market.noSales')}</Empty>
      </Stack>
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

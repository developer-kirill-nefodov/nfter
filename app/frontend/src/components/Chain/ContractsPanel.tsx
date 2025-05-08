import {useTranslation} from 'react-i18next';

import {useChainStatus} from '../../hooks/useChainStatus';
import {explorerAddress} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {Panel, PanelHead, PanelTitle, RowAddress, RowItem, RowName, Rows, Tag} from './styles';

const STALE_BLOCKS = 20;

const ContractsPanel = () => {
  const {t} = useTranslation();
  const {status} = useChainStatus();

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>{t('chain.contracts')}</PanelTitle>
      </PanelHead>

      <Rows>
        {(status?.contracts ?? []).map((contract) => (
          <RowItem key={contract.address}>
            <RowName>{contract.name}</RowName>

            <RowAddress
              href={explorerAddress(contract.address)}
              target="_blank"
              rel="noreferrer noopener"
            >
              {formatAddress(contract.address)}
            </RowAddress>

            <Tag $warn={contract.lag > STALE_BLOCKS}>
              {contract.lastBlock === 0
                ? t('chain.notIndexed')
                : t('chain.behind', {count: contract.lag})}
            </Tag>
          </RowItem>
        ))}
      </Rows>
    </Panel>
  );
};

export default ContractsPanel;

import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {txReset} from '../../store/reducers/tx-slice';
import {Row, Stack, Subtitle} from '../../styles';
import {explorerTx} from '../../web3/contracts';
import {formatBalance} from '../../web3/wallet';
import Button from '../Button';
import Spinner from '../Spinner';

import {Panel, Step, Steps} from './styles';

const STAGES = ['estimating', 'signing', 'pending', 'confirmed'] as const;

const TITLES: Record<string, string> = {
  claim: 'claiming',
  mint: 'minting',
  tip: 'tipping',
  list: 'listing',
  buy: 'buying',
  cancel: 'cancelling',
  withdraw: 'withdrawing',
};

const TxStatus = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const {kind, stage, hash, error, rejected, gasEstimate} = useStoreSelector((state) => state.tx);

  useEffect(() => {
    const linger = stage === 'confirmed' ? 5000 : rejected ? 2500 : 0;

    if (!linger) {
      return;
    }

    const timer = setTimeout(() => dispatch(txReset()), linger);

    return () => clearTimeout(timer);
  }, [dispatch, stage, rejected]);

  if (stage === 'idle' || !kind) {
    return null;
  }

  const currentIndex = STAGES.indexOf(stage as (typeof STAGES)[number]);
  const failed = stage === 'failed';
  const done = stage === 'confirmed';

  return (
    <Panel role="status" aria-live="polite" $tone={failed ? 'error' : done ? 'success' : 'info'}>
      <Stack $gap="12px">
        <Row $justify="space-between">
          <strong>{t(`tx.${TITLES[kind]}`)}</strong>
          {!done && !failed && <Spinner size={16} />}
        </Row>

        {failed ? (
          <Subtitle>{error}</Subtitle>
        ) : (
          <Steps>
            {STAGES.map((step, index) => (
              <Step key={step} $state={index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'todo'}>
                {t(`tx.stage.${step}`)}
              </Step>
            ))}
          </Steps>
        )}

        {gasEstimate && !failed && (
          <Subtitle>{t('tx.gas', {amount: formatBalance(gasEstimate, 6)})}</Subtitle>
        )}

        {hash && (
          <a href={explorerTx(hash)} target="_blank" rel="noreferrer noopener">
            {t('tx.viewOnExplorer')}
          </a>
        )}

        {(done || failed) && (
          <Row $justify="flex-end">
            <Button variant="ghost" onClick={() => dispatch(txReset())}>
              {t('tx.dismiss')}
            </Button>
          </Row>
        )}
      </Stack>
    </Panel>
  );
};

export default TxStatus;

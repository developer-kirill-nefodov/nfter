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

// Order matches the real sequence a listing goes through (estimating starts the panel, then the
// approval leg, then sign/broadcast/confirm) so the step indicator only ever moves forward.
const STAGES = ['estimating', 'approving', 'signing', 'pending', 'confirmed'] as const;

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

  const {kind, stage, hash, error, rejected, gasEstimate, outcome} = useStoreSelector(
    (state) => state.tx,
  );

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

  const steps = STAGES.filter((step) => step !== 'approving' || kind === 'list');
  const currentIndex = steps.indexOf(stage as (typeof steps)[number]);
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
        ) : done && outcome ? (
          <Subtitle>{outcome}</Subtitle>
        ) : (
          <Steps>
            {steps.map((step, index) => (
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

        {/* Always offer an exit once a hash exists: a stuck/underpriced tx sits in 'pending'
            indefinitely, and without this the panel spins forever with every button disabled. */}
        {(done || failed || (stage === 'pending' && hash)) && (
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

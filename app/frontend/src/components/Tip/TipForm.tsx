import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {sendTipRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {isTxBusy} from '../../store/reducers/tx-slice';
import {Row, Stack, Subtitle, Title} from '../../styles';
import {explorerAddress} from '../../web3/contracts';
import {CHAIN_NAME, formatAddress} from '../../web3/wallet';
import Button from '../Button';
import ConnectButton from '../Wallet/ConnectButton';

import {AmountInput, Field, Preset, Presets} from './styles';

const PRESETS = ['0.001', '0.01', '0.1'];
const MAX_MESSAGE = 140;

const toWei = (eth: string): bigint => {
  const [whole = '0', fraction = ''] = eth.split('.');

  return BigInt(whole + fraction.padEnd(18, '0').slice(0, 18));
};

const TipForm = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const feed = useStoreSelector((state) => state.tip.feed);
  const stage = useStoreSelector((state) => state.tx.stage);

  const [amount, setAmount] = useState('0.01');
  const [message, setMessage] = useState('');

  const busy = isTxBusy(stage);
  const parsed = /^\d*\.?\d{0,18}$/.test(amount) ? toWei(amount || '0') : 0n;
  const valid = parsed > 0n && message.length <= MAX_MESSAGE;

  return (
    <Stack $gap="24px">
        <Stack $gap="4px">
          <Title as="h2">{t('tip.title')}</Title>
          <Subtitle>{t('tip.subtitle', {chain: CHAIN_NAME})}</Subtitle>
        </Stack>

        <Field>
          <label htmlFor="tip-amount">{t('tip.amount')}</label>
          <AmountInput
            id="tip-amount"
            inputMode="decimal"
            value={amount}
            disabled={busy}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Presets>
            {PRESETS.map((preset) => (
              <Preset
                key={preset}
                type="button"
                $active={preset === amount}
                disabled={busy}
                onClick={() => setAmount(preset)}
              >
                {preset} ETH
              </Preset>
            ))}
          </Presets>
        </Field>

        <Field>
          <label htmlFor="tip-message">{t('tip.message')}</label>
          <AmountInput
            id="tip-message"
            placeholder={t('tip.messagePlaceholder')}
            value={message}
            maxLength={MAX_MESSAGE}
            disabled={busy}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Subtitle>{t('tip.messageHint', {left: MAX_MESSAGE - message.length})}</Subtitle>
        </Field>

        {user.walletAddress ? (
          <Row $justify="flex-end">
            <Button
              loading={busy}
              disabled={!valid}
              onClick={() => dispatch(sendTipRequest({amountWei: parsed.toString(), message}))}
            >
              {t('tip.send', {amount})}
            </Button>
          </Row>
        ) : (
          <Row $justify="space-between" $wrap $gap="16px">
            <Subtitle>
              {t(user.role.name === 'VISITOR' ? 'tip.signInFirst' : 'tip.connectFirst')}
            </Subtitle>
            <ConnectButton />
          </Row>
        )}

        {feed?.deployed && (
          <Subtitle>
            {t('tip.jar')}{' '}
            <a href={explorerAddress(feed.contract)} target="_blank" rel="noreferrer noopener">
              {formatAddress(feed.contract)}
            </a>{' '}
            · {t('tip.raised', {amount: feed.totalTipsEth, count: feed.tipCount})}
          </Subtitle>
        )}
    </Stack>
  );
};

export default TipForm;

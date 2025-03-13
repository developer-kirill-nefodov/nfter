import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import ConnectButton from '../../components/Wallet/ConnectButton';
import TipFeed from '../../components/Tip/TipFeed';
import {fetchTipsRequest, sendTipRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Card, Row, Stack, Subtitle, Title} from '../../styles';
import {CHAIN_NAME, formatAddress} from '../../web3/wallet';
import {explorerAddress} from '../../web3/contracts';

import {Amount, Field, Preset, Presets} from './styles';

const PRESETS = ['0.001', '0.01', '0.1'];
const MAX_MESSAGE = 140;

/** Wei has 18 decimals, and floating point cannot hold them. Parse the string. */
const toWei = (eth: string): bigint => {
  const [whole = '0', fraction = ''] = eth.split('.');

  return BigInt(whole + fraction.padEnd(18, '0').slice(0, 18));
};

const TipPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const feed = useStoreSelector((state) => state.tip.feed);
  const stage = useStoreSelector((state) => state.tx.stage);

  const [amount, setAmount] = useState('0.01');
  const [message, setMessage] = useState('');

  useEffect(() => {
    dispatch(fetchTipsRequest());
  }, [dispatch]);

  const busy = stage === 'estimating' || stage === 'signing' || stage === 'pending';
  const parsed = /^\d*\.?\d{0,18}$/.test(amount) ? toWei(amount || '0') : 0n;
  const valid = parsed > 0n && message.length <= MAX_MESSAGE;

  return (
    <Stack $gap="40px">
      <Card>
        <Stack $gap="24px">
          <Stack $gap="4px">
            <Title>{t('tip.title')}</Title>
            <Subtitle>{t('tip.subtitle', {chain: CHAIN_NAME})}</Subtitle>
          </Stack>

          <Field>
            <label htmlFor="tip-amount">{t('tip.amount')}</label>
            <Amount
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
            <Amount
              id="tip-message"
              as="input"
              placeholder={t('tip.messagePlaceholder')}
              value={message}
              maxLength={MAX_MESSAGE}
              disabled={busy}
              onChange={(event) => setMessage(event.target.value)}
            />
            {/* The note is stored in the event log, which is why it is capped:
                the contract refuses anything longer. */}
            <Subtitle>{t('tip.messageHint', {left: MAX_MESSAGE - message.length})}</Subtitle>
          </Field>

          {user.walletAddress ? (
            <Row $justify="flex-end">
              <Button
                loading={busy}
                disabled={!valid}
                onClick={() =>
                  dispatch(sendTipRequest({amountWei: parsed.toString(), message}))
                }
              >
                {t('tip.send', {amount})}
              </Button>
            </Row>
          ) : (
            <Row $justify="space-between" $wrap>
              <Subtitle>{t('tip.connectFirst')}</Subtitle>
              <ConnectButton />
            </Row>
          )}

          {feed && (
            <Subtitle>
              {t('tip.jar')}{' '}
              <a href={explorerAddress(feed.contract)} target="_blank" rel="noreferrer noopener">
                {formatAddress(feed.contract)}
              </a>{' '}
              · {t('tip.raised', {amount: feed.totalTipsEth, count: feed.tipCount})}
            </Subtitle>
          )}
        </Stack>
      </Card>

      <Stack $gap="16px">
        <Title as="h2">{t('tip.recent')}</Title>
        <TipFeed />
      </Stack>
    </Stack>
  );
};

export default TipPage;

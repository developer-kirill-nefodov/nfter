import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import ConnectButton from '../../components/Wallet/ConnectButton';
import {fetchReferralsRequest, withdrawReferralRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Card, Row, Stack, Subtitle, Title} from '../../styles';
import {toast} from '../../components/Toastify/toast';
import {explorerAddress} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {Code, CodeRow, Earned, Stat, StatLabel, StatValue, Stats} from './styles';

/**
 * Your invite code, and what it has earned.
 *
 * Every number on this page comes from the registry contract, not from our
 * database. A referral programme whose rewards live only in Postgres is a promise;
 * one whose rewards are credited on chain is a fact anyone can check.
 */
const InvitePage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const stats = useStoreSelector((state) => state.referral.stats);
  const stage = useStoreSelector((state) => state.tx.stage);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchReferralsRequest());
  }, [dispatch]);

  if (user.role.name === 'VISITOR') {
    return (
      <Card>
        <Stack $gap="16px" $align="flex-start">
          <Title>{t('invite.title')}</Title>
          <Subtitle>{t('invite.signInFirst')}</Subtitle>
        </Stack>
      </Card>
    );
  }

  const busy = stage === 'estimating' || stage === 'signing' || stage === 'pending';
  const link = stats?.code ? `${window.location.origin}/sign-up?invite=${stats.code}` : '';
  const pending = Number(stats?.pendingEth ?? '0');

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast(t('invite.copied'), 'success', 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack $gap="40px">
      <Stack $gap="8px">
        <Title>{t('invite.title')}</Title>
        <Subtitle>{t('invite.subtitle')}</Subtitle>
      </Stack>

      <Card>
        <Stack $gap="16px">
          <Subtitle>{t('invite.yourCode')}</Subtitle>

          <CodeRow>
            <Code>{stats?.code ?? '—'}</Code>
            <Button variant="ghost" disabled={!link} onClick={() => void copy()}>
              {copied ? t('invite.copiedShort') : t('invite.copyLink')}
            </Button>
          </CodeRow>

          {/* An invite from someone with no wallet is still a real invite in the
              app — but there is nobody for the chain to pay. Say so. */}
          {!stats?.address && (
            <Row $justify="space-between" $wrap $gap="12px">
              <Subtitle>{t('invite.connectToEarn')}</Subtitle>
              <ConnectButton />
            </Row>
          )}
        </Stack>
      </Card>

      <Stats>
        <Stat>
          <StatValue>{stats?.invited ?? 0}</StatValue>
          <StatLabel>{t('invite.invited')}</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{Number(stats?.lifetimeEth ?? 0).toFixed(4)} Ξ</StatValue>
          <StatLabel>{t('invite.lifetime')}</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{pending.toFixed(4)} Ξ</StatValue>
          <StatLabel>{t('invite.pending')}</StatLabel>
        </Stat>
      </Stats>

      {pending > 0 && (
        <Earned>
          <Stack $gap="4px">
            <Subtitle>{t('invite.readyToWithdraw')}</Subtitle>
            <strong>{pending.toFixed(4)} ETH</strong>
          </Stack>

          <Button loading={busy} disabled={busy} onClick={() => dispatch(withdrawReferralRequest())}>
            {t('invite.withdraw')}
          </Button>
        </Earned>
      )}

      {stats?.referredBy && (
        <Subtitle>
          {t('invite.invitedBy', {code: stats.referredBy})}
          {stats.referredByAddress && (
            <>
              {' — '}
              <a
                href={explorerAddress(stats.referredByAddress)}
                target="_blank"
                rel="noreferrer noopener"
              >
                {formatAddress(stats.referredByAddress)}
              </a>
            </>
          )}
        </Subtitle>
      )}

      <Card>
        <Stack $gap="8px">
          <Title as="h2">{t('invite.howTitle')}</Title>
          <Subtitle>{t('invite.how1')}</Subtitle>
          <Subtitle>{t('invite.how2')}</Subtitle>
          <Subtitle>{t('invite.how3')}</Subtitle>
        </Stack>
      </Card>
    </Stack>
  );
};

export default InvitePage;

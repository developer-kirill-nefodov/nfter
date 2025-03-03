import {useTranslation} from 'react-i18next';

import {useHasWallet} from '../../hooks/useHasWallet';
import {walletLinkRequest, walletLoginRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row} from '../../styles';
import {CHAIN_NAME, formatAddress} from '../../web3/wallet';
import Button from '../Button';
import {toast} from '../Toastify';

import {AddressPill} from './styles';

/**
 * One button, three jobs, decided by who is asking:
 *  - a visitor signs in with the wallet (SIWE creates the session);
 *  - a signed-in user without a wallet links one to their account;
 *  - a user who already has one just sees the address.
 */
const ConnectButton = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const {installed, recheck} = useHasWallet();

  const user = useStoreSelector((state) => state.user.user);
  const {status} = useStoreSelector((state) => state.wallet);

  if (!installed) {
    return (
      <Row $gap="8px">
        <Button
          variant="ghost"
          onClick={() => window.open('https://metamask.io/download/', '_blank', 'noopener')}
        >
          {t('wallet.install')}
        </Button>
        {/* Installing a wallet does not reload this tab, so give the user a way
            to say "it's there now" without hunting for the refresh button. */}
        <Button
          variant="ghost"
          onClick={() => {
            if (!recheck()) {
              toast(t('wallet.notDetected'), 'warning');
            }
          }}
        >
          {t('wallet.recheck')}
        </Button>
      </Row>
    );
  }

  if (user.walletAddress) {
    return (
      <AddressPill title={`${user.walletAddress} · ${CHAIN_NAME}`}>
        {formatAddress(user.walletAddress)}
      </AddressPill>
    );
  }

  const isVisitor = user.role.name === 'VISITOR';
  const busy = status === 'connecting' || status === 'signing';

  return (
    <Button
      loading={busy}
      disabled={busy}
      onClick={() => dispatch(isVisitor ? walletLoginRequest() : walletLinkRequest())}
    >
      {status === 'signing' ? t('wallet.signing') : t(isVisitor ? 'wallet.connect' : 'wallet.link')}
    </Button>
  );
};

export default ConnectButton;

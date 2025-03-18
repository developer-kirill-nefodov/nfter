import {useTranslation} from 'react-i18next';

import {useHasWallet} from '../../hooks/useHasWallet';
import {walletLinkRequest, walletUnlinkRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavLink, Row} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {CHAIN_NAME, formatAddress} from '../../web3/wallet';
import Button from '../Button';
import {toast} from '../Toastify';

import {AddressPill} from './styles';

/**
 * A wallet is something an account *has*, not a way to become one — so a visitor
 * is sent to sign in first, and every wallet route on the server demands an
 * authenticated caller regardless of what this component decides to render.
 */
const ConnectButton = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const {installed, recheck} = useHasWallet();

  const user = useStoreSelector((state) => state.user.user);
  const {status} = useStoreSelector((state) => state.wallet);

  if (user.role.name === 'VISITOR') {
    return <NavLink to={NavigateUrls.auth.login}>{t('wallet.signInFirst')}</NavLink>;
  }

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

  const busy = status === 'connecting' || status === 'signing';

  if (user.walletAddress) {
    return (
      <Row $gap="8px">
        <AddressPill title={`${user.walletAddress} · ${CHAIN_NAME}`}>
          {formatAddress(user.walletAddress)}
        </AddressPill>
        <Button variant="danger" onClick={() => dispatch(walletUnlinkRequest())}>
          {t('wallet.disconnect')}
        </Button>
      </Row>
    );
  }

  return (
    <Button loading={busy} disabled={busy} onClick={() => dispatch(walletLinkRequest())}>
      {status === 'signing' ? t('wallet.signing') : t('wallet.connect')}
    </Button>
  );
};

export default ConnectButton;

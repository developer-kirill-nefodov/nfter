import {useTranslation} from 'react-i18next';

import {useHasWallet} from '../../hooks/useHasWallet';
import {walletLinkRequest, walletUnlinkRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavLink, Row} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {CHAIN_NAME, formatAddress} from '../../web3/wallet';
import Button from '../Button';
import {toast} from '../Toastify/toast';

import {AddressPill} from './styles';

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

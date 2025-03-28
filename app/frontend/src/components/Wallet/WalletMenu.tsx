import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {refreshBalanceRequest, walletLinkRequest, walletUnlinkRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavLink} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {explorerAddress} from '../../web3/contracts';
import {CHAIN_ID, CHAIN_NAME, formatAddress, formatBalance} from '../../web3/wallet';
import {useHasWallet} from '../../hooks/useHasWallet';
import Button from '../Button';
import {toast} from '../Toastify';

import {
  Avatar,
  Balance,
  Danger,
  Divider,
  MenuItem,
  MenuPanel,
  MenuRow,
  Network,
  Trigger,
  Wrapper,
} from './styles';

/**
 * The wallet as one object instead of three.
 *
 * The address used to sit in a dead pill with a red Disconnect button parked
 * next to it — the most destructive action in the app, permanently on display.
 * Now the pill *is* the control: it shows the balance, and everything you can do
 * to the wallet lives one click inside it.
 */
const WalletMenu = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const {installed, recheck} = useHasWallet();

  const user = useStoreSelector((state) => state.user.user);
  const {status, chainId, balance} = useStoreSelector((state) => state.wallet);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const address = user.walletAddress;

  useEffect(() => {
    if (address) {
      dispatch(refreshBalanceRequest());
    }
  }, [dispatch, address]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (user.role.name === 'VISITOR') {
    return <NavLink to={NavigateUrls.auth.login}>{t('wallet.signInFirst')}</NavLink>;
  }

  if (!installed) {
    return (
      <Button
        variant="ghost"
        onClick={() => {
          if (!recheck()) {
            window.open('https://metamask.io/download/', '_blank', 'noopener');
          }
        }}
      >
        {t('wallet.install')}
      </Button>
    );
  }

  const busy = status === 'connecting' || status === 'signing';

  if (!address) {
    return (
      <Button loading={busy} disabled={busy} onClick={() => dispatch(walletLinkRequest())}>
        {status === 'signing' ? t('wallet.signing') : t('wallet.connect')}
      </Button>
    );
  }

  const wrongNetwork = chainId !== null && chainId !== CHAIN_ID;

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    toast(t('wallet.copied'), 'success', 2000);
  };

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {/* The avatar is the address itself, rendered as colour — the same idea
            the contract uses to draw the art. */}
        <Avatar $address={address} aria-hidden="true" />
        <Balance>{balance ? `${formatBalance(balance, 3)} Ξ` : '—'}</Balance>
        <span>{formatAddress(address)}</span>
      </Trigger>

      {open && (
        <MenuPanel role="menu">
          <MenuRow>
            <code>{formatAddress(address)}</code>
            <Button variant="ghost" onClick={() => void copy()}>
              {t('wallet.copy')}
            </Button>
          </MenuRow>

          <Divider />

          <MenuRow>
            <span>{t('home.balance')}</span>
            <strong>{balance ? `${formatBalance(balance)} ETH` : '—'}</strong>
          </MenuRow>

          <MenuRow>
            <span>{t('home.network')}</span>
            <Network $ok={!wrongNetwork}>
              {wrongNetwork ? t('wallet.wrongNetwork') : CHAIN_NAME}
            </Network>
          </MenuRow>

          <Divider />

          <MenuItem
            as="a"
            href={explorerAddress(address)}
            target="_blank"
            rel="noreferrer noopener"
            role="menuitem"
          >
            {t('wallet.viewOnExplorer')}
          </MenuItem>

          <MenuItem
            as={Danger}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              dispatch(walletUnlinkRequest());
            }}
          >
            {t('wallet.disconnect')}
          </MenuItem>
        </MenuPanel>
      )}
    </Wrapper>
  );
};

export default WalletMenu;

import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';

import LogoMark from '../../assets/svg/nfter-logo.svg';
import LogoWithText from '../../assets/svg/nfter-logo-w-text.svg';
import {useMediaQuery} from '../../hooks/useMediaQuery';
import {logoutRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavigateUrls} from '../../utils/navigate-urls';
import Button from '../Button';
import Spinner from '../Spinner';
import WalletMenu from '../Wallet/WalletMenu';

import Languages from './Languages';
import {Actions, Burger, Header, Inner, Logo, MobileNav, Nav, NavItem, Zone} from './styles';

/**
 * Three zones — brand, navigation, actions — instead of one wrapping row.
 *
 * The old header threw links, a language select, a wallet pill and a red
 * Disconnect button into a single flex row with `wrap`, so on any middling
 * screen it folded in half. Zones do not fold: on mobile the navigation moves
 * into a menu rather than spilling across two lines.
 */
const LayoutHeader = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const isMobile = useMediaQuery({type: 'max', size: 'md'});

  const {user, loading} = useStoreSelector((state) => state.user);
  const [menuOpen, setMenuOpen] = useState(false);

  const isVisitor = user.role.name === 'VISITOR';

  const links = [
    ...(isVisitor ? [] : [{to: NavigateUrls.dashboard, label: t('nav.dashboard')}]),
    {to: NavigateUrls.collect, label: t('collect.nav')},
    {to: NavigateUrls.rating, label: t('rating.nav')},
  ];

  const nav = links.map(({to, label}) => (
    <NavItem key={to} to={to} end onClick={() => setMenuOpen(false)}>
      {label}
    </NavItem>
  ));

  return (
    <Header>
      <Inner>
        <Zone>
          <Link to={NavigateUrls.home} aria-label="ethers-web3 home">
            <Logo src={isMobile ? LogoMark : LogoWithText} alt="" />
          </Link>
        </Zone>

        {!isMobile && <Nav aria-label="Main">{nav}</Nav>}

        <Actions>
          {loading ? (
            <Spinner />
          ) : (
            <>
              <Languages compact />
              <WalletMenu />

              {isVisitor ? (
                <Link to={NavigateUrls.auth.login}>
                  <Button variant="ghost">{t('auth.login')}</Button>
                </Link>
              ) : (
                <Button variant="ghost" onClick={() => dispatch(logoutRequest())}>
                  {t('auth.logout')}
                </Button>
              )}

              {isMobile && (
                <Burger
                  type="button"
                  aria-label="Menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((value) => !value)}
                >
                  ☰
                </Burger>
              )}
            </>
          )}
        </Actions>
      </Inner>

      {isMobile && menuOpen && <MobileNav aria-label="Main">{nav}</MobileNav>}
    </Header>
  );
};

export default LayoutHeader;

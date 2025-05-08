import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';

import LogoMark from '../../assets/svg/nfter-logo.svg';
import {useMediaQuery} from '../../hooks/useMediaQuery';
import {logoutRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavigateUrls} from '../../utils/navigate-urls';
import Button from '../Button';
import Spinner from '../Spinner';
import WalletMenu from '../Wallet/WalletMenu';

import Languages from './Languages';
import {
  Actions,
  Brand,
  BrandLink,
  Burger,
  Header,
  Inner,
  Logo,
  MobileNav,
  MobileTools,
  Nav,
  NavItem,
  Zone,
} from './styles';

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
    {to: NavigateUrls.market, label: t('market.nav')},
    {to: NavigateUrls.rating, label: t('rating.nav')},
    ...(isVisitor ? [] : [{to: NavigateUrls.invite, label: t('invite.nav')}]),
    ...(user.isFounder ? [{to: NavigateUrls.treasury, label: t('treasury.nav')}] : []),
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
          <BrandLink to={NavigateUrls.home} aria-label="EthersWeb3 home">
            <Logo src={LogoMark} alt="" />
            <Brand>EthersWeb3</Brand>
          </BrandLink>
        </Zone>

        {!isMobile && <Nav aria-label="Main">{nav}</Nav>}

        <Actions>
          {loading ? (
            <Spinner />
          ) : (
            <>
              {!isMobile && <Languages compact />}
              {!isVisitor && <WalletMenu />}

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

      {isMobile && menuOpen && (
        <MobileNav aria-label="Main">
          {nav}

          <MobileTools>
            <Languages compact />
          </MobileTools>
        </MobileNav>
      )}
    </Header>
  );
};

export default LayoutHeader;

import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';

import LogoMark from '../../assets/svg/nfter-logo.svg';
import LogoWithText from '../../assets/svg/nfter-logo-w-text.svg';
import {useMediaQuery} from '../../hooks/useMediaQuery';
import {logoutRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavLink, Row} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import Button from '../Button';
import Spinner from '../Spinner';
import ConnectButton from '../Wallet/ConnectButton';

import Languages from './Languages';
import {Header, Logo} from './styles';

const LayoutHeader = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const isMobile = useMediaQuery({type: 'max', size: 'sm'});

  const {user, loading} = useStoreSelector((state) => state.user);

  const isVisitor = user.role.name === 'VISITOR';

  return (
    <Header>
      <Link to={NavigateUrls.home} aria-label="ethers-web3 home">
        <Logo src={isMobile ? LogoMark : LogoWithText} alt="" />
      </Link>

      <Row as="nav" $gap="12px" $wrap>
        <NavLink to={NavigateUrls.tip}>{t('tip.nav')}</NavLink>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Languages compact={isMobile} />
            <ConnectButton />

            {isVisitor ? (
              <>
                <NavLink to={NavigateUrls.auth.login}>{t('auth.login')}</NavLink>
                {!isMobile && (
                  <NavLink to={NavigateUrls.auth.register}>{t('auth.register')}</NavLink>
                )}
              </>
            ) : (
              <Button variant="danger" onClick={() => dispatch(logoutRequest())}>
                {t('auth.logout')}
              </Button>
            )}
          </>
        )}
      </Row>
    </Header>
  );
};

export default LayoutHeader;

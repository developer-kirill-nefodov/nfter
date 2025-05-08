import type {ReactNode} from 'react';
import {useTranslation} from 'react-i18next';

import Identicon from './Identicon';
import {Aside, Bullet, Bullets, Brand, Pitch, Scene, Shell, Slot} from './styles';

interface IAuthLayout {
  note?: ReactNode;
  children: ReactNode;
}

const AuthLayout = ({note, children}: IAuthLayout) => {
  const {t} = useTranslation();

  return (
    <Shell>
      <Aside>
        <Scene aria-hidden="true">
          <Identicon />
        </Scene>

        <Brand>EthersWeb3</Brand>
        <Pitch>{t('auth.pitch')}</Pitch>

        <Bullets>
          <Bullet>{t('auth.bulletContracts')}</Bullet>
          <Bullet>{t('auth.bulletSiwe')}</Bullet>
          <Bullet>{t('auth.bulletReferrals')}</Bullet>
        </Bullets>

        {note}
      </Aside>

      <Slot>{children}</Slot>
    </Shell>
  );
};

export default AuthLayout;

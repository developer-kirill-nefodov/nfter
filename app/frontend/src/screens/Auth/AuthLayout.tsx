import type {ReactNode} from 'react';
import {useTranslation} from 'react-i18next';

import Identicon from './Identicon';
import {Aside, Bullet, Bullets, Brand, Pitch, Scene, Shell, Slot} from './styles';

interface IAuthLayout {
  /** Shown under the pitch — an invite code, a reassurance, whatever the page needs. */
  note?: ReactNode;
  children: ReactNode;
}

/**
 * The frame all four auth screens share.
 *
 * The form used to float alone in the middle of an empty page: it worked, but it
 * said nothing about the thing you were signing into. The left half now carries
 * the project — including a drawing made the same way the contracts make theirs,
 * from a hash, in code — so the first screen is already an argument for the app.
 */
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

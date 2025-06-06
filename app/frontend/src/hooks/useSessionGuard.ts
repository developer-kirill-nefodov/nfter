import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import {SESSION_ENDED} from '../api/client';
import {toast} from '../components/Toastify/toast';
import {useStoreDispatch} from '../store/hooks';
import {clearNfts} from '../store/reducers/nft-slice';
import {setReferralStats} from '../store/reducers/referral-slice';
import {setVisitor} from '../store/reducers/user-slice';
import {disconnectWallet} from '../store/reducers/wallet-slice';

export const useSessionGuard = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  useEffect(() => {
    const onEnded = () => {
      dispatch(setVisitor());
      dispatch(disconnectWallet());
      dispatch(clearNfts());
      dispatch(setReferralStats(null));

      toast(t('auth.sessionExpired'), 'warning', 6000);
    };

    window.addEventListener(SESSION_ENDED, onEnded);

    return () => window.removeEventListener(SESSION_ENDED, onEnded);
  }, [dispatch, t]);
};

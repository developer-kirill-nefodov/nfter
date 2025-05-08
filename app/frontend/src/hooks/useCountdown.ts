import {useEffect} from 'react';

import {tickResetCooldown} from '../store/reducers/auth-slice';
import {useStoreDispatch, useStoreSelector} from '../store/hooks';

export const useResetCooldown = (): number => {
  const dispatch = useStoreDispatch();
  const seconds = useStoreSelector((state) => state.auth.resetCooldown);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = setInterval(() => dispatch(tickResetCooldown()), 1000);

    return () => clearInterval(timer);
  }, [dispatch, seconds]);

  return seconds;
};

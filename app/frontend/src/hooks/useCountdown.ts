import {useEffect} from 'react';

import {tickResetCooldown} from '../store/reducers/auth-slice';
import {useStoreDispatch, useStoreSelector} from '../store/hooks';

/**
 * Counts the reset cooldown down to zero, one second at a time.
 *
 * The starting value comes from the server, not from the client — the browser
 * cannot decide how long a mailbox is protected for, it can only display the
 * decision. The interval stops as soon as it reaches zero.
 */
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

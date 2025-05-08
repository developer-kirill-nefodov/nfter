import {useEffect} from 'react';

import {fetchChainRequest} from '../store/actions';
import {useStoreDispatch, useStoreSelector} from '../store/hooks';

const POLL_MS = 30_000;

export const useChainStatus = () => {
  const dispatch = useStoreDispatch();
  const {status, loading} = useStoreSelector((state) => state.chain);

  useEffect(() => {
    dispatch(fetchChainRequest());

    const timer = setInterval(() => dispatch(fetchChainRequest()), POLL_MS);

    return () => clearInterval(timer);
  }, [dispatch]);

  return {status, loading};
};

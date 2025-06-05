import {useEffect} from 'react';

import {fetchChainRequest} from '../store/actions';
import {useStoreDispatch, useStoreSelector} from '../store/hooks';

export const useChainStatus = () => {
  const dispatch = useStoreDispatch();
  const {status, loading} = useStoreSelector((state) => state.chain);

  useEffect(() => {
    if (!status) {
      dispatch(fetchChainRequest());
    }
  }, [dispatch, status]);

  return {status, loading};
};

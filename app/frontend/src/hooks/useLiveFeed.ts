import {useEffect} from 'react';

import {openLiveFeed} from '../api/live';
import {
  fetchActivityRequest,
  fetchChainRequest,
  fetchCollectorsRequest,
  fetchLeaderboardRequest,
  fetchMarketRequest,
  fetchStatsRequest,
} from '../store/actions';
import {useStoreDispatch} from '../store/hooks';
import {setLiveStatus} from '../store/reducers/chain-slice';

export const useLiveFeed = () => {
  const dispatch = useStoreDispatch();

  useEffect(
    () =>
      openLiveFeed({
        onStatus: (status) => dispatch(setLiveStatus(status)),
        onEvent: (event) => {
          if (event.type !== 'chain') {
            return;
          }

          dispatch(fetchChainRequest());
          dispatch(fetchStatsRequest({refresh: true}));
          dispatch(fetchActivityRequest());
          dispatch(fetchMarketRequest({refresh: true}));
          dispatch(fetchLeaderboardRequest());
          dispatch(fetchCollectorsRequest());
        },
      }),
    [dispatch],
  );
};

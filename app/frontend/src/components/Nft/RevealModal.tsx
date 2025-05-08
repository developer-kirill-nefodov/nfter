import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {clearReveal} from '../../store/reducers/nft-slice';

import NftModal from './NftModal';

const RevealModal = () => {
  const dispatch = useStoreDispatch();
  const reveal = useStoreSelector((state) => state.nft.reveal);

  if (!reveal) {
    return null;
  }

  return (
    <NftModal
      reveal
      nft={reveal.token}
      contract={reveal.contract}
      txHash={reveal.txHash}
      onClose={() => dispatch(clearReveal())}
    />
  );
};

export default RevealModal;

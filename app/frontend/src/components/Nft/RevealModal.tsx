import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {clearReveal} from '../../store/reducers/nft-slice';

import NftModal from './NftModal';

/**
 * Shows the buyer what they just bought, the moment the chain confirms it.
 *
 * A toast reading "minted" is not a reward — someone has just spent real gas and
 * waited on a block for a piece of generative art, and the art is the entire
 * point of the transaction. This is the payoff.
 */
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

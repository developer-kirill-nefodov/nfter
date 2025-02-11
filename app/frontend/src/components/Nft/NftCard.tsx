import {useState} from 'react';

import type {INft} from '../../types/nft';

import {Attribute, Attributes, CardBody, CardImage, CardName, ImageFallback, NftArticle} from './styles';

interface INftCard {
  nft: INft;
}

const NftCard = ({nft}: INftCard) => {
  const [broken, setBroken] = useState(false);

  return (
    <NftArticle>
      {nft.image && !broken ? (
        <CardImage
          src={nft.image}
          alt={nft.name}
          loading="lazy"
          // IPFS gateways time out constantly; a dead image must not leave a
          // blank hole where the token should be.
          onError={() => setBroken(true)}
        />
      ) : (
        <ImageFallback aria-hidden="true">#{nft.tokenId}</ImageFallback>
      )}

      <CardBody>
        <CardName title={nft.name}>{nft.name}</CardName>

        {nft.attributes.length > 0 && (
          <Attributes>
            {nft.attributes.slice(0, 3).map((attribute) => (
              <Attribute key={attribute.trait_type}>
                <dt>{attribute.trait_type}</dt>
                <dd>{attribute.value}</dd>
              </Attribute>
            ))}
          </Attributes>
        )}
      </CardBody>
    </NftArticle>
  );
};

export default NftCard;

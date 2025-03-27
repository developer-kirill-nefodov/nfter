import {useState} from 'react';

import type {INft} from '../../types/nft';

import {
  Attribute,
  Attributes,
  CardBody,
  CardImage,
  CardName,
  CardRarity,
  CardTrigger,
  ImageFallback,
  NftArticle,
} from './styles';

interface INftCard {
  nft: INft;
  onOpen: (nft: INft) => void;
}

const rarityOf = (nft: INft) =>
  nft.attributes.find(({trait_type}) => trait_type === 'Tier' || trait_type === 'Rarity')?.value;

const NftCard = ({nft, onOpen}: INftCard) => {
  const [broken, setBroken] = useState(false);

  const rarity = String(rarityOf(nft) ?? '');
  const traits = nft.attributes.filter(
    ({trait_type}) => trait_type !== 'Tier' && trait_type !== 'Rarity',
  );

  return (
    // The whole card is the button: the art is what this project is about, and a
    // gallery you cannot open is a dead end.
    <CardTrigger type="button" onClick={() => onOpen(nft)} aria-label={`Open ${nft.name}`}>
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
          {rarity && <CardRarity $rarity={rarity.toLowerCase()}>{rarity}</CardRarity>}

          {traits.length > 0 && (
            <Attributes>
              {traits.slice(0, 2).map((attribute) => (
                <Attribute key={attribute.trait_type}>
                  <dt>{attribute.trait_type}</dt>
                  <dd>{attribute.value}</dd>
                </Attribute>
              ))}
            </Attributes>
          )}
        </CardBody>
      </NftArticle>
    </CardTrigger>
  );
};

export default NftCard;

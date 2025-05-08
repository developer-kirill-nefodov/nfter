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
  index?: number;
}

const rarityOf = (nft: INft) =>
  nft.attributes.find(({trait_type}) => trait_type === 'Tier' || trait_type === 'Rarity')?.value;

const NftCard = ({nft, onOpen, index = 0}: INftCard) => {
  const [broken, setBroken] = useState(false);

  const rarity = String(rarityOf(nft) ?? '');
  const traits = nft.attributes.filter(
    ({trait_type}) => trait_type !== 'Tier' && trait_type !== 'Rarity',
  );

  return (
    <CardTrigger
      type="button"
      onClick={() => onOpen(nft)}
      aria-label={`Open ${nft.name}`}
      $delay={Math.min(index, 8) * 45}
    >
      <NftArticle $rarity={rarity.toLowerCase()}>
        {nft.image && !broken ? (
          <CardImage
            src={nft.image}
            alt={nft.name}
            loading="lazy"
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

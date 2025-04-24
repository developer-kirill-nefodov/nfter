import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import type {INft} from '../../types/nft';
import {explorerToken} from '../../web3/contracts';
import Button from '../Button';
import Modal from '../Modal';
import {toast} from '../Toastify/toast';

import {
  Attribute,
  Attributes,
  ModalArt,
  ModalHeader,
  ModalLinks,
  ModalSubtitle,
  ModalTitle,
  RarityBadge,
} from './styles';

interface INftModal {
  nft: INft | null;
  contract: string;
  onClose: () => void;
  /** Set right after a mint: the dialog congratulates instead of just informing. */
  reveal?: boolean;
  txHash?: string | null;
}

const rarityOf = (nft: INft) =>
  nft.attributes.find(({trait_type}) => trait_type === 'Tier' || trait_type === 'Rarity')?.value;

const NftModal = ({nft, contract, onClose, reveal = false, txHash}: INftModal) => {
  const {t} = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!nft) {
    return null;
  }

  const rarity = String(rarityOf(nft) ?? '');

  const copyUri = async () => {
    try {
      await navigator.clipboard.writeText(nft.tokenUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(t('nftModal.copyFailed'), 'error');
    }
  };

  return (
    <Modal open onClose={onClose} label={nft.name}>
      <ModalHeader>
        <ModalTitle>{reveal ? t('nftModal.revealTitle') : nft.name}</ModalTitle>
        {rarity && <RarityBadge $rarity={rarity.toLowerCase()}>{rarity}</RarityBadge>}
      </ModalHeader>

      {reveal && <ModalSubtitle>{nft.name}</ModalSubtitle>}

      {/* The image is a data: URI straight from the contract — nothing is fetched
          to render this, which is the whole point of the collection. */}
      <ModalArt src={nft.image} alt={nft.name} $reveal={reveal} />

      {nft.description && <ModalSubtitle>{nft.description}</ModalSubtitle>}

      {nft.attributes.length > 0 && (
        <Attributes>
          {nft.attributes.map((attribute) => (
            <Attribute key={attribute.trait_type}>
              <dt>{attribute.trait_type}</dt>
              <dd>{attribute.value}</dd>
            </Attribute>
          ))}
        </Attributes>
      )}

      <ModalLinks>
        <a
          href={explorerToken(contract, nft.tokenId)}
          target="_blank"
          rel="noreferrer noopener"
        >
          {t('nftModal.etherscan')}
        </a>

        {txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {t('nftModal.transaction')}
          </a>
        )}

        {/* Paste it into a browser and the JSON appears. That is the proof the
            metadata is on chain and not on somebody's server. */}
        <Button variant="ghost" onClick={() => void copyUri()}>
          {copied ? t('nftModal.copied') : t('nftModal.copyUri')}
        </Button>
      </ModalLinks>
    </Modal>
  );
};

export default NftModal;

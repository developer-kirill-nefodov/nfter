import {useTranslation} from 'react-i18next';

import {explorerAddress} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {
  Avatar,
  Crown,
  EmptyPodium,
  PodiumBlock,
  PodiumGrid,
  PodiumName,
  PodiumValue,
} from './styles';

export interface IPodiumEntry {
  address: string;
  value: string;
  subtitle: string;
}

const CROWNS = ['🥇', '🥈', '🥉'];

const Podium = ({entries, you}: {entries: IPodiumEntry[]; you: string | null}) => {
  const {t} = useTranslation();

  const order = [1, 0, 2];

  return (
    <PodiumGrid>
      {order.map((index) => {
        const entry = entries[index];

        if (!entry) {
          return (
            <EmptyPodium key={`vacant-${String(index)}`} $place={index}>
              <Crown>{CROWNS[index]}</Crown>
              <span>{t('rating.vacant')}</span>
            </EmptyPodium>
          );
        }

        const isYou = you?.toLowerCase() === entry.address.toLowerCase();

        return (
          <PodiumBlock key={entry.address} $place={index} $you={isYou}>
            <Crown>{CROWNS[index]}</Crown>
            <Avatar $address={entry.address} aria-hidden="true" />
            <PodiumName
              href={explorerAddress(entry.address)}
              target="_blank"
              rel="noreferrer noopener"
            >
              {formatAddress(entry.address)}
            </PodiumName>
            <PodiumValue>{entry.value}</PodiumValue>
            <span>{entry.subtitle}</span>
            {isYou && <strong>{t('tip.you')}</strong>}
          </PodiumBlock>
        );
      })}
    </PodiumGrid>
  );
};

export default Podium;

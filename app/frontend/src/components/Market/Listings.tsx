import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {buyListingRequest, cancelListingRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';

import type {INft} from '../../types/nft';
import {formatAddress} from '../../web3/wallet';
import Button from '../Button';
import NftModal from '../Nft/NftModal';
import {SkeletonCard, SkeletonGrid} from '../Skeleton';

import {Body, Empty, Grid, ListingCard, Name, PriceRow, Rarity, Seller} from './styles';

const Listings = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const {book, loading, error} = useStoreSelector((state) => state.market);
  const wallet = useStoreSelector((state) => state.user.user.walletAddress);
  const stage = useStoreSelector((state) => state.tx.stage);

  const [open, setOpen] = useState<{nft: INft; contract: string} | null>(null);

  const busy = stage === 'estimating' || stage === 'signing' || stage === 'pending';

  if (loading && !book) {
    return (
      <SkeletonGrid aria-busy="true">
        {Array.from({length: 4}, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </SkeletonGrid>
    );
  }

  if (error) {
    return <Empty role="alert">{error}</Empty>;
  }

  if (!book || book.listings.length === 0) {
    return <Empty>{t('market.empty')}</Empty>;
  }

  return (
    <>
      <Grid>
        {book.listings.map((listing, index) => {
          const mine = wallet?.toLowerCase() === listing.seller.toLowerCase();
          const rarity = listing.rarity.toLowerCase();

          return (
            <ListingCard
              key={`${listing.collection}-${listing.tokenId}`}
              $rarity={rarity}
              $delay={index * 45}
            >
              <img
                src={listing.image}
                alt={listing.name}
                loading="lazy"
                onClick={() =>
                  setOpen({
                    contract: listing.collection,
                    nft: {
                      tokenId: listing.tokenId,
                      tokenUri: '',
                      name: listing.name,
                      description: '',
                      image: listing.image,
                      attributes: [{trait_type: 'Tier', value: listing.rarity}],
                    },
                  })
                }
              />

              <Body>
                <Name title={listing.name}>{listing.name}</Name>
                <Rarity $rarity={rarity}>{listing.rarity}</Rarity>

                <PriceRow>
                  <strong>{listing.priceEth} Ξ</strong>
                  <span>{t('market.price')}</span>
                </PriceRow>

                <Seller>
                  {mine ? t('market.yourListing') : formatAddress(listing.seller)}
                </Seller>

                {mine ? (
                  <Button
                    variant="danger"
                    disabled={busy}
                    onClick={() =>
                      dispatch(
                        cancelListingRequest({
                          collection: listing.collection,
                          tokenId: listing.tokenId,
                        }),
                      )
                    }
                  >
                    {t('market.cancel')}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    disabled={busy || !wallet}
                    onClick={() =>
                      dispatch(
                        buyListingRequest({
                          collection: listing.collection,
                          tokenId: listing.tokenId,
                          priceWei: listing.price,
                        }),
                      )
                    }
                  >
                    {t('market.buy', {price: listing.priceEth})}
                  </Button>
                )}
              </Body>
            </ListingCard>
          );
        })}
      </Grid>

      <NftModal
        nft={open?.nft ?? null}
        contract={open?.contract ?? ''}
        onClose={() => setOpen(null)}
      />
    </>
  );
};

export default Listings;

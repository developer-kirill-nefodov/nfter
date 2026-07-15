import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {listTokenRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {isTxBusy} from '../../store/reducers/tx-slice';
import {Row, Stack, Subtitle, Title} from '../../styles';
import Button from '../Button';
import Modal from '../Modal';
import {isApprovedForMarket} from '../../web3/transactions';

import {Field, ListedTag, Pick, Picker, PriceInput, Quote} from './styles';

const DEFAULT_FEE_BPS = 250n;

const toWei = (eth: string): bigint => {
  const [whole = '0', fraction = ''] = eth.split('.');

  return BigInt(whole + fraction.padEnd(18, '0').slice(0, 18));
};

const format = (wei: bigint) => (Number(wei) / 1e18).toFixed(4);

const ListDialog = ({onClose}: {onClose: () => void}) => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const holdings = useStoreSelector((state) => state.nft.holdings);
  const stage = useStoreSelector((state) => state.tx.stage);

  const book = useStoreSelector((state) => state.market.book);

  const listed = new Set(
    (book?.listings ?? []).map(
      (listing) => `${listing.collection.toLowerCase()}-${listing.tokenId}`,
    ),
  );

  const owned = (holdings?.collections ?? []).flatMap((collection) =>
    collection.items.map((nft) => ({
      ...nft,
      collection: collection.contract,
      tokenKey: `${collection.contract.toLowerCase()}-${nft.tokenId}`,
      listed: listed.has(`${collection.contract.toLowerCase()}-${nft.tokenId}`),
    })),
  );

  // Track the selection by identity, not by array index. `owned` is recomputed on every render from
  // live holdings and the market book, and useLiveFeed refetches both on any chain event — an index
  // silently starts pointing at a different token, so "List it" would list one the user never chose.
  const [selectedId, setSelectedId] = useState<string | null>(owned[0]?.tokenKey ?? null);
  const [price, setPrice] = useState('0.05');
  const [approved, setApproved] = useState<boolean | null>(null);

  const wallet = useStoreSelector((state) => state.user.user.walletAddress);

  const current = owned.find((nft) => nft.tokenKey === selectedId) ?? owned[0];
  const collection = current?.collection;

  useEffect(() => {
    if (!wallet || !collection) {
      return;
    }

    let current = true;

    void isApprovedForMarket(collection, wallet)
      .then((value) => {
        if (current) {
          setApproved(value);
        }
      })
      .catch(() => setApproved(null));

    return () => {
      current = false;
    };
  }, [wallet, collection]);

  const busy = isTxBusy(stage);

  const feeBps = BigInt(book?.feeBps ?? Number(DEFAULT_FEE_BPS));
  const wei = /^\d*\.?\d{0,18}$/.test(price) ? toWei(price || '0') : 0n;
  const fee = (wei * feeBps) / 10_000n;
  const token = current?.listed ? undefined : current;

  return (
    <Modal open onClose={onClose} label={t('market.sell')}>
      <Stack $gap="20px">
        <Title as="h2">{t('market.sell')}</Title>

        {owned.length === 0 ? (
          <Subtitle>{t('market.nothingToSell')}</Subtitle>
        ) : (
          <>
            <Field>
              <label>{t('market.pickToken')}</label>
              <Picker>
                {owned.map((nft) => (
                  <Pick
                    key={nft.tokenKey}
                    type="button"
                    disabled={nft.listed}
                    $active={nft.tokenKey === current?.tokenKey}
                    aria-pressed={nft.tokenKey === current?.tokenKey}
                    onClick={() => setSelectedId(nft.tokenKey)}
                  >
                    {nft.listed && <ListedTag>{t('market.alreadyListed')}</ListedTag>}
                    <img src={nft.image} alt={nft.name} />
                    <small>{nft.name}</small>
                  </Pick>
                ))}
              </Picker>
            </Field>

            <Field>
              <label htmlFor="market-price">{t('market.priceLabel')}</label>
              <PriceInput
                id="market-price"
                inputMode="decimal"
                value={price}
                disabled={busy}
                onChange={(event) => setPrice(event.target.value)}
              />
            </Field>

            <Quote>
              <div>
                <span>{t('market.fee')}</span>
                <strong>{format(fee)} ETH</strong>
              </div>
              <div>
                <span>{t('market.youGet')}</span>
                <strong>{format(wei - fee)} ETH</strong>
              </div>
            </Quote>

            <Subtitle>
              {approved === false ? t('market.approvalFirst') : t('market.approvalHint')}
            </Subtitle>

            <Row $justify="flex-end">
              <Button
                loading={busy}
                disabled={busy || wei === 0n || !token}
                onClick={() => {
                  if (!token) {
                    return;
                  }

                  dispatch(
                    listTokenRequest({
                      collection: token.collection,
                      tokenId: token.tokenId,
                      priceWei: wei.toString(),
                    }),
                  );

                  onClose();
                }}
              >
                {t('market.listIt')}
              </Button>
            </Row>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default ListDialog;

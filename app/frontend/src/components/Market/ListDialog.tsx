import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {listTokenRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle, Title} from '../../styles';
import Button from '../Button';
import Modal from '../Modal';

import {Field, Pick, Picker, PriceInput, Quote} from './styles';

const FEE_BPS = 250n;

/** Wei has 18 decimals and floating point cannot hold them. Parse the string. */
const toWei = (eth: string): bigint => {
  const [whole = '0', fraction = ''] = eth.split('.');

  return BigInt(whole + fraction.padEnd(18, '0').slice(0, 18));
};

const format = (wei: bigint) => (Number(wei) / 1e18).toFixed(4);

/**
 * Pick one of your tokens, name a price.
 *
 * The cut is shown before anything is signed — a seller should know what lands
 * in their pocket while they can still change the number, not afterwards.
 */
const ListDialog = ({onClose}: {onClose: () => void}) => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const holdings = useStoreSelector((state) => state.nft.holdings);
  const stage = useStoreSelector((state) => state.tx.stage);

  const owned = (holdings?.collections ?? []).flatMap((collection) =>
    collection.items.map((nft) => ({...nft, collection: collection.contract})),
  );

  const [selected, setSelected] = useState(0);
  const [price, setPrice] = useState('0.05');

  const busy = stage === 'estimating' || stage === 'signing' || stage === 'pending';

  const wei = /^\d*\.?\d{0,18}$/.test(price) ? toWei(price || '0') : 0n;
  const fee = (wei * FEE_BPS) / 10_000n;
  const token = owned[selected];

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
                {owned.map((nft, index) => (
                  <Pick
                    key={`${nft.collection}-${nft.tokenId}`}
                    type="button"
                    $active={index === selected}
                    aria-pressed={index === selected}
                    onClick={() => setSelected(index)}
                  >
                    <img src={nft.image} alt={nft.name} />
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

            {/* The market takes 2.5%, and says so before you sign. */}
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

            <Subtitle>{t('market.approvalHint')}</Subtitle>

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

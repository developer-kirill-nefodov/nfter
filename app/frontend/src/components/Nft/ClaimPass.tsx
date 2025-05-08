import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import {checkClaimRequest, claimPassRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle, Title} from '../../styles';
import Button from '../Button';

import {ClaimCard} from './styles';

const ClaimPass = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const wallet = useStoreSelector((state) => state.user.user.walletAddress);
  const claimed = useStoreSelector((state) => state.nft.claimed);
  const stage = useStoreSelector((state) => state.tx.stage);

  useEffect(() => {
    if (wallet) {
      dispatch(checkClaimRequest(wallet));
    }
  }, [dispatch, wallet]);

  if (!wallet || claimed === true) {
    return null;
  }

  const busy = stage === 'estimating' || stage === 'signing' || stage === 'pending';

  return (
    <ClaimCard>
      <Row $justify="space-between" $wrap $gap="16px">
        <Stack $gap="4px">
          <Title as="h2">{t('pass.title')}</Title>
          <Subtitle>{t('pass.subtitle')}</Subtitle>
        </Stack>

        <Button loading={busy} disabled={busy} onClick={() => dispatch(claimPassRequest())}>
          {t('pass.claim')}
        </Button>
      </Row>
    </ClaimCard>
  );
};

export default ClaimPass;

import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {Navigate} from 'react-router-dom';

import ContractsPanel from '../../components/Chain/ContractsPanel';
import {fetchTreasuryRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Card, Row, Stack, Subtitle, Title} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {explorerAddress} from '../../web3/contracts';
import {formatAddress} from '../../web3/wallet';

import {Line, Total} from './styles';

const TreasuryPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const user = useStoreSelector((state) => state.user.user);
  const treasury = useStoreSelector((state) => state.referral.treasury);

  useEffect(() => {
    dispatch(fetchTreasuryRequest());
  }, [dispatch]);

  if (user.role.name === 'VISITOR') {
    return <Navigate to={NavigateUrls.auth.login} replace />;
  }

  if (!user.isFounder) {
    return (
      <Card>
        <Stack $gap="8px">
          <Title>{t('treasury.title')}</Title>
          <Subtitle>{t('treasury.notFounder')}</Subtitle>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack $gap="32px">
      <Stack $gap="8px">
        <Title>{t('treasury.title')}</Title>
        <Subtitle>{t('treasury.subtitle')}</Subtitle>
      </Stack>

      {treasury && (
        <>
          <Total>
            <Subtitle>{t('treasury.total')}</Subtitle>
            <strong>{Number(treasury.totalEth).toFixed(4)} ETH</strong>
            <Subtitle>
              {t('treasury.owner')}{' '}
              <a href={explorerAddress(treasury.owner)} target="_blank" rel="noreferrer noopener">
                {formatAddress(treasury.owner)}
              </a>
            </Subtitle>
          </Total>

          <Card>
            <Stack $gap="12px">
              <Line>
                <span>{t('treasury.mintRevenue')}</span>
                <strong>{Number(treasury.artifacts.balanceEth).toFixed(4)} Ξ</strong>
              </Line>
              <Line>
                <span>{t('treasury.tips')}</span>
                <strong>{Number(treasury.tipJar.balanceEth).toFixed(4)} Ξ</strong>
              </Line>
              <Line>
                <span>{t('treasury.marketFees')}</span>
                <strong>{Number(treasury.marketplace.proceedsEth).toFixed(4)} Ξ</strong>
              </Line>

              <Line $muted>
                <span>{t('treasury.owedToReferrers')}</span>
                <strong>{Number(treasury.referrals.balanceEth).toFixed(4)} Ξ</strong>
              </Line>
            </Stack>
          </Card>

          <ContractsPanel />

          <Row $gap="12px" $wrap>
            <Subtitle>{t('treasury.withdrawHint')}</Subtitle>
          </Row>
        </>
      )}
    </Stack>
  );
};

export default TreasuryPage;

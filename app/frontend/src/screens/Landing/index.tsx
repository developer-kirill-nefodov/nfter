import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';

import Button from '../../components/Button';
import {fetchStatsRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {Row, Stack, Subtitle} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {explorerAddress} from '../../web3/contracts';
import {CHAIN_NAME, formatAddress} from '../../web3/wallet';

import {
  Feature,
  Features,
  Hero,
  HeroCopy,
  HeroTitle,
  Highlight,
  Section,
  SectionTitle,
  Showcase,
  ShowcaseCard,
  ShowcaseSkeleton,
  Stat,
  StatLabel,
  StatValue,
  Stats,
} from './styles';

/**
 * The public face of the project.
 *
 * Everything here is readable without a wallet and without an account: the
 * numbers come from the chain, the art comes from the contract. A landing page
 * that demands a connection before it will explain itself is a landing page
 * nobody reads.
 */
const LandingPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const {stats, loading} = useStoreSelector((state) => state.stats);
  const user = useStoreSelector((state) => state.user.user);

  useEffect(() => {
    dispatch(fetchStatsRequest());
  }, [dispatch]);

  const isVisitor = user.role.name === 'VISITOR';

  return (
    <Stack $gap="64px">
      <Hero>
        <HeroCopy>
          <Highlight>{t('landing.badge', {chain: CHAIN_NAME})}</Highlight>
          <HeroTitle>{t('landing.title')}</HeroTitle>
          <Subtitle>{t('landing.subtitle')}</Subtitle>

          <Row $gap="12px" $wrap>
            <Link to={isVisitor ? NavigateUrls.auth.register : NavigateUrls.dashboard}>
              <Button>{t(isVisitor ? 'landing.getStarted' : 'landing.openDashboard')}</Button>
            </Link>
            <Link to={NavigateUrls.tip}>
              <Button variant="ghost">{t('landing.support')}</Button>
            </Link>
          </Row>
        </HeroCopy>

        {/* The hero art is a real minted pass, not a mockup. */}
        {stats?.showcase[0] && (
          <img src={stats.showcase[0].image} alt={stats.showcase[0].name} width={280} height={280} />
        )}
      </Hero>

      <Stats>
        <Stat>
          <StatValue>{stats?.passesMinted ?? '—'}</StatValue>
          <StatLabel>{t('landing.stats.minted')}</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{stats?.holders ?? '—'}</StatValue>
          <StatLabel>{t('landing.stats.holders')}</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{stats ? `${stats.tipsTotalEth} Ξ` : '—'}</StatValue>
          <StatLabel>{t('landing.stats.raised')}</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{stats?.tipCount ?? '—'}</StatValue>
          <StatLabel>{t('landing.stats.tips')}</StatLabel>
        </Stat>
      </Stats>

      <Section>
        <SectionTitle>{t('landing.showcase')}</SectionTitle>
        <Subtitle>{t('landing.showcaseHint')}</Subtitle>

        <Showcase>
          {loading &&
            Array.from({length: 4}, (_, index) => <ShowcaseSkeleton key={index} aria-hidden />)}

          {!loading &&
            stats?.showcase.map((item) => (
              <ShowcaseCard key={item.tokenId}>
                <img src={item.image} alt={item.name} loading="lazy" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.rarity}</span>
                  <code>{formatAddress(item.minter)}</code>
                </div>
              </ShowcaseCard>
            ))}

          {!loading && stats?.showcase.length === 0 && (
            <Subtitle>{t('landing.showcaseEmpty')}</Subtitle>
          )}
        </Showcase>
      </Section>

      <Section>
        <SectionTitle>{t('landing.how')}</SectionTitle>

        <Features>
          {(['art', 'siwe', 'tx', 'indexer'] as const).map((key) => (
            <Feature key={key}>
              <strong>{t(`landing.features.${key}.title`)}</strong>
              <p>{t(`landing.features.${key}.body`)}</p>
            </Feature>
          ))}
        </Features>
      </Section>

      {stats?.deployed && (
        <Section>
          <SectionTitle>{t('landing.contracts')}</SectionTitle>
          <Row $gap="16px" $wrap>
            <a href={explorerAddress(stats.passContract)} target="_blank" rel="noreferrer noopener">
              EthersWeb3Pass — {formatAddress(stats.passContract)}
            </a>
            <a
              href={explorerAddress(stats.tipJarContract)}
              target="_blank"
              rel="noreferrer noopener"
            >
              TipJar — {formatAddress(stats.tipJarContract)}
            </a>
          </Row>
        </Section>
      )}
    </Stack>
  );
};

export default LandingPage;

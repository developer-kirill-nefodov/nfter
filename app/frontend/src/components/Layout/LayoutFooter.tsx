import {useTranslation} from 'react-i18next';

import LogoMark from '../../assets/svg/nfter-logo.svg';
import {PASS_ADDRESS, explorerAddress} from '../../web3/contracts';
import {CHAIN_NAME} from '../../web3/wallet';

import {Footer, FooterBar, FooterBrand, FooterLink, FooterLinks, FooterNet, Logo} from './styles';

const REPO_URL = 'https://github.com/developer-kirill-nefodov/nfter';

const LayoutFooter = () => {
  const {t} = useTranslation();

  return (
    <Footer>
      <FooterBar>
        <FooterBrand>
          <Logo src={LogoMark} alt="" />
          Nfter
        </FooterBrand>

        <FooterNet>{t('footer.network', {chain: CHAIN_NAME})}</FooterNet>

        <FooterLinks>
          <FooterLink href={REPO_URL} target="_blank" rel="noreferrer noopener">
            {t('footer.github')}
          </FooterLink>
          {PASS_ADDRESS && (
            <FooterLink
              href={explorerAddress(PASS_ADDRESS)}
              target="_blank"
              rel="noreferrer noopener"
            >
              {t('footer.etherscan')}
            </FooterLink>
          )}
          <span>{t('footer.rights', {years: '2024–2026'})}</span>
        </FooterLinks>
      </FooterBar>
    </Footer>
  );
};

export default LayoutFooter;

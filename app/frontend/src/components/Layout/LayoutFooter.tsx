import {useTranslation} from 'react-i18next';

import {CHAIN_NAME} from '../../web3/wallet';

import {Footer} from './styles';

const LayoutFooter = () => {
  const {t} = useTranslation();

  return (
    <Footer>
      <span>{t('footer.network', {chain: CHAIN_NAME})}</span>
      <a href="https://github.com/developer-kirill-nefodov/ethers-web3" rel="noreferrer noopener">
        github.com/developer-kirill-nefodov/ethers-web3
      </a>
    </Footer>
  );
};

export default LayoutFooter;

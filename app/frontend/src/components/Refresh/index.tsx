import {useTranslation} from 'react-i18next';

import {RefreshIcon, RefreshTrigger} from './styles';

interface IRefresh {
  onClick: () => void;
  spinning?: boolean;
  label?: string;
}

const Refresh = ({onClick, spinning = false, label}: IRefresh) => {
  const {t} = useTranslation();
  const text = label ?? t('nft.refresh');

  return (
    <RefreshTrigger
      type="button"
      onClick={onClick}
      disabled={spinning}
      aria-label={text}
      title={text}
      aria-busy={spinning}
    >
      <RefreshIcon $spinning={spinning} aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M20 11a8 8 0 1 0-.6 3M20 5v6h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </RefreshIcon>
    </RefreshTrigger>
  );
};

export default Refresh;

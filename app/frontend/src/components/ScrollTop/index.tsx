import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {Fab} from './styles';

const REVEAL_AFTER_PX = 600;

const ScrollTop = () => {
  const {t} = useTranslation();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > REVEAL_AFTER_PX);

    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Fab
      type="button"
      $shown={shown}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      aria-label={t('nav.backToTop')}
      onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
    >
      ↑
    </Fab>
  );
};

export default ScrollTop;

import type {ReactNode} from 'react';
import {useLocation} from 'react-router-dom';

import {Fade} from './styles';

const PageTransition = ({children}: {children: ReactNode}) => {
  const {pathname} = useLocation();

  return <Fade key={pathname}>{children}</Fade>;
};

export default PageTransition;
